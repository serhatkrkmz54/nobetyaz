import apiClient from "@/lib/axios";

export interface ShiftRequirement {
  id: string;
  locationId: string;
  locationName: string;
  shiftTemplateId: string;
  shiftTemplateName: string;
  qualificationId: string | null;
  qualificationName: string;
  requiredMemberCount: number;
  applyOn: string;
}

export interface ShiftRequirementCreateRequest {
  locationId: string;
  shiftTemplateId: string;
  qualificationId?: string | null;
  requiredMemberCount: number;
  applyOn: string;
}

export const getRequirements = async (locationId: string, shiftTemplateId: string): Promise<ShiftRequirement[]> => {
  try {
    const response = await apiClient.get('/shift-requirements', {
      params: { locationId, shiftTemplateId },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch shift requirements:", error);
    throw error;
  }
};

export const createRequirement = async (data: ShiftRequirementCreateRequest): Promise<ShiftRequirement> => {
  try {
    const response = await apiClient.post('/shift-requirements', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create shift requirement:", error);
    throw error;
  }
};

export const deleteRequirement = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/shift-requirements/${id}`);
  } catch (error) {
    console.error(`Failed to delete shift requirement ${id}:`, error);
    throw error;
  }
};