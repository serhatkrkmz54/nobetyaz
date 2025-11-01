'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduledShift, getScheduleByIdAPI, getScheduleByPeriod } from '@/services/scheduleService';
import { createChangeRequestAPI, ShiftChangeCreateRequestData } from '@/services/shiftChangeService';
import { useAuthStore } from '@/store/authStore';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CreateChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initiatingShiftId: string;
}

export function CreateChangeRequestModal({ isOpen, onClose, onSuccess, initiatingShiftId }: CreateChangeRequestModalProps) {
  const { user } = useAuthStore();
  const [initiatingShift, setInitiatingShift] = useState<ScheduledShift | null>(null);
  const [swappableShifts, setSwappableShifts] = useState<ScheduledShift[]>([]);
  const [targetShiftId, setTargetShiftId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    if (isOpen && user) {
      const fetchSwappableShifts = async () => {
        setIsLoading(true);
        setError(null);
        setTargetShiftId('');
        setReason('');

        try {
          // 1. Referans nöbeti al
          const initiatingShift = await getScheduleByIdAPI(initiatingShiftId);
          setInitiatingShift(initiatingShift);
          
          // --- DEBUG LOG 1 ---
          console.log("REFERANS NÖBET DETAYI:", initiatingShift);
          console.log("KULLANICI (user.id):", user?.id);

          // 2. Tarih aralığını DİNAMİK olarak belirle
          // YYYY-MM-DD string'ini parse etmenin en güvenli yolu:
          const initiatingDate = parseISO(initiatingShift.shiftDate);
          
          const windowStartDate = new Date(initiatingDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          const windowEndDate = new Date(initiatingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const effectiveStartDate = windowStartDate < today ? today : windowStartDate;

          const startDate = format(effectiveStartDate, 'yyyy-MM-dd');
          const endDate = format(windowEndDate, 'yyyy-MM-dd');

          // --- DEBUG LOG 2 ---
          console.log("API ARAMA ARALIĞI:", { startDate, endDate });

          // 3. API'dan veriyi çek
          const allShifts = await getScheduleByPeriod(startDate, endDate);

          // --- DEBUG LOG 3 ---
          console.log("API'DAN GELEN HAM VERİ (FİLTRESİZ):", allShifts);

          // 4. Filtrele
          const filtered = allShifts.filter(shift =>
            shift.member !== null &&
            shift.member.userId !== user.id &&
            shift.id !== initiatingShiftId
          );

          // --- DEBUG LOG 4 ---
          console.log("FİLTRELENMİŞ LİSTE (GÖSTERİLECEK):", filtered);
          
          setSwappableShifts(filtered);

          if (allShifts.length > 0 && filtered.length === 0) {
            console.warn("Tüm nöbetler filtreye takıldı! Filtreleme nedenlerini kontrol edin.");
            // Filtreye takılan nöbetlerin nedenini inceleyelim
            allShifts.forEach(shift => {
              if (shift.member === null) {
                console.log(`Filtrelendi (Atanmamış): ${shift.id}`);
              } else if (shift.member.userId === user.id) {
                console.log(`Filtrelendi (Kullanıcının kendi nöbeti): ${shift.id} | Kullanıcı ID: ${shift.member.userId}`);
              } else if (shift.id === initiatingShiftId) {
                console.log(`Filtrelendi (Referans nöbetin kendisi): ${shift.id}`);
              }
            });
          }

        } catch (err) {
          setError("Gerekli nöbet bilgileri yüklenemedi.");
          toast.error("Hata!", { description: "Nöbet bilgileri yüklenemedi." });
          console.error("NÖBET ÇEKME HATASI:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSwappableShifts();
    }
  }, [isOpen, user, initiatingShiftId]);

  const handleSubmit = async () => {
    if (!targetShiftId) {
        setError("Lütfen bir hedef nöbet seçin.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const data: ShiftChangeCreateRequestData = {
        initiatingShiftId: initiatingShiftId,
        targetShiftId: targetShiftId,
        reason: reason || null,
      };
      await createChangeRequestAPI(data);
      toast.success("Başarılı", { description: "Nöbet değişim talebiniz gönderildi. Hedef personelin onayı bekleniyor." });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Talep oluşturulurken bir hata oluştu.";
      setError(msg);
      toast.error("Hata!", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM (E)', { locale: tr });
  const formatTime = (timeString: string) => timeString.substring(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Değişim Talebi Başlat</DialogTitle>
          <DialogDescription>
            Kendi nöbetinizi, başka bir personelin nöbetiyle değiştirmek için talep oluşturun.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-1 rounded-md border p-3">
              <Label className="text-xs text-muted-foreground">Teklif Ettiğiniz Nöbet</Label>
              {initiatingShift ? (
                <div>
                  <p className="font-semibold">{initiatingShift.location.name}</p>
                  <p className="text-sm">{formatDate(initiatingShift.shiftDate)} | {formatTime(initiatingShift.startTime)}-{formatTime(initiatingShift.endTime)}</p>
                </div>
              ) : (
                <p className="text-sm">Nöbet detayı yüklenemedi.</p>
              )}
            </div>
            <p className="text-sm">
              <strong>Teklif Edilen Nöbet ID:</strong>
              <span className="ml-2 font-mono text-xs">{initiatingShiftId.substring(0, 8)}...</span>
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="target-shift">İstenen Nöbet (Takas)</Label>
              <Select onValueChange={setTargetShiftId} value={targetShiftId}>
                <SelectTrigger id="target-shift"><SelectValue placeholder="Bir hedef nöbet seçin..." /></SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {swappableShifts.length === 0 ? (
                    <SelectItem value="none" disabled>Gelecek 30 gün içinde takasa uygun nöbet bulunamadı.</SelectItem>
                  ) : (
                    swappableShifts.map(shift => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {formatDate(shift.shiftDate)} | {formatTime(shift.startTime)}-{formatTime(shift.endTime)} | {shift.member?.firstName} {shift.member?.lastName} ({shift.location.name})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Sebep (Opsiyonel)</Label>
              <Textarea
                id="reason"
                placeholder="Değişim talebinizin nedeni..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">İptal</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading || isSubmitting || !targetShiftId}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Talebi Gönder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}