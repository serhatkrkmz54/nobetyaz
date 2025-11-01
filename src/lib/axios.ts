import { useAuthStore } from "@/store/authStore";
import axios, { AxiosError } from "axios";
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;

    if (url === '/setup/status') {
      return Promise.reject(error);
    }

    if (status === 401 && url !== '/auth/login') {
      const authState = useAuthStore.getState();

      if (authState.isAuthenticated) {
        console.warn("Interceptor: 401 Hatası alındı, otomatik logout yapılıyor.");

        toast.error("Oturum Hatası!", {
          description: "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.",
          duration: 5000,
        });

        authState.logout();
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;