import { create } from 'zustand';
import apiClient from '@/lib/axios';
import { toast } from 'sonner';
import { useDataCacheStore } from './dataCacheStore';
import { apiArchiveNotification, apiFetchActiveNotifications } from '@/services/notificationService';

export interface Notification {
  id: string;
  message: string;
  notificationType: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  relatedEntityId: string | null;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
}

const apiFetchNotifications = async (): Promise<Notification[]> => {
  const response = await apiClient.get('/notifications');
  return response.data;
};

const apiMarkAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await apiClient.put(`/notifications/${notificationId}/mark-as-read`);
  return response.data;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  /**
   * Sayfa ilk yüklendiğinde (veya kullanıcı giriş yaptığında)
   * 'READ' ve 'UNREAD' tüm bildirimleri API'den çeker.
   */
  fetchNotifications: async () => {
    try {
      const response = await apiClient.get<Notification[]>('/notifications/active'); // Controller'daki /active endpoint'i
      const notifications = response.data;

      set({
        notifications: notifications,
        unreadCount: notifications.filter(n => n.status === 'UNREAD').length
      });
    } catch (error) {
      console.error("Bildirimler yüklenemedi:", error);
    }
  },

  /**
   * WebSocket'ten yeni bildirim geldiğinde (ANLIK) listeye ekler.
   */
  addNotification: (notification: Notification) => {
    set(state => ({
      // Yeni bildirimi listenin başına ekle
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
    toast.info(notification.message, { position: 'top-right' }); // Anlık bildirim
  },

  /**
   * Bir bildirimi okundu olarak işaretler (Hem state'te hem API'de)
   */
  markAsRead: async (id: string) => {
    const originalNotifications = get().notifications;

    // 1. İyimser Güncelleme (UI hızlı yanıt versin diye)
    const updatedNotifications = originalNotifications.map(n =>
      n.id === id ? { ...n, status: 'READ' as const } : n
    );
    set(state => ({
      notifications: updatedNotifications,
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0
    }));

    // 2. API Güncellemesi
    try {
      await apiClient.put(`/notifications/${id}/mark-as-read`); // Controller'daki endpoint
    } catch (error) {
      console.error("Bildirim okundu olarak işaretlenemedi:", error);
      toast.error("Hata!", { description: "Bildirim güncellenemedi." });
      // Hata olursa state'i geri al
      set({
        notifications: originalNotifications,
        unreadCount: originalNotifications.filter(n => n.status === 'UNREAD').length
      });
    }
  },

  /**
   * Bir bildirimi arşivler (Sadece 'READ' olanları)
   */
  archiveNotification: async (id: string) => {
    const originalNotifications = get().notifications;
    const notificationToArchive = originalNotifications.find(n => n.id === id);

    if (!notificationToArchive || notificationToArchive.status !== 'READ') {
      return; // Backend kuralıyla aynı, sadece 'READ' olanlar
    }

    // 1. İyimser Güncelleme (Listeden kaldır)
    const updatedNotifications = originalNotifications.filter(n => n.id !== id);
    set({ notifications: updatedNotifications });

    // 2. API Güncellemesi
    try {
      await apiClient.put(`/notifications/${id}/archive`); // Controller'daki endpoint
    } catch (error) {
      console.error("Bildirim arşivlenemedi:", error);
      toast.error("Hata!", { description: "Bildirim arşivlenemedi." });
      // Hata olursa state'i geri al
      set({ notifications: originalNotifications });
    }
  },
}));