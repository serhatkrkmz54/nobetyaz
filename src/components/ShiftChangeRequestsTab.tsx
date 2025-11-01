'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    ShiftChangeResponseData,
    getMyRequestsAPI,
    respondToRequestAPI,
    resolveRequestAPI,
    cancelRequestAPI,
    ShiftChangeActionData
} from '@/services/shiftChangeService';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Member } from '@/services/memberService';

// Bu component, ana sayfadan 'currentMember' prop'unu almalı
interface ShiftChangeRequestsTabProps {
    currentMember: Member | null;
}
export function ShiftChangeRequestsTab({ currentMember }: ShiftChangeRequestsTabProps) {
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<ShiftChangeResponseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchChangeRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getMyRequestsAPI();
            setRequests(data);
        } catch (error) {
            toast.error("Hata!", { description: "Değişim talepleri yüklenirken bir sorun oluştu." });
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Sadece currentMember yüklendiğinde veriyi çek
        if (currentMember) {
            fetchChangeRequests();
        }
    }, [currentMember, fetchChangeRequests]);

    const handleAction = async (requestId: string, action: 'ACCEPT' | 'REJECT' | 'APPROVE' | 'CANCEL', apiFunc: Function, notes?: string) => {
        try {
            const data: ShiftChangeActionData = { action, notes: notes || null };
            await apiFunc(requestId, data);
            toast.success("Başarılı", { description: "İşlem tamamlandı." });
            fetchChangeRequests();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "İşlem sırasında bir hata oluştu." });
        }
    };

    const handleRespond = (requestId: string, action: 'ACCEPT' | 'REJECT') => handleAction(requestId, action, respondToRequestAPI);
    const handleResolve = (requestId: string, action: 'APPROVE' | 'REJECT') => handleAction(requestId, action, resolveRequestAPI);
    const handleCancel = (requestId: string) => handleAction(requestId, 'CANCEL', cancelRequestAPI);

    // Helper Fonksiyonlar (Bu componente taşındı)
    const getStatusBadge = (status: string): React.ReactNode => {
        switch (status) {
            case 'PENDING_TARGET_APPROVAL': return <Badge variant="secondary">Hedef Onayı Bekliyor</Badge>;
            case 'PENDING_MANAGER_APPROVAL': return <Badge variant="default" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">Yönetici Onayı Bekliyor</Badge>;
            case 'APPROVED': return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Onaylandı</Badge>;
            case 'REJECTED': return <Badge variant="destructive">Reddedildi</Badge>;
            case 'CANCELLED': return <Badge variant="outline">İptal Edildi</Badge>;
            default: return <Badge variant="outline">{status || 'Bilinmiyor'}</Badge>;
        }
    };
    const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yy', { locale: tr });
    const formatTime = (timeString: string) => timeString.substring(0, 5);

    if (isLoading) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Nöbet Değişim Talepleri</CardTitle>
                    <CardDescription>Size gelen veya sizin gönderdiğiniz nöbet değişim talepleri.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4 shadow-md border-0">
            <CardHeader>
                <CardTitle>Nöbet Değişim Talepleri</CardTitle>
                <CardDescription>Size gelen veya sizin gönderdiğiniz nöbet değişim talepleri.</CardDescription>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">Gösterilecek değişim talebi bulunmuyor.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Talep Eden</TableHead>
                                <TableHead>Teklif Edilen</TableHead>
                                <TableHead>İstenen Kişi</TableHead>
                                <TableHead>İstenen Nöbet</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right min-w-[150px]">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => {
                                const isCurrentUserInitiator = req.initiatingMember.id === currentMember!.id;
                                const isCurrentUserTarget = req.targetMember.id === currentMember!.id;
                                const isAdminOrScheduler = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_SCHEDULER');
                                const canRespond = isCurrentUserTarget && req.status === 'PENDING_TARGET_APPROVAL';
                                const canCancel = isCurrentUserInitiator && (req.status === 'PENDING_TARGET_APPROVAL' || req.status === 'PENDING_MANAGER_APPROVAL');
                                const canResolve = isAdminOrScheduler && req.status === 'PENDING_MANAGER_APPROVAL';

                                return (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.initiatingMember.firstName} {req.initiatingMember.lastName} {isCurrentUserInitiator && <Badge variant="outline" className="ml-1">Siz</Badge>}</TableCell>
                                        <TableCell> {formatDate(req.initiatingShift.date)} <span className="text-xs text-muted-foreground">{formatTime(req.initiatingShift.startTime)}</span> </TableCell>
                                        <TableCell> {req.targetMember.firstName} {req.targetMember.lastName} {isCurrentUserTarget && <Badge variant="outline" className="ml-1">Siz</Badge>} </TableCell>
                                        <TableCell> {formatDate(req.targetShift.date)} <span className="text-xs text-muted-foreground">{formatTime(req.targetShift.startTime)}</span> </TableCell>
                                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                                        <TableCell className="text-right space-x-1">
                                            {canRespond && (<> <Button size="sm" onClick={() => handleRespond(req.id, 'ACCEPT')}>Kabul</Button> <Button size="sm" variant="destructive" onClick={() => handleRespond(req.id, 'REJECT')}>Reddet</Button> </>)}
                                            {canResolve && (<> <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleResolve(req.id, 'APPROVE')}>Onayla</Button> <Button size="sm" variant="destructive" onClick={() => handleResolve(req.id, 'REJECT')}>Reddet</Button> </>)}
                                            {canCancel && (<AlertDialog> <AlertDialogTrigger asChild><Button size="sm" variant="outline">İptal</Button></AlertDialogTrigger> <AlertDialogContent> <AlertDialogHeader><AlertDialogTitle>Talebi İptal Et?</AlertDialogTitle><AlertDialogDescription>Bu talebi iptal etmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel>Vazgeç</AlertDialogCancel> <AlertDialogAction onClick={() => handleCancel(req.id)}>İptal Et</AlertDialogAction> </AlertDialogFooter> </AlertDialogContent> </AlertDialog>)}
                                            {!canRespond && !canResolve && !canCancel && <span className="text-xs text-muted-foreground">İşlem Yok</span>}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}