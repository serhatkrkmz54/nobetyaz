'use client';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Member, getMemberByUserId, getAllMembers } from "@/services/memberService";
import { getMyRequestsAPI, ShiftChangeResponseData } from "@/services/shiftChangeService";
import { getAdminDashboardStatsAPI, getMemberMonthlySummary, MonthlySummary } from "@/services/reportingService";
import { getScheduleByPeriod, ScheduledShift } from "@/services/scheduleService";

import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import LoadingScreen from "@/components/LoadingScreen";
import { EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import {
  Users,
  ArrowRightLeft,
  Briefcase,
  Clock,
  Calendar,
  PlusCircle,
  Loader2,
  Maximize2,
  Minimize2,
  TimerOff,
  Gavel,
  ClipboardEdit
} from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { toast } from 'sonner';
import { getAllHolidays, Holiday } from "@/services/holidayService";
import { useDataCacheStore } from "@/store/dataCacheStore";
import { useRouter } from 'next/navigation';
import { getApprovedLeaveRequestsByPeriod, LeaveRequest } from "@/services/leaveService";
import { tr } from "date-fns/locale";
import { ManageBidsModal } from "@/components/ManageBidsModal";
import { WelcomeModal } from "@/components/WelcomeModal";
import { SetupGuideCard } from "@/components/SetupGuideCard";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const [stats, setStats] = useState({
    monthlyHours: 0,
    leaveDays: 0,
    pendingRequests: 0,
    totalActiveMembers: 0,
    shiftsOpen: 0,
    shiftsBidding: 0,
    pendingAdminRequests: 0,
  });

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const pendingNotificationCount = useNotificationStore((state) => state.unreadCount);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [holidayEvents, setHolidayEvents] = useState<EventInput[]>([]);
  const [leaveEvents, setLeaveEvents] = useState<EventInput[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [viewDates, setViewDates] = useState<{ start: string, end: string } | null>(null);
  const lastScheduleUpdate = useDataCacheStore((state) => state.lastScheduleUpdate);
  const [manageBidsShift, setManageBidsShift] = useState<ScheduledShift | null>(null);

  const fetchSchedule = useCallback(async (startDate: string, endDate: string) => {
    setIsLoadingCalendar(true);
    try {
      const shifts = await getScheduleByPeriod(startDate, endDate);
      const calendarEvents = shifts.map((shift: ScheduledShift) => ({
        id: shift.id,
        title: shift.member ? `${shift.member.firstName} ${shift.member.lastName}` : (shift.status === 'BIDDING' ? `BORSADA - ${shift.location.name}` : `BOŞ - ${shift.location.name}`),
        start: `${shift.shiftDate}T${shift.startTime}`,
        end: `${shift.shiftDate}T${shift.endTime}`,

        backgroundColor: (currentMember && shift.member?.id === currentMember.id)
          ? '#1e40af'
          : shift.status === 'BIDDING' ? '#f59e0b' : (shift.member ? '#3b82f6' : '#ef4444'),
        borderColor: (currentMember && shift.member?.id === currentMember.id)
          ? '#1e40af'
          : shift.status === 'BIDDING' ? '#f59e0b' : (shift.member ? '#3b82f6' : '#ef4444'),

        extendedProps: { ...shift }
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching schedule for calendar", error);
      toast.error("Hata!", { description: "Nöbet çizelgesi yüklenemedi." });
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [currentMember]);

  const fetchHolidays = useCallback(async (startDate: string, endDate: string) => {
    try {
      const holidays = await getAllHolidays(startDate, endDate);
      const holidayCalendarEvents = holidays.map((holiday: Holiday) => ({
        id: `holiday-${holiday.id}`,
        title: holiday.name,
        start: holiday.holidayDate,
        allDay: true,
        display: 'background',
        backgroundColor: '#dcfce7',
        textColor: '#166534'
      }));
      setHolidayEvents(holidayCalendarEvents);
    } catch (error) { console.error("Error fetching holidays for calendar", error); }
  }, []);

  useEffect(() => {
    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
    fetchSchedule(startDate, endDate);
    fetchHolidays(startDate, endDate);
  }, [fetchSchedule, fetchHolidays]);

  const fetchLeaves = useCallback(async (startDate: string, endDate: string) => {
    try {
      const leaves = await getApprovedLeaveRequestsByPeriod(startDate, endDate);
      const leaveCalendarEvents = leaves.map((leave: LeaveRequest) => ({
        id: `leave-${leave.id}`,
        title: `${leave.member.firstName} ${leave.member.lastName} - İZİNLİ`,
        start: leave.startDate,
        end: format(new Date(leave.endDate).setDate(new Date(leave.endDate).getDate() + 1), 'yyyy-MM-dd'),
        allDay: true,
        display: 'background',
        backgroundColor: '#fee2e2',
        textColor: '#b91c1c'
      }));
      setLeaveEvents(leaveCalendarEvents);
    } catch (error) {
      console.error("Error fetching approved leaves for calendar", error);
    }
  }, []);


  useEffect(() => {
    if (!user?.id) {
      setIsLoadingStats(false);
      return;
    }

    console.log("Dashboard: Kullanıcı algılandı, rol bazlı veriler çekiliyor...");
    setIsLoadingStats(true);
    const isAdminOrScheduler = user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_SCHEDULER');

    const fetchPersonalData = async () => {
      try {
        const memberData = await getMemberByUserId(user.id);
        if (memberData) {
          setCurrentMember(memberData);
          const today = new Date();
          const [summary, requests] = await Promise.all([
            getMemberMonthlySummary(memberData.id, today.getFullYear(), today.getMonth() + 1),
            getMyRequestsAPI()
          ]);

          const pending = requests.filter(
            req => req.status === 'PENDING_TARGET_APPROVAL' || req.status === 'PENDING_MANAGER_APPROVAL'
          ).length;

          setStats(prev => ({
            ...prev,
            pendingRequests: pending,
            monthlyHours: summary?.totalScheduledHours || 0,
            leaveDays: summary?.totalLeaveDays || 0,
          }));
        } else {
          console.error("Giriş yapan kullanıcıya ait personel kaydı bulunamadı.");
        }
      } catch (error) {
        console.error("Kişisel dashboard verileri çekilemedi:", error);
        toast.error("Hata!", { description: "Kişisel istatistikleriniz yüklenemedi." });
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchAdminData = async () => {
      try {
        const adminStats = await getAdminDashboardStatsAPI();

        try {
          const memberData = await getMemberByUserId(user.id);
          if (memberData) setCurrentMember(memberData);
        } catch (e) { console.warn("Yönetici hesabı personele bağlı değil."); }

        setStats({
          monthlyHours: 0,
          leaveDays: 0,
          pendingRequests: 0,
          totalActiveMembers: adminStats.totalActiveMembers,
          shiftsOpen: adminStats.shiftsOpen,
          shiftsBidding: adminStats.shiftsBidding,
          pendingAdminRequests: adminStats.pendingShiftChanges + adminStats.pendingLeaveRequests + adminStats.pendingBids,
        });

      } catch (error) {
        console.error("Admin dashboard verileri çekilemedi:", error);
        toast.error("Hata!", { description: "Yönetici istatistikleri yüklenemedi." });
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isAdminOrScheduler) {
      fetchAdminData();
    } else {
      fetchPersonalData();
    }
  }, [user]);

  const handleDatesSet = (start: string, end: string) => {
    setViewDates({ start, end });
    fetchSchedule(start, end);
    fetchHolidays(start, end);
    fetchLeaves(start, end);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: tr });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleEventClick = (clickedEvent: EventClickArg) => {
    const eventId = clickedEvent.event.id;
    const shiftData = clickedEvent.event.extendedProps as ScheduledShift;

    // isAdminOrScheduler değişkenini burada tanımlayın
    const isAdminOrScheduler = user && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_SCHEDULER'));

    // Tıklanan şey tatil veya izinse, bilgilendir
    if (eventId.startsWith('holiday-') || eventId.startsWith('leave-')) {
      toast.info(clickedEvent.event.title, { /*...*/ });
      return;
    }

    // --- YENİ ADMİN MANTIĞI (Borsa Onayı) ---
    if (isAdminOrScheduler && shiftData.status === 'BIDDING') {
      toast.info("Teklifler yükleniyor...", { description: `${shiftData.location.name} nöbetine gelen teklifler.` });
      setManageBidsShift(shiftData); // Yönetici Modal'ını aç
      return;
    }
    // --- BİTTİ ---

    // Tıklanan nöbet BANA AİTSE (ve currentMember yüklendiyse)
    if (shiftData.member && currentMember && shiftData.member.id === currentMember.id) {

      // Admin/Scheduler ise ve KENDİ nöbetine tıklarsa: Yönetim sayfasına yönlendir
      if (isAdminOrScheduler) {
        toast.info("Bu sizin nöbetiniz", {
          description: "Nöbeti yönetmek için 'Çizelge Yönetimi' sayfasını kullanın."
        });
        router.push('/schedule'); // '/management/schedule' yerine '/schedule' olabilir (Header'ınıza göre)
        return;
      }

      // 'Normal Kullanıcı' için geçmiş tarih kontrolü (Bu zaten vardı)
      const shiftDate = parseISO(shiftData.shiftDate);
      if (shiftDate < today) {
        toast.error("İşlem Yapılamaz", {
          description: "Geçmiş tarihli bir nöbet için değişim talebi başlatılamaz."
        });
        return;
      }

      // Normal Kullanıcı (Viewer) ise: Değişim talebi için yönlendir (Bu zaten vardı)
      toast.info("Nöbet değişim talebi hazırlanıyor...", { /*...*/ });
      router.push(`/requests?tab=my-changes&initiateChange=true&shiftId=${shiftData.id}`);
      return;
    }

    // --- YENİ KULLANICI MANTIĞI (Borsaya Teklif Verme) ---
    // Kullanıcı (Admin olmayan) borsadaki bir nöbete tıklarsa
    if (!isAdminOrScheduler && shiftData.status === 'BIDDING') {
      toast.info("Nöbet Borsası sayfasına yönlendiriliyorsunuz...", {
        description: "Bu nöbete teklif vermek için Borsa sayfasını kullanabilirsiniz."
      });
      router.push('/bidding'); // Kullanıcıyı Borsa Vitrinine yönlendir
      return;
    }
    // --- BİTTİ ---

    // Tıklanan nöbet boş veya başkasına aitse (Varsayılan durum)
    toast.info(clickedEvent.event.title, {
      description: `${formatDate(shiftData.shiftDate)} - ${shiftData.location.name}`
    });
  };

  if (!user || (!currentMember && !user.roles.includes('ROLE_ADMIN'))) {
    // Kullanıcı bilgisi gelmediyse VEYA
    // kullanıcı admin DEĞİLSE ve personel bilgisi (currentMember) gelmediyse bekle
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAdminOrScheduler = user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_SCHEDULER');

  return (
    <>
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-lg">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-700">
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return "Günaydın,";
                if (hour >= 12 && hour < 18) return "İyi Günler,";
                if (hour >= 18 && hour < 22) return "İyi Akşamlar,";
                return "İyi Geceler,";
              })()}
            </span>{" "}
            <span className="text-red-500">{user.firstName} {user.lastName}!</span>
          </h1>
          <p className="mt-2 text-muted-foreground">İşte sistemin anlık durumu ve nöbet çizelgeniz.</p>

        </div>
        {isAdminOrScheduler && (
          <SetupGuideCard />
        )}
        <div className="mb-8">
          {isLoadingStats ? (
            <div className="text-center p-6 border rounded-lg bg-white shadow-md">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-3">İstatistikler yükleniyor...</p>
            </div>
          ) : (
            <div className="flex flex-wrap">
              {/* === YÖNETİCİ KARTLARI === */}
              {isAdminOrScheduler && (
                <>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Onay Bekleyen Talepler"
                      value={stats.pendingAdminRequests}
                      icon={ClipboardEdit}
                      description="İzin, Değişim ve Borsa Talepleri"
                      href="/requests" // Admin zaten bu sayfada hepsini yönetir
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Boştaki Nöbetler (Bu Ay)"
                      value={stats.shiftsOpen}
                      icon={TimerOff}
                      description="Henüz kimseye atanmamış (OPEN)"
                      href="/schedule"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Borsadaki Nöbetler (Bu Ay)"
                      value={stats.shiftsBidding}
                      icon={Gavel}
                      description="Personel tekliflerine açık (BIDDING)"
                      href="/bidding"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Toplam Aktif Personel"
                      value={stats.totalActiveMembers}
                      icon={Users}
                      href="/management/members"
                      description="Sistemdeki toplam personel"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Okunmamış Bildirimlerin"
                      value={pendingNotificationCount}
                      icon={Briefcase}
                      description="Bildirim çanınızı kontrol edin"
                    />
                  </div>
                </>
              )}

              {/* === KULLANICI KARTLARI === */}
              {!isAdminOrScheduler && (
                <>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Bu Ayki Toplam Saatin"
                      value={`${stats.monthlyHours.toFixed(1)} sa`}
                      icon={Clock}
                      description="Onaylanmış nöbetleriniz"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Bu Ayki İzin Günlerin"
                      value={stats.leaveDays}
                      icon={Calendar}
                      description="Onaylanmış izinleriniz"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Aktif Taleplerin"
                      value={stats.pendingRequests}
                      icon={ArrowRightLeft}
                      description="Onayınızı veya sonucu bekleyenler"
                      href="/requests"
                    />
                  </div>
                  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 p-2">
                    <StatCard
                      title="Okunmamış Bildirimlerin"
                      value={pendingNotificationCount}
                      icon={Briefcase}
                      description="Bildirim çanınızı kontrol edin"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className={`${isAdminOrScheduler ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white p-6 rounded-xl shadow-lg border border-gray-100`}>
            <h2 className="text-2xl font-semibold mb-5 px-2 flex items-center justify-between border-b pb-4">
              <div className="flex items-center">
                <Calendar className="mr-3 h-6 w-6 text-primary" />
                Nöbet Takvimi
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                className="flex items-center gap-1 hover:scale-105 transition-all duration-300 hover:shadow-md group"
              >
                {isCalendarExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4 animate-pulse" />
                    <span>Daralt</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                    <span>Genişlet</span>
                  </>
                )}
              </Button>
            </h2>
            <div
              className={`w-full transition-all duration-1000 ease-in-out ${isCalendarExpanded
                ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto shadow-2xl scale-100 opacity-100'
                : 'scale-100 opacity-100 hover:shadow-lg'
                }`}
              style={{
                height: isCalendarExpanded ? '100vh' : 'auto',
                marginTop: isCalendarExpanded ? '0' : '',
                marginLeft: isCalendarExpanded ? '0' : '',
                transform: isCalendarExpanded ? 'scale(1) translateY(0)' : 'scale(1)',
                transformOrigin: 'center',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isCalendarExpanded ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '',
              }}
            >
              {isCalendarExpanded && (
                <div className="flex justify-end mb-4 animate-fadeIn">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCalendarExpanded(false)}
                    className="flex items-center gap-1 hover:scale-105 transition-transform duration-300 hover:bg-red-50"
                  >
                    <Minimize2 className="h-4 w-4 animate-pulse" />
                    <span>Takvimi Daralt</span>
                  </Button>
                </div>
              )}
              <ScheduleCalendar
                events={[...events, ...holidayEvents, ...leaveEvents]}
                isLoading={isLoadingCalendar}
                onDatesSet={handleDatesSet}
                isReadOnly={false}
                onEventClick={handleEventClick}
                contentHeight={isCalendarExpanded ? 800 : 700}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            {isAdminOrScheduler && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-semibold mb-5 flex items-center border-b pb-4">
                  <Users className="mr-3 h-6 w-6 text-primary" />
                  Yönetici Eylemleri
                </h2>
                <div className="flex flex-col gap-4">
                  <Button asChild className="transition-all duration-300 hover:translate-y-[-2px] h-12">
                    <Link href="/schedule" className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                      <Calendar className="mr-3 h-5 w-5" /> Çizelgeyi Yönet / Personel Ata
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild className="transition-all duration-300 hover:translate-y-[-2px] h-12">
                    <Link href="/management/members" className="w-full justify-start">
                      <PlusCircle className="mr-3 h-5 w-5" /> Personel Yönetimi
                    </Link>
                  </Button>
                  <Button variant="secondary" asChild className="transition-all duration-300 hover:translate-y-[-2px] h-12">
                    <Link href="/requests" className="w-full justify-start">
                      <ArrowRightLeft className="mr-3 h-5 w-5" /> Tüm Talepleri Yönet
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <WelcomeModal />
      {manageBidsShift && (
        <ManageBidsModal
          isOpen={!!manageBidsShift}
          onClose={() => setManageBidsShift(null)}
          shift={manageBidsShift}
          onAwardSuccess={() => {
            if (viewDates) {
              fetchSchedule(viewDates.start, viewDates.end);
            }
          }}
        />
      )}
    </>
  );
}