import apiClient from "@/lib/axios";

// Backend DTO'larının TypeScript karşılıkları
export interface Qualification {
  id: string;
  name: string;
  description: string | null;
}

export interface QualificationCreateRequest {
  name: string;
  description?: string | null;
}

export interface QualificationUpdateRequest {
  name: string;
  description?: string | null;
}

// --- API Fonksiyonları ---
export const getAllQualifications = async (): Promise<Qualification[]> => {
  try {
    const response = await apiClient.get('/qualifications');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch qualifications:", error);
    throw error;
  }
};

export const createQualification = async (data: QualificationCreateRequest): Promise<Qualification> => {
  try {
    const response = await apiClient.post('/qualifications', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create qualification:", error);
    throw error;
  }
};

export const updateQualification = async (id: string, data: QualificationUpdateRequest): Promise<Qualification> => {
  try {
    const response = await apiClient.put(`/qualifications/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update qualification ${id}:`, error);
    throw error;
  }
};

export const deleteQualification = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/qualifications/${id}`);
  } catch (error) {
    console.error(`Failed to delete qualification ${id}:`, error);
    throw error;
  }
};