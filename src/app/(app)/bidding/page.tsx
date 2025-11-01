'use client';

import { useEffect, useState } from 'react';
import { getOpenBiddingShiftsAPI, createBidAPI } from '@/services/shiftBiddingService';
import { ScheduledShift } from '@/services/scheduleService';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function BiddingPage() {
    const [openShifts, setOpenShifts] = useState<ScheduledShift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedShift, setSelectedShift] = useState<ScheduledShift | null>(null);
    const [bidNotes, setBidNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM (E)', { locale: tr });
    const formatTime = (timeString: string) => timeString.substring(0, 5);

    const fetchOpenShifts = async () => {
        setIsLoading(true);
        try {
            const data = await getOpenBiddingShiftsAPI();
            setOpenShifts(data);
        } catch (error: any) {
            toast.error("Hata!", { description: "Borsadaki nöbetler yüklenemedi." });
            if (error.response && error.response.status === 403) {
                toast.error("Özellik Devre Dışı", {
                    description: "Nöbet Borsası özelliği yönetici tarafından kapatılmıştır. Ana sayfaya yönlendiriliyorsunuz."
                });
                router.push('/dashboard');
            } else {
                toast.error("Hata!", { description: "Borsadaki nöbetler yüklenemedi." });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOpenShifts();
    }, [router]);

    const handleBidSubmit = async () => {
        if (!selectedShift) return;
        setIsSubmitting(true);
        try {
            await createBidAPI(selectedShift.id, bidNotes || null);
            toast.success("Teklif Gönderildi!", { description: "Teklifiniz yönetici onayına gönderildi. 'Taleplerim' sayfasından takip edebilirsiniz." });
            setSelectedShift(null);
            setBidNotes("");
            fetchOpenShifts();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "Teklif gönderilemedi. (Nöbetle çakışmanız veya yetkinlik sorunu olabilir)" });
        } finally {
            setIsSubmitting(false);
        }
    };
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    return (
        <>
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold mb-6">Nöbet Borsası</h1>
                <p className="text-muted-foreground mb-4">
                    Borsaya açılan nöbetler aşağıdadır. Teklif vererek bu nöbetleri almak için talepte bulunabilirsiniz.
                </p>
                {isLoading ? (
                    <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
                ) : openShifts.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">Şu anda borsada aktif nöbet bulunmamaktadır.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        _  {openShifts.map(shift => (
                            <div key={shift.id} className="border p-4 rounded-lg shadow-sm bg-white">
                                <h3 className="font-semibold text-lg">{shift.location.name}</h3>
                                {shift.shiftTemplate && <p className="text-muted-foreground">{shift.shiftTemplate.name}</p>}
                                <p className="my-2">{formatDate(shift.shiftDate)} | {formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
                                {shift.requiredQualification && <Badge variant="outline">{shift.requiredQualification.name}</Badge>}
                                <Button className="w-full mt-2" onClick={() => setSelectedShift(shift)}>
                                    Teklif Ver
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selectedShift} onOpenChange={() => setSelectedShift(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nöbet Teklifi Ver</DialogTitle>
                        {selectedShift && (
                            <DialogDescription>
                                {selectedShift.location.name} | {formatDate(selectedShift.shiftDate)}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="py-4">
                        <label htmlFor="notes" className="text-sm font-medium">Notunuz (Opsiyonel)</label>
                        <Textarea
                            id="notes"
                            placeholder="Yöneticiye iletmek istediğiniz not..."
                            value={bidNotes}
                            onChange={(e) => setBidNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">İptal</Button></DialogClose>
                        <Button onClick={handleBidSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Teklifi Gönder"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}