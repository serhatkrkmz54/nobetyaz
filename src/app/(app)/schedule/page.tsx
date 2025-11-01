'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Member, getMemberByUserId, getAllMembers } from "@/services/memberService";
import {
  getScheduleByPeriod,
  ScheduledShift,
  generateScheduleForMonth,
  solveScheduleAPI,
  getSolverStatusAPI,
  exportScheduleAPI
} from "@/services/scheduleService";

import { Button } from "@/components/ui/button";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ShiftDetailModal from "@/components/ShiftDetailModal";
import { EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { Calendar, PlusCircle, Loader2, Wand2, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { getAllHolidays, Holiday } from "@/services/holidayService";
import { useDataCacheStore } from "@/store/dataCacheStore";
import { isFeatureEnabledAPI } from "@/services/featureFlagService";
import { HelpTooltip } from "@/components/HelpTooltip";

export default function ScheduleManagementPage() {
  const { user } = useAuthStore();
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [holidayEvents, setHolidayEvents] = useState<EventInput[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [viewDates, setViewDates] = useState<{ start: string, end: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const lastScheduleUpdate = useDataCacheStore((state) => state.lastScheduleUpdate);
  const [isExporting, setIsExporting] = useState(false);
  const [isBiddingEnabled, setIsBiddingEnabled] = useState(false);
  const [isFlagLoading, setIsFlagLoading] = useState(true);

  const fetchSchedule = useCallback(async (startDate: string, endDate: string) => {
    setIsLoadingCalendar(true);
    try {
      const shifts = await getScheduleByPeriod(startDate, endDate);
      const calendarEvents = shifts.map((shift: ScheduledShift) => ({
        id: shift.id,
        title: shift.member ? `${shift.member.firstName} ${shift.member.lastName}` : (shift.status === 'BIDDING' ? `BORSADA - ${shift.location.name}` : `BOŞ - ${shift.location.name}`),
        start: `${shift.shiftDate}T${shift.startTime}`,
        end: `${shift.shiftDate}T${shift.endTime}`,
        backgroundColor: shift.status === 'BIDDING' ? '#f59e0b' : (shift.member ? '#3b82f6' : '#ef4444'),
        borderColor: shift.status === 'BIDDING' ? '#f59e0b' : (shift.member ? '#3b82f6' : '#ef4444'),
        extendedProps: { ...shift }
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching schedule for calendar", error);
      toast.error("Hata!", { description: "Nöbet çizelgesi yüklenemedi." });
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  const fetchHolidays = useCallback(async (startDate: string, endDate: string) => {
    try {
      const holidays = await getAllHolidays(startDate, endDate);
      const holidayCalendarEvents = holidays.map((holiday: Holiday) => ({
        id: `holiday-${holiday.id}`,
        title: holiday.name,
        start: holiday.holidayDate,
        allDay: true,
        display: 'background',
        backgroundColor: '#86efac',
        textColor: '#000000ff'
      }));
      setHolidayEvents(holidayCalendarEvents);
    } catch (error) {
      console.error("Error fetching holidays for calendar", error);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [memberData, allMembersData, biddingFlag] = await Promise.all([
        getMemberByUserId(user.id),
        getAllMembers(),
        isFeatureEnabledAPI('ALLOW_SHIFT_BIDDING')
      ]);

      setIsBiddingEnabled(biddingFlag);

      if (memberData) setCurrentMember(memberData);
      else {
        console.error("Giriş yapan kullanıcıya ait personel kaydı bulunamadı.");
        if (!user.roles.includes('ROLE_ADMIN')) {
          toast.error("Hata!", { description: "Personel bilgileriniz alınamadı." });
        }
      }

      setMembers(allMembersData);

    } catch (error) {
      console.error("Gerekli veriler çekilemedi:", error);
      toast.error("Hata!", { description: "Kullanıcı veya personel verileri çekilemedi." });
      setIsBiddingEnabled(false);
    } finally {
      setIsFlagLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();

    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

    setViewDates({ start: startDate, end: endDate });
    fetchSchedule(startDate, endDate);
    fetchHolidays(startDate, endDate);

  }, [fetchInitialData, fetchSchedule, fetchHolidays]);

  useEffect(() => {

    if (viewDates) {
      console.log("Global sinyal algılandı, Çizelge Yönetimi takvimi yenileniyor...");
      fetchSchedule(viewDates.start, viewDates.end);
      fetchHolidays(viewDates.start, viewDates.end);
    }
  }, [lastScheduleUpdate, fetchSchedule, fetchHolidays]);

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    try {
      const message = await generateScheduleForMonth(selectedYear, selectedMonth);
      toast.success("Başarılı!", { description: message });
      if (viewDates) {
        fetchSchedule(viewDates.start, viewDates.end);
        fetchHolidays(viewDates.start, viewDates.end);
      }
    } catch (error: any) {
      console.error("Çizelge oluşturulamadı:", error);
      toast.error("Hata!", {
        description: error.response?.data?.message || "Çizelge oluşturulurken bir hata oluştu.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDatesSet = useCallback((start: string, end: string) => {
    const startDate = new Date(start);
    const middleDate = new Date(startDate.getTime() + (15 * 24 * 60 * 60 * 1000));
    setSelectedYear(middleDate.getFullYear());
    setSelectedMonth(middleDate.getMonth() + 1);

    setViewDates(prev => {
      const changed = !prev || prev.start !== start || prev.end !== end;
      if (changed) {
        fetchSchedule(start, end);
        fetchHolidays(start, end);
        return { start, end };
      }
      return prev;
    });
  }, [fetchSchedule, fetchHolidays]);

  const handleEventClick = (clickedEvent: EventClickArg) => {
    const eventId = clickedEvent.event.id;
    if (eventId.startsWith('holiday-')) {
      console.log("Tıklanan: Tatil kaydı -", clickedEvent.event.title);
      toast.info(`Tatil: ${clickedEvent.event.title}`, {
        description: "Bu gün resmi tatil veya özel gün olarak işaretlenmiş."
      });
      return;
    }

    const shiftData = clickedEvent.event.extendedProps as ScheduledShift;
    console.log("Tıklanan: Nöbet kaydı -", shiftData);

    setSelectedShift(shiftData);
    setIsModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Excel dosyası hazırlanıyor...", {
      description: `${selectedYear} / ${selectedMonth} ayı indiriliyor.`
    });
    try {
      await exportScheduleAPI(selectedYear, selectedMonth);
    } catch (error) {
      console.error("Excel dışa aktarma hatası:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);

    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
      function tick() {
        savedCallback.current?.();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  };

  const handleSolveClick = async () => {
    setIsSolving(true);
    toast.info("Yapay Zeka Planlayıcı Başlatıldı", {
      description: `Sistem, ${selectedMonth} ${selectedYear} ayı için en adil nöbet dağılımını hesaplıyor. İşlem bittiğinde bir bildirim alacaksınız.`
    });

    try {
      const problemId = await solveScheduleAPI(selectedYear, selectedMonth);
      console.log("Otomatik planlama işi başlatıldı, Takip ID:", problemId);

      setTimeout(() => {
        setIsSolving(false);
      }, 31000);

    } catch (error: any) {
      console.error("Otomatik planlama BAŞLATILAMADI:", error);
      toast.error("Planlama Başlatılamadı!", {
        description: error.response?.data?.message || "İşlem başlatılırken bir hata oluştu.",
      });
      setIsSolving(false);
    }
  };

  useInterval(
    async () => {
      if (!currentProblemId) return;

      console.log("Çözücü durumu sorgulanıyor...", currentProblemId);
      try {
        const status = await getSolverStatusAPI(currentProblemId);
        console.log("Çözücü Durumu:", status);

        // --- İYİLEŞTİRME: Çözücü durum takibi ---
        if (status === 'SOLVING_SCHEDULED' || status === 'SOLVING_ACTIVE') {
          setIsSolving(true); // Yükleniyor durumunu koru
          return; // Henüz bitmedi, interval devam etsin
        }

        // İşlem bittiyse (FEASIBLE, UNFEASIBLE, BROKEN, NOT_SOLVING)
        setIsSolving(false);
        setCurrentProblemId(null); // Takibi durdur

        if (status === 'FEASIBLE' || status === 'NOT_SOLVING') { // NOT_SOLVING = Çözüm bitmiş
          toast.success("Planlama Tamamlandı!", { description: "Atamalar başarıyla kaydedildi. Takvim yenileniyor..." });
          if (viewDates) {
            fetchSchedule(viewDates.start, viewDates.end);
          }
        } else { // (UNFEASIBLE veya BROKEN)
          toast.error("Planlama Başarısız!", {
            description: `Otomatik planlama bir çözüm bulamadı (Durum: ${status}). Kurallar çok kısıtlayıcı veya yeterli personel yok.`,
            duration: 10000
          });
        }
        // --- İYİLEŞTİRME BİTTİ ---
      } catch (error) {
        console.error("Durum sorgulama hatası:", error);
        toast.error("Hata", { description: "Planlama durumu sorgulanırken bir hata oluştu." });
        setIsSolving(false);
        setCurrentProblemId(null);
      }
    },
    isSolving ? 5000 : null
  );

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleModalUpdate = () => {
    if (viewDates) {
      fetchSchedule(viewDates.start, viewDates.end);
    }
  };

  if (!user || !currentMember || isFlagLoading) {

    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAdminOrScheduler = user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_SCHEDULER');

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">

        {isAdminOrScheduler && (
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-3">Çizelge Hazırlama Aracı</h2>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="year-select" className="text-xs text-muted-foreground">Yıl</Label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger id="year-select" className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="month-select" className="text-xs text-muted-foreground">Ay</Label>
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger id="month-select" className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m.toString()}>
                        {new Date(0, m - 1).toLocaleString('tr', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateClick} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
                Boş Nöbetleri Oluştur
              </Button>
              <HelpTooltip>
                  <p className="font-semibold">Adım 1: Boş Nöbetler</p>
                  <p>Bu buton, seçtiğiniz ay için (örn: "Acil Servis 17:00") gereken boş nöbet kadrolarını oluşturur.</p>
                </HelpTooltip>
              <Button
                onClick={handleSolveClick}
                disabled={isGenerating || isSolving}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                {isSolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                2. Otomatik Doldur
              </Button>
              <HelpTooltip>
                  <p className="font-semibold">Adım 2: Otomatik Doldur</p>
                  <p>Yapay zeka planlayıcıyı (Timefold) başlatır. Boş nöbetleri, kurallara ve personel tercihlerine göre adil bir şekilde dağıtır.</p>
                </HelpTooltip>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isGenerating || isSolving || isExporting}
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Excel Olarak Dışa Aktar
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow min-h-[600px]">
          <ScheduleCalendar
            events={[...events, ...holidayEvents]}
            isLoading={isLoadingCalendar}
            onEventClick={handleEventClick}
            onDatesSet={handleDatesSet}
            isReadOnly={!isAdminOrScheduler}
          />
        </div>
      </main>

      <ShiftDetailModal
        shift={selectedShift}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleModalUpdate}
        members={members}
        isBiddingEnabled={isBiddingEnabled}
      />
    </>
  );
}