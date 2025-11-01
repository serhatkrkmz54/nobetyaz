import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import apiClient from '@/lib/axios';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showOnboarding: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (options?: { preventRedirect?: boolean }) => void;
  checkAuth: () => Promise<void>;
  clearOnboardingFlag: () => void;
}

interface BackendJwtResponse {
  token: string | null;
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
  showOnboarding: boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  showOnboarding: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<BackendJwtResponse>('/auth/login', { username, password });

      const { token, id, roles, firstName, lastName, email, phoneNumber, showOnboarding } = response.data;
      if (!token) throw new Error("Login response did not include a token.");

      const userPayload: User = {
        id: id,
        username: username,
        firstName: firstName,
        lastName: lastName,
        email: email || '',
        phoneNumber: phoneNumber || null,
        roles: roles || [],
      };

      Cookies.set('authToken', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      set({
        user: userPayload,
        token,
        isAuthenticated: true,
        isLoading: false,
        showOnboarding: showOnboarding
      });
    } catch (error) {
      console.error("Login failed:", error);
      set({ isLoading: false });
      get().logout({ preventRedirect: true });
      throw error;
    }
  },

  logout: (options) => {
    Cookies.remove('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    if (!options?.preventRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      showOnboarding: false
    });
  },

  checkAuth: async () => {
    const token = Cookies.get('authToken');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null, token: null });
      return;
    }
    try {
      const decodedToken: { exp: number } = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        get().logout();
        return;
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await apiClient.get<BackendJwtResponse>('/users/me');
      const userData = response.data;

      const userPayload: User = {
        id: userData.id,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || null,
        roles: userData.roles || [],
      };

      set({
        user: userPayload,
        token,
        isAuthenticated: true,
        isLoading: false,
        showOnboarding: userData.showOnboarding
      });

    } catch (error) {
      console.error("Auth check failed:", error);
      get().logout();
    }
  },

  clearOnboardingFlag: () => {
    set({ showOnboarding: false });
  },
}));