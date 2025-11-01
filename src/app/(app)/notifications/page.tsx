'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import {
  Loader2, Archive, Eye, Inbox, Bell, MailOpen, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Notification } from '@/store/notificationStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatDate = (dateString: string) =>
    format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: tr });

  const fetchAllNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      setNotifications(response.data);
    } catch {
      toast.error("Bildirimler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/mark-as-read`);
      toast.success("Bildirim okundu olarak işaretlendi.");
      fetchAllNotifications();
    } catch {
      toast.error("İşlem yapılamadı.");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/archive`);
      toast.success("Bildirim arşivlendi.");
      fetchAllNotifications();
    } catch {
      toast.error("Bildirim arşivlenemedi.");
    }
  };

  const getStatusBadge = (status: Notification['status']) => {
    switch (status) {
      case 'UNREAD':
        return <Badge className="bg-red-500/90 text-white">Okunmadı</Badge>;
      case 'READ':
        return <Badge className="bg-blue-500/80 text-white">Okundu</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="border-gray-400 text-gray-600">Arşivlendi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Bildirimler</h1>
        </div>
        <Button
          variant="outline"
          onClick={fetchAllNotifications}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Yenile
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary" />
          <p>Bildirimler yükleniyor...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border rounded-lg bg-white shadow-sm">
          <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800">Bildirim Kutunuz Boş</h2>
          <p className="mt-2 text-gray-500">Henüz bir bildirim bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group flex items-start justify-between gap-4 p-5 border rounded-xl bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-[2px]",
                n.status === 'UNREAD' && "border-primary/60 bg-primary/5",
                n.status === 'ARCHIVED' && "opacity-70 bg-gray-50"
              )}
            >
              <div className="flex-1 space-y-2">
                <p className={cn("text-sm leading-relaxed", n.status === 'UNREAD' && "font-semibold text-gray-900")}>
                  {n.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getStatusBadge(n.status)}
                  <span>{formatDate(n.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {n.status === 'UNREAD' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="gap-2"
                  >
                    <MailOpen className="h-4 w-4" />
                    Okundu
                  </Button>
                )}
                {n.status === 'READ' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Archive className="h-4 w-4" />
                        Arşivle
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bildirimi Arşivle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu bildirim arşive taşınacak. Emin misiniz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleArchive(n.id)}>
                          Evet, Arşivle
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
