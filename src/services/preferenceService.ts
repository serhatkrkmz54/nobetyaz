import apiClient from "@/lib/axios";

export interface MemberPreferenceResponse {
  id: string;
  memberId: string;
  shiftTemplateId: string;
  shiftTemplateName: string;
  shiftTemplateTime: string;
  dayOfWeek: number;
  preferenceScore: number;
}

export interface MemberPreferenceCreateRequest {
  shiftTemplateId: string;
  dayOfWeek: number;
  preferenceScore: number;
}

export const getMyPreferencesAPI = async (): Promise<MemberPreferenceResponse[]> => {
  try {
    const response = await apiClient.get('/preferences/my');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch member preferences:", error);
    throw error;
  }
};

export const createPreferenceAPI = async (data: MemberPreferenceCreateRequest): Promise<MemberPreferenceResponse> => {
  try {
    const response = await apiClient.post('/preferences', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create preference:", error);
    throw error;
  }
};

export const deletePreferenceAPI = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/preferences/${id}`);
  } catch (error) {
    console.error(`Failed to delete preference ${id}:`, error);
    throw error;
  }
};