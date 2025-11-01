'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { getMyBidsAPI, MyBidResponseData, retractBidAPI } from '@/services/shiftBiddingService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BiddingRequestsTabProps {
}

export function BiddingRequestsTab({}: BiddingRequestsTabProps) {
  const [bids, setBids] = useState<MyBidResponseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyBids = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyBidsAPI();
      setBids(data);
    } catch (error) {
      toast.error("Hata!", { description: "Borsa teklifleriniz yüklenirken bir sorun oluştu." });
      setBids([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

  const handleRetractBid = async (bidId: string) => {
    try {
      await retractBidAPI(bidId);
      toast.success("Başarılı", { description: "Teklifiniz geri çekildi." });
      fetchMyBids();
    } catch (error: any) {
      toast.error("Hata!", { description: error.response?.data?.message || "İşlem sırasında bir hata oluştu." });
    }
  };

  // Helper Fonksiyonlar
  const formatDate = (dateString: string) => format(new Date(dateString), 'dd MMM yy', { locale: tr });
  const formatTime = (timeString: string) => timeString.substring(0, 5);

  const getBidStatusBadge = (status: string): React.ReactNode => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="secondary">Aktif (Onay Bekliyor)</Badge>;
      case 'AWARDED': return <Badge variant="default" className="bg-green-100 text-green-800 ...">Kazandınız</Badge>;
      case 'LOST': return <Badge variant="destructive">Kaybedildi</Badge>;
      case 'RETRACTED': return <Badge variant="outline">Geri Çekildi</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Borsa Tekliflerim</CardTitle>
          <CardDescription>Nöbet borsasına yaptığınız ve sonuçlanan teklifleriniz.</CardDescription>
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
        <CardTitle>Borsa Tekliflerim</CardTitle>
        <CardDescription>Nöbet borsasına yaptığınız ve sonuçlanan teklifleriniz.</CardDescription>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <p className="text-center text-muted-foreground p-8">Aktif veya geçmiş borsa teklifiniz bulunmuyor.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nöbet</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Notunuz</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => {
                const canRetract = bid.bidStatus === 'ACTIVE';
                return (
                  <TableRow key={bid.bidId}>
                    <TableCell className="font-medium">
                      {bid.locationName} <br />
                      <span className="text-xs text-muted-foreground">{formatTime(bid.startTime)} - {formatTime(bid.endTime)}</span>
                    </TableCell>
                    <TableCell>{formatDate(bid.shiftDate)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{bid.bidNotes || '-'}</TableCell>
                    <TableCell>{getBidStatusBadge(bid.bidStatus)}</TableCell>
                    <TableCell className="text-right">
                      {canRetract && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="outline">Geri Çek</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Teklifi Geri Çek?</AlertDialogTitle><AlertDialogDescription>Bu teklifi geri çekmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRetractBid(bid.bidId)}>Geri Çek</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {!canRetract && '-'}
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