'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduledShift } from '@/services/scheduleService';
import { getBidsForShiftAPI, awardShiftAPI, ShiftBidResponseData } from '@/services/shiftBiddingService';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from './ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ManageBidsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: ScheduledShift | null; // Tıklanan nöbetin bilgisi
    onAwardSuccess: () => void; // Takvimi yenilemek için
}

export function ManageBidsModal({ isOpen, onClose, shift, onAwardSuccess }: ManageBidsModalProps) {
    const [bids, setBids] = useState<ShiftBidResponseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && shift) {
            const fetchBids = async () => {
                setIsLoading(true);
                try {
                    const data = await getBidsForShiftAPI(shift.id);
                    setBids(data);
                } catch (error) {
                    toast.error("Hata!", { description: "Nöbete gelen teklifler yüklenemedi." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchBids();
        }
    }, [isOpen, shift]);

    const handleAward = async (bidId: string) => {
        if (!shift) return;
        setIsSubmitting(true);
        try {
            await awardShiftAPI(shift.id, bidId);
            toast.success("Nöbet Atandı!", { description: "Nöbet seçilen personele başarıyla atandı." });
            onAwardSuccess(); // Takvimi yenile
            onClose();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "Nöbet atanamadı." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nöbet Tekliflerini Yönet</DialogTitle>
                    {shift && (
                        <DialogDescription>
                            {shift.location.name} ({shift.shiftDate})
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-4 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : bids.length === 0 ? (
                        <p className="text-center text-muted-foreground p-8">Bu nöbet için aktif bir teklif bulunmuyor.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Personel</TableHead>
                                    <TableHead>Not</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bids.map((bid) => (
                                    <TableRow key={bid.id}>
                                        <TableCell className="font-medium">
                                            {/* İsteğiniz buydu: İsim ve Soyisim */}
                                            {bid.memberFullName}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{bid.notes || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" disabled={isSubmitting}>Onayla</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Nöbeti Ata?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Nöbeti <span className="font-bold">{bid.memberFullName}</span> adlı personele atamak istediğinizden emin misiniz? Diğer tüm teklifler reddedilecek.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleAward(bid.id)} disabled={isSubmitting}>
                                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Evet, Ata"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                         </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}