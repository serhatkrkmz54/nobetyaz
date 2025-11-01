'use client';

import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useNotificationStore, Notification as StoreNotification } from '@/store/notificationStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import LoadingScreen from './LoadingScreen';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const checkSetupStatus = useAppStore((state) => state.checkSetupStatus);
  const isSetupComplete = useAppStore((state) => state.isSetupComplete);

  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const router = useRouter();
  const pathname = usePathname();
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    (async () => {
      await Promise.allSettled([checkSetupStatus(), checkAuth()]);
    })();
  }, [checkAuth, checkSetupStatus]);

useEffect(() => {
    if (isAuthLoading || isSetupComplete === null) return;

    const publicPaths = ['/login', '/setup', '/activate'];

    if (!isSetupComplete && pathname !== '/setup') {
      router.replace('/setup');
    } else if (isSetupComplete && !isAuthenticated && !publicPaths.includes(pathname)) {
      router.replace('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/setup')) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, isSetupComplete, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated || !isSetupComplete || !token || pathname === '/activate') return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        fetchNotifications();
        client.subscribe('/user/queue/notifications', (message) => {
          try {
            const newNotification: StoreNotification = JSON.parse(message.body);
            addNotification(newNotification);
          } catch (e) {
            console.error('WebSocket mesajı işlenemedi:', e);
          }
        });
      },
      onStompError: (frame) => console.error('STOMP hatası:', frame.headers['message']),
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [isAuthenticated, isSetupComplete, token, user, fetchNotifications, addNotification]);

  const publicPaths = ['/login', '/setup', '/activate'];

const shouldShowLoading =
    isAuthLoading ||
    isSetupComplete === null ||
    (!isAuthenticated && !publicPaths.includes(pathname));

  if (shouldShowLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}