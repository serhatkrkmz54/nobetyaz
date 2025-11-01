import apiClient from "@/lib/axios";

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationInHours: number;
  isNightShift: boolean;
  daysOfWeek: string | null; 
  isActive: boolean;
}

export interface ShiftTemplateCreateRequest {
  name: string;
  startTime: string;
  endTime: string;
  isNightShift: boolean;
}

export interface ShiftTemplateUpdateRequest {
  name: string;
  startTime: string;
  endTime: string;
  isNightShift: boolean;
  isActive: boolean;
}

export const getAllShiftTemplates = async (includeInactive: boolean = false): Promise<ShiftTemplate[]> => {
  try {
    const response = await apiClient.get('/shift-templates', {
      params: { includeInactive }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch shift templates:", error);
    throw error;
  }
};

export const createShiftTemplate = async (data: ShiftTemplateCreateRequest): Promise<ShiftTemplate> => {
  try {
    const response = await apiClient.post('/shift-templates', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create shift template:", error);
    throw error;
  }
};

export const updateShiftTemplate = async (id: string, data: ShiftTemplateUpdateRequest): Promise<ShiftTemplate> => {
  try {
    const response = await apiClient.put(`/shift-templates/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update shift template ${id}:`, error);
    throw error;
  }
};

export const deleteShiftTemplate = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/shift-templates/${id}`);
  } catch (error) {
    console.error(`Failed to delete shift template ${id}:`, error);
    throw error;
  }
};