import { create } from 'zustand';

interface DataCacheState {
  /**
   * Takvim verisinin en son ne zaman güncellenmesi GEREKTİĞİNİ tutan zaman damgası.
   */
  lastScheduleUpdate: Date;
  
  /**
   * Takvimin yenilenmesi gerektiğini (otomatik planlama bittiği için) 
   * tüm bileşenlere bildiren fonksiyon.
   */
  refreshSchedule: () => void;
}

export const useDataCacheStore = create<DataCacheState>((set) => ({
  lastScheduleUpdate: new Date(),
  
  refreshSchedule: () => {
    console.log("Global Data Cache: Takvim verisi bayatladı, yenileniyor...");
    set({ lastScheduleUpdate: new Date() });
  },
}));