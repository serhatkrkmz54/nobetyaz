import apiClient from "@/lib/axios";
import { Notification } from "@/store/notificationStore"; // Tipi store'dan alabiliriz

// --- API Fonksiyonları ---

/**
 * (Header Çanı İçin) Sadece aktif (Arşivlenmemiş) bildirimleri getirir.
 */
export const apiFetchActiveNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/notifications/active');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch active notifications:", error);
    throw error;
  }
};

/**
 * (/notifications Sayfası İçin) Kullanıcının TÜM bildirimlerini getirir.
 */
export const apiFetchAllNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/notifications');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch all notifications:", error);
    throw error;
  }
};

/**
 * Bir bildirimi 'READ' (Okundu) olarak işaretler.
 */
export const apiMarkAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/mark-as-read`);
    return response.data;
  } catch (error) {
    console.error(`Failed to mark notification ${notificationId} as read:`, error);
    throw error;
  }
};

/**
 * Bir bildirimi 'ARCHIVED' (Arşivlendi) olarak işaretler. (Kullanıcı için "Sil")
 */
export const apiArchiveNotification = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/archive`);
    return response.data;
  } catch (error) {
    console.error(`Failed to archive notification ${notificationId}:`, error);
    throw error;
  }
};