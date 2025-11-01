'use client';

import { useEffect, useState } from 'react';
import { LeaveRequest, getMyLeaveRequestsAPI, cancelLeaveRequestAPI } from '@/services/leaveService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { CreateLeaveRequestModal } from '@/components/CreateLeaveRequestModal';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { PrintLeaveButton } from '@/components/PrintLeaveButton'; 

export default function MyLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getMyLeaveRequestsAPI();
      setRequests(data);
    } catch (error) {
      toast.error("Hata", { description: "İzin talepleriniz yüklenemedi." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelLeaveRequestAPI(id);
      toast.success("Başarılı", { description: "İzin talebiniz iptal edildi." });
      fetchData();
    } catch (error: any) {
      toast.error("Hata", { description: error.response?.data?.message || "İzin iptal edilirken bir hata oluştu." });
    }
  };
  
  const formatDate = (dateString: string) => format(parseISO(dateString), 'dd MMMM yyyy', { locale: tr });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary">Onay Bekliyor</Badge>;
      case 'APPROVED': return <Badge variant="default" className="bg-green-600">Onaylandı</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Reddedildi</Badge>;
      case 'CANCELLED': return <Badge variant="outline">İptal Edildi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni İzin Talebi Oluştur
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Durum</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Hiç izin talebiniz bulunmuyor.</TableCell></TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>{req.leaveType}</TableCell>
                    <TableCell>{formatDate(req.startDate)}</TableCell>
                    <TableCell>{formatDate(req.endDate)}</TableCell>
                    <TableCell>{req.reason || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === 'APPROVED' && (
                        <PrintLeaveButton leaveRequest={req} />
                      )}
                      {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" title="Talebi İptal Et">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Talebi İptal Etmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancel(req.id)}>İptal Et</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateLeaveRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData} 
      />
    </div>
  );
}