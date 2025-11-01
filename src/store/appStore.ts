import { create } from 'zustand';
import apiClient from '@/lib/axios';

interface AppState {
  isSetupComplete: boolean | null;
  checkSetupStatus: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set) => ({
  isSetupComplete: null,

  checkSetupStatus: async () => {
    try {
      const response = await apiClient.get('/setup/status');
      const isComplete = response.data.isSetupComplete;
      set({ isSetupComplete: isComplete });
      return isComplete;
    } catch (error) {
      console.error("Setup status check failed:", error);
      // API'ye ulaşılamadığında veya hata durumunda null olarak ayarla
      set({ isSetupComplete: null });
      return false;
    }
  },
}));