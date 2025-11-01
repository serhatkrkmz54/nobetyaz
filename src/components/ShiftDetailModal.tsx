'use client';

import { useState, useEffect } from 'react';
import { ScheduledShift, assignMemberToShift } from "@/services/scheduleService";
import { Member } from '@/services/memberService';
import { postShiftToBiddingAPI, placeBidAPI, ShiftBidCreateData, ShiftBidResponseData, listBidsForShiftAPI, awardShiftAPI } from '@/services/shiftBiddingService';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Tag, Briefcase, RefreshCw, User, Hand, Users, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ShiftDetailModalProps {
  shift: ScheduledShift | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  members: Member[];
  isBiddingEnabled: boolean;
}

type ModalView = 'details' | 'assign' | 'placeBid' | 'viewBids';

export default function ShiftDetailModal({ shift, isOpen, onClose, onUpdate, members, isBiddingEnabled }: ShiftDetailModalProps) {
  const { user } = useAuthStore();
  const [view, setView] = useState<ModalView>('details');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [bidNotes, setBidNotes] = useState<string>('');
  const [bids, setBids] = useState<ShiftBidResponseData[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (!shift || !user)) {
      console.warn("ShiftDetailModal açılmaya çalışıldı ancak shift veya user verisi eksik.");
      const timer = setTimeout(() => onClose(), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shift, user, onClose]);

  if (!shift || !user) {
    return null;
  }

  console.log("MODAL'A GELEN SHIFT NESNESİ:", shift);

  const userRoles = user.roles || [];
  const isAdminOrScheduler = userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SCHEDULER');
  const isOwner = shift.member?.userId === user.id;

  const handleAssignClick = async () => {
    if (!selectedMemberId) return;
    setIsProcessing(true);
    setError(null);
    try {
      await assignMemberToShift(shift.id, selectedMemberId);
      toast.success("Başarılı", { description: "Personel nöbete atandı." });
      onUpdate();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Atama sırasında bir hata oluştu.';
      setError(errorMessage);
      toast.error("Atama Başarısız!", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToBidding = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await postShiftToBiddingAPI(shift.id);
      toast.success("Başarılı", { description: "Nöbet borsaya açıldı." });
      onUpdate();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Nöbet borsaya açılamadı.';
      setError(errorMessage);
      toast.error("Hata!", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceBid = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const data: ShiftBidCreateData = { notes: bidNotes || null };
      await placeBidAPI(shift.id, data);
      toast.success("Başarılı", { description: "Nöbete başarıyla talip oldunuz. Yönetici onayı bekleniyor." });
      onUpdate();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Nöbete talip olurken bir hata oluştu.';
      setError(errorMessage);
      toast.error("Hata!", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchBids = async (shiftId: string) => {
    setIsLoadingBids(true);
    setError(null);
    try {
      const fetchedBids = await listBidsForShiftAPI(shiftId);
      setBids(fetchedBids);
    } catch (err: any) {
      setError("Talepler yüklenemedi.");
      toast.error("Hata!", { description: "Nöbet talepleri yüklenemedi." });
    } finally {
      setIsLoadingBids(false);
    }
  };

  const handleAwardShift = async (bidId: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      await awardShiftAPI(shift.id, bidId);
      toast.success("Başarılı", { description: "Nöbet başarıyla atandı." });
      onUpdate();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Nöbet ataması sırasında bir hata oluştu.';
      setError(errorMessage);
      toast.error("Atama Başarısız!", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView('details');
      setSelectedMemberId('');
      setBidNotes('');
      setBids([]);
      setError(null);
      setIsProcessing(false);
    }, 300);
  };

  const isShiftOpen = shift.status === 'OPEN';
  const isShiftBidding = shift.status === 'BIDDING';
  const isShiftConfirmed = shift.status === 'CONFIRMED';
  const canPlaceBid = isShiftBidding && !isOwner && shift.member === null && isBiddingEnabled;
  const memberName = shift.member ? `${shift.member.firstName} ${shift.member.lastName}` : "Atanmamış";
  const memberInitials = shift.member ? `${shift.member.firstName[0]}${shift.member.lastName[0]}` : "-";

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateString; }
  }

  const requiredQual = shift.requiredQualification;
  const availableMembers = members.filter(member => {
    if (!requiredQual) {
      return true;
    }
    if (!member.qualifications || member.qualifications.length === 0) {
      return false;
    }
    return member.qualifications.some(q => q.id === requiredQual.id);
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {view === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Nöbet Detayları</DialogTitle>
              <DialogDescription>Seçili nöbetin detayları ve ilgili eylemler.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar><AvatarFallback>{memberInitials}</AvatarFallback></Avatar>
                <div>
                  <p className="font-semibold">{memberName}</p>
                  <p className="text-sm text-muted-foreground">
                    {isShiftOpen ? 'Boş Nöbet' : isShiftBidding ? 'Borsada (Talep Bekliyor)' : 'Atanmış Personel'}
                  </p>
                </div>
              </div>
              <div className="space-y-3 mt-4 text-sm">
                <div className="flex items-center"><Tag className="h-4 w-4 mr-2 text-muted-foreground" />{shift.shiftTemplate.name}</div>
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-muted-foreground" />{shift.location.name}</div>
                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-muted-foreground" />{new Date(shift.shiftDate).toLocaleDateString('tr-TR', { dateStyle: 'full' })}</div>
                <div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-muted-foreground" />{shift.startTime} - {shift.endTime}</div>
                {shift.requiredQualification && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Gereken Yetkinlik: </span>
                    <Badge variant="outline" className="ml-2">{shift.requiredQualification.name}</Badge>
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mb-4 px-6 sm:px-0">{error}</p>}
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
              <DialogClose asChild><Button type="button" variant="secondary">Kapat</Button></DialogClose>
              <div className="flex flex-wrap gap-2 justify-end">
                {isShiftOpen && isAdminOrScheduler && (
                  <Button onClick={() => setView('assign')} disabled={isProcessing}>
                    <User className="mr-2 h-4 w-4" /> Personel Ata
                  </Button>
                )}
                {isShiftConfirmed && isOwner && (
                  <Button variant="outline" asChild disabled={isProcessing}>
                    <Link href={`/requests?initiateChange=true&shiftId=${shift.id}`}><RefreshCw className="mr-2 h-4 w-4" /> Değişim Talep Et</Link>
                  </Button>
                )}

                {isBiddingEnabled && (
                  <>
                    {isShiftConfirmed && isAdminOrScheduler && (
                      <Button variant="outline" onClick={handlePostToBidding} disabled={isProcessing}>
                        <Briefcase className="mr-2 h-4 w-4" /> Borsaya Aç
                      </Button>
                    )}

                    {canPlaceBid && (
                      <Button onClick={() => setView('placeBid')} disabled={isProcessing}>
                        <Hand className="mr-2 h-4 w-4" /> Nöbete Talip Ol
                      </Button>
                    )}

                    {isShiftBidding && isAdminOrScheduler && (
                      <Button onClick={() => { setView('viewBids'); fetchBids(shift.id); }} disabled={isProcessing}>
                        <Users className="mr-2 h-4 w-4" /> Talepleri Gör
                      </Button>
                    )}
                  </>
                )}
              </div>
            </DialogFooter>
          </>
        )}

        {view === 'assign' && (
          <>
            <DialogHeader>
              <DialogTitle>"{shift.location.name}" Nöbetine Personel Ata</DialogTitle>
              <DialogDescription>
                {shift.requiredQualification
                  ? `Bu nöbet "${shift.requiredQualification.name}" yetkinliği gerektiriyor. Sadece uygun personeller listelenmiştir.`
                  : "Bu nöbet için özel bir yetkinlik gerekmiyor."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Select onValueChange={setSelectedMemberId} value={selectedMemberId}>
                <SelectTrigger><SelectValue placeholder="Bir personel seçin..." /></SelectTrigger>
                <SelectContent>
                  {availableMembers.length === 0 ? (
                    <SelectItem value="none" disabled>Uygun personel bulunamadı.</SelectItem>
                  ) : (
                    availableMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setView('details'); setError(null); }}>Geri</Button>
              <Button onClick={handleAssignClick} disabled={!selectedMemberId || isProcessing}>
                {isProcessing ? 'Atanıyor...' : 'Nöbeti Ata'}
              </Button>
            </DialogFooter>
          </>
        )}

        {view === 'placeBid' && (
          <>
            <DialogHeader>
              <DialogTitle>Nöbete Talip Ol</DialogTitle>
              <DialogDescription>{shift.location.name} ({shift.shiftDate}) nöbetine talip olmak üzeresiniz.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="bidNotes">Not Ekle (Opsiyonel)</Label>
              <Textarea
                id="bidNotes"
                placeholder="Yöneticiye iletmek istediğiniz bir not varsa..."
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setView('details'); setError(null); }}>Geri</Button>
              <Button onClick={handlePlaceBid} disabled={isProcessing}>
                {isProcessing ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </Button>
            </DialogFooter>
          </>
        )}
        {view === 'viewBids' && (
          <>
            <DialogHeader>
              <DialogTitle>"{shift.location.name}" Nöbeti İçin Talepler</DialogTitle>
              <DialogDescription>{formatDate(shift.shiftDate)} tarihli nöbete talip olan personeller.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
              {isLoadingBids ? (
                <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
              ) : error ? (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              ) : bids.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Bu nöbete henüz talep gelmemiş.</p>
              ) : (
                <ul className="space-y-3">
                  {bids.map(bid => (
                    <li key={bid.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{bid.memberFullName}</p>
                        {bid.notes && <p className="text-xs text-muted-foreground mt-1">Not: {bid.notes}</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="default" // Yeşil tonu için className eklenebilir
                        onClick={() => handleAwardShift(bid.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Nöbeti Ver"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setView('details'); setError(null); }}>Geri</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}