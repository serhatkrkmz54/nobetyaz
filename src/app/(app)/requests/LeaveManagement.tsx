'use client';

import { useEffect, useState } from 'react';
import { LeaveRequest, getAllLeaveRequestsAPI, approveLeaveRequestAPI, rejectLeaveRequestAPI } from '@/services/leaveService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PrintLeaveButton } from '@/components/PrintLeaveButton'; 

export default function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllLeaveRequestsAPI();
      setRequests(data);
    } catch (error) {
      toast.error("Hata", { description: "Tüm izin talepleri yüklenemedi." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (action: 'approve' | 'reject', id: string) => {
    setActionLoading(id);
    try {
      if (action === 'approve') {
        await approveLeaveRequestAPI(id);
        toast.success("Başarılı", { description: "İzin talebi onaylandı." });
      } else {
        await rejectLeaveRequestAPI(id);
        toast.success("Başarılı", { description: "İzin talebi reddedildi." });
      }
      fetchData();
    } catch (error: any) {
      toast.error("Hata", { description: error.response?.data?.message || "İşlem sırasında bir hata oluştu." });
    } finally {
      setActionLoading(null);
    }
  };
  
  const formatDate = (dateString: string) => format(parseISO(dateString), 'dd MMM yyyy', { locale: tr });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary">Onay Bekliyor</Badge>;
      case 'APPROVED': return <Badge variant="default" className="bg-green-600">Onaylandı</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Reddedildi</Badge>;
      case 'CANCELLED': return <Badge variant="outline">İptal Edildi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Durum</TableHead>
            <TableHead>Personel</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Tarihler</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="h-24 text-center">Yönetilecek izin talebi bulunmuyor.</TableCell></TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{getStatusBadge(req.status)}</TableCell>
                <TableCell>{req.member.firstName} {req.member.lastName}</TableCell>
                <TableCell>{req.leaveType}</TableCell>
                <TableCell>{formatDate(req.startDate)} - {formatDate(req.endDate)}</TableCell>
                <TableCell>{req.reason || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  
                  {/* Admin, ONAYLI izni yazdırabilir */}
                  {req.status === 'APPROVED' && (
                    <PrintLeaveButton leaveRequest={req} />
                  )}
                  
                  {/* Admin, ONAY BEKLEYEN talebi yönetebilir */}
                  {req.status === 'PENDING' && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700" 
                        onClick={() => handleAction('approve', req.id)}
                        disabled={actionLoading === req.id}
                        title="Onayla"
                      >
                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleAction('reject', req.id)}
                        disabled={actionLoading === req.id}
                        title="Reddet"
                      >
                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}