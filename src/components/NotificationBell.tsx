'use client';

import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Bell, BellOff, X } from "lucide-react"; // ✅ X ikonunu import et
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotificationBell() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const archiveNotification = useNotificationStore((state) => state.archiveNotification); // ✅ YENİ

  const handleNotificationClick = (id: string, status: string) => {
    if (status === 'UNREAD') {
      markAsRead(id);
    }
    // TODO: Tıklandığında ilgili sayfaya (relatedEntityId) git
    // router.push(`/requests/${relatedEntityId}`);
  };

  // ✅ YENİ: Arşivle butonuna tıklama
  const handleArchiveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Dropdown'un kapanmasını engelle
    archiveNotification(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 justify-center items-center text-xs text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2" align="end">
        <DropdownMenuLabel className="px-2 py-1.5">Bildirimler</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <BellOff className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Aktif bildiriminiz yok.</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex justify-between items-center gap-2 cursor-pointer p-3",
                  n.status === 'UNREAD' && "bg-primary/5 font-medium"
                )}
                onClick={() => handleNotificationClick(n.id, n.status)}
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* ✅ YENİ: "Arşivle" Butonu */}
                {n.status === 'READ' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full opacity-50 hover:opacity-100"
                    title="Bu bildirimi gizle"
                    onClick={(e) => handleArchiveClick(e, n.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/notifications"
            className="w-full flex justify-center items-center cursor-pointer text-sm text-primary py-2"
          >
            Tüm Bildirimleri Gör
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}