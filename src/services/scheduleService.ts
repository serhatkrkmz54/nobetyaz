import apiClient from "@/lib/axios";
import { Member, QualificationDTO } from "./memberService";
import { toast } from "sonner";

export interface ScheduledShift {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: string;
  location: { id: string; name: string };
  member: Member | null;
  shiftTemplate: { id: string; name: string };
  requiredQualification: QualificationDTO | null;
}

interface ScheduleGenerateRequest {
  year: number;
  month: number;
}


export const getScheduleByPeriod = async (startDate: string, endDate: string): Promise<ScheduledShift[]> => {
  try {
    const response = await apiClient.get('/schedule', {
      params: { startDate, endDate },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    throw error;
  }
};

export const assignMemberToShift = async (shiftId: string, memberId: string): Promise<ScheduledShift> => {
  try {
    const response = await apiClient.put(`/schedule/${shiftId}/assign`, { memberId });
    return response.data;
  } catch (error) {
    console.error("Failed to assign member:", error);
    throw error;
  }
};

export const generateScheduleForMonth = async (year: number, month: number): Promise<string> => {
  try {
    const response = await apiClient.post('/schedule/generate', { year, month });
    return response.data;
  } catch (error) {
    console.error("Failed to generate schedule:", error);
    throw error;
  }
};

export const getScheduleByIdAPI = async (shiftId: string): Promise<ScheduledShift> => {
  try {
    const response = await apiClient.get<ScheduledShift>(`/schedule/${shiftId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch shift ${shiftId}:`, error);
    throw error;
  }
};

export const solveScheduleAPI = async (year: number, month: number): Promise<string> => {
  try {
    const response = await apiClient.post(
      '/schedule/solve',
      null,
      { params: { year, month } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to start schedule solving:", error);
    throw error;
  }
};
export const getSolverStatusAPI = async (problemId: string): Promise<string> => {
  try {
    const response = await apiClient.get(`/schedule/solve/status/${problemId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to get solver status:", error);
    throw error;
  }
};

export const exportScheduleAPI = async (year: number, month: number): Promise<Blob> => {
  try {
    const response = await apiClient.get('/schedule/export', {
      params: { year, month },
      // DİKKAT: Dosya indirmek için 'blob' (binary large object) tipi şarttır
      responseType: 'blob',
    });

    // Dosya adını 'content-disposition' header'ından almaya çalış
    // Bu, backend'de ayarladığımız filename="Cizelge_2025_10.xlsx" kısmıdır.
    const header = response.headers['content-disposition'];
    let filename = `Cizelge_${year}_${month}.xlsx`; // Varsayılan
    if (header) {
      const parts = header.split('filename=');
      if (parts.length > 1) {
        filename = parts[1].split(';')[0].replace(/"/g, ''); // Tırnak işaretlerini kaldır
      }
    }

    // Tarayıcının dosyayı indirmesini tetikle
    // 1. Blob verisinden geçici bir URL oluştur
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // 2. Gizli bir link (<a>) elementi oluştur
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // Dosya adını ayarla
    // 3. Linki tıkla ve sonra kaldır
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data; // Teknik olarak 'Blob'u döndürür

  } catch (error) {
    console.error("Failed to export schedule:", error);
    toast.error("Hata!", { description: "Çizelge dışa aktarılamadı." });
    throw error;
  }
};