'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createLeaveRequestAPI, LeaveRecordCreateRequest } from '@/services/leaveRequestService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CreateLeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LEAVE_TYPES = [
    { value: "ANNUAL_LEAVE", label: "Yıllık İzin" },
    { value: "SICK_LEAVE", label: "Hastalık İzni (Raporlu)" },
    { value: "UNPAID_LEAVE", label: "Ücretsiz İzin" },
    { value: "OTHER", label: "Diğer Mazeret İzni" },
];

export function CreateLeaveRequestModal({ isOpen, onClose, onSuccess }: CreateLeaveRequestModalProps) {
  const [leaveType, setLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setLeaveType(''); setStartDate(undefined); setEndDate(undefined);
    setReason(''); setError(null); setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate) {
        setError("Lütfen tüm zorunlu alanları (İzin Türü, Başlangıç ve Bitiş Tarihi) doldurun.");
        return;
    }
    if (endDate < startDate) {
         setError("Bitiş tarihi, başlangıç tarihinden önce olamaz.");
         return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: LeaveRecordCreateRequest = {
        leaveType: leaveType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        reason: reason || null,
      };
      await createLeaveRequestAPI(data);
      toast.success("Başarılı", { description: "İzin talebiniz yönetici onayına gönderildi." });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Talep oluşturulurken bir hata oluştu.";
      setError(msg);
      toast.error("Hata!", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni İzin Talebi Oluştur</DialogTitle>
          <DialogDescription>İzin türünü ve tarih aralığını seçin. Talebiniz yönetici onayına sunulacaktır.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="leave-type">İzin Türü *</Label>
            <Select onValueChange={setLeaveType} value={leaveType}>
              <SelectTrigger id="leave-type"><SelectValue placeholder="Bir izin türü seçin..." /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="start-date">Başlangıç Tarihi *</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="start-date" variant="outline" className="w-full justify-start font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'dd MMM yyyy', { locale: tr }) : <span>Tarih seçin</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={tr}/></PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="end-date">Bitiş Tarihi *</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="end-date" variant="outline" className="w-full justify-start font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'dd MMM yyyy', { locale: tr }) : <span>Tarih seçin</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={tr}/></PopoverContent>
                </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Sebep (Opsiyonel)</Label>
            <Textarea id="reason" placeholder="Kısa bir açıklama..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">İptal</Button></DialogClose>
        <Button onClick={handleSubmit} disabled={isSubmitting}> 
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "İzin Talebi Gönder"}
        </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}