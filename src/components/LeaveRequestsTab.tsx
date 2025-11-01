'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Loader2, Printer } from 'lucide-react';
import { approveLeaveRequestAPI, cancelLeaveRequestAPI, getAllLeaveRequestsAPI, getMyLeaveRequestsAPI, LeaveRecordResponse, rejectLeaveRequestAPI } from '@/services/leaveRequestService';
import { useReactToPrint } from 'react-to-print';
import { PrintableLeaveForm } from '@/components/PrintableLeaveForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

interface LeaveRequestsTabProps {
    recordToPrint: LeaveRecordResponse | null;
    triggerPrint: (record: LeaveRecordResponse) => void;
}

export function LeaveRequestsTab({ recordToPrint, triggerPrint }: LeaveRequestsTabProps) {
    const { user } = useAuthStore();
    const isAdminOrScheduler = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_SCHEDULER') || false;
    const [leaveRequests, setLeaveRequests] = useState<LeaveRecordResponse[]>([]);
    const [pendingLeaveRequests, setPendingLeaveRequests] = useState<LeaveRecordResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaveRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isAdminOrScheduler) {
                const allData = await getAllLeaveRequestsAPI();
                setLeaveRequests(allData);
                const pending = allData.filter(req => req.status === 'PENDING' || req.status === 'REQUESTED');
                setPendingLeaveRequests(pending);
            } else {
                const myData = await getMyLeaveRequestsAPI();
                setLeaveRequests(myData);
                setPendingLeaveRequests([]);
            }
        } catch (error) {
            toast.error("Hata!", { description: "İzin talepleri yüklenirken bir sorun oluştu." });
            setLeaveRequests([]);
            setPendingLeaveRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [isAdminOrScheduler]);

    useEffect(() => {
        fetchLeaveRequests();
    }, [fetchLeaveRequests]);

    const handleResolveLeave = async (leaveId: string, approved: boolean) => {
        try {
            if (approved) {
                await approveLeaveRequestAPI(leaveId);
            } else {
                await rejectLeaveRequestAPI(leaveId);
            }
            toast.success("Başarılı", { description: `İzin talebi ${approved ? 'onaylandı' : 'reddedildi'}.` });
            fetchLeaveRequests();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "İşlem sırasında bir hata oluştu." });
        }
    };

    const handleCancelLeave = async (leaveId: string) => {
        try {
            await cancelLeaveRequestAPI(leaveId);
            toast.success("Başarılı", { description: "İzin talebi iptal edildi." });
            fetchLeaveRequests();
        } catch (error: any) {
            toast.error("Hata!", { description: error.response?.data?.message || "İşlem sırasında bir hata oluştu." });
        }
    };

    // Helper Fonksiyonlar
    const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yy', { locale: tr });

    const LEAVE_TYPE_MAP: Record<string, string> = {
        "ANNUAL_LEAVE": "Yıllık İzin",
        "SICK_LEAVE": "Hastalık İzni (Raporlu)",
        "UNPAID_LEAVE": "Ücretsiz İzin",
        "OTHER": "Diğer Mazeret İzni",
    };
    const getLeaveTypeLabel = (key: string): string => LEAVE_TYPE_MAP[key] || key;

    const getLeaveStatusBadge = (status: string): React.ReactNode => {
        switch (status) {
            case 'PENDING':
            case 'REQUESTED': return <Badge variant="default" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">Onay Bekliyor</Badge>;
            case 'APPROVED': return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Onaylandı</Badge>;
            case 'REJECTED': return <Badge variant="destructive">Reddedildi</Badge>;
            case 'CANCELLED': return <Badge variant="outline">İptal Edildi</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Geçmiş talepleri (bekleyenler hariç) filtrele
    const pastRequests = leaveRequests.filter(req => req.status !== 'PENDING' && req.status !== 'REQUESTED');

    if (isLoading) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>İzin Talepleri</CardTitle>
                    <CardDescription>Oluşturduğunuz veya yönettiğiniz izin talepleri.</CardDescription>
                </CardHeader>
                <CardContent className="text-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mt-4 shadow-md border-0">
            {/* Onay Bekleyenler (Sadece Adminler) */}
            {isAdminOrScheduler && (
                <>
                    <CardHeader>
                        <CardTitle>Onay Bekleyen İzin Talepleri</CardTitle>
                        <CardDescription>Diğer personellerden gelen ve onayınızı bekleyen talepler.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingLeaveRequests.length === 0 ? (
                            <p className="text-center text-muted-foreground p-4">Onay bekleyen izin talebi bulunmuyor.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Personel</TableHead>
                                        <TableHead>Tür</TableHead>
                                        <TableHead>Tarih Aralığı</TableHead>
                                        <TableHead>Sebep</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingLeaveRequests.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.member.firstName} {req.member.lastName}</TableCell>
                                            <TableCell>{getLeaveTypeLabel(req.leaveType)}</TableCell>
                                            <TableCell>{formatDate(req.startDate)} - {formatDate(req.endDate)}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{req.reason || '-'}</TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleResolveLeave(req.id, true)}>Onayla</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleResolveLeave(req.id, false)}>Reddet</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </>
            )}

            {/* Geçmiş Talepler (Herkes) */}
            <CardHeader>
                <CardTitle>{isAdminOrScheduler ? 'Tüm İzin Kayıtları' : 'Geçmiş İzin Taleplerim'}</CardTitle>
                <CardDescription>{isAdminOrScheduler ? 'Sistemdeki tüm personellere ait geçmiş izin kayıtları.' : 'Oluşturduğunuz ve sonuçlanmış izin talepleri.'}</CardDescription>
            </CardHeader>
            <CardContent>
                {pastRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">Geçmiş izin talebi bulunmuyor.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isAdminOrScheduler && <TableHead>Personel</TableHead>}
                                <TableHead>İzin Türü</TableHead>
                                <TableHead>Başlangıç</TableHead>
                                <TableHead>Bitiş</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pastRequests.map((req) => (
                                <TableRow key={req.id}>
                                    {isAdminOrScheduler && <TableCell className="font-medium">{req.member.firstName} {req.member.lastName}</TableCell>}
                                    <TableCell className="font-medium">{getLeaveTypeLabel(req.leaveType)}</TableCell>
                                    <TableCell>{formatDate(req.startDate)}</TableCell>
                                    <TableCell>{formatDate(req.endDate)}</TableCell>
                                    <TableCell>{getLeaveStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {req.status === 'APPROVED' && (
                                            <Button size="sm" variant="outline" onClick={() => triggerPrint(req)} title="İzin Formunu Yazdır">
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {(req.status === 'REJECTED' || req.status === 'CANCELLED') && '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}