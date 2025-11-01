import apiClient from "@/lib/axios";

export interface ShiftChangeRequestData {
    initiatingShiftId: string;
    targetShiftId: string;
    reason?: string | null;
}
export interface ShiftChangeCreateRequestData {
  initiatingShiftId: string;
  targetShiftId: string;
  reason?: string | null;
}
export interface ShiftChangeActionData {
  action: string;
  notes?: string | null;
}
export interface ShiftInfo { id: string; date: string; startTime: string; endTime: string; locationName: string; }
export interface MemberMiniInfo { id: string; firstName: string; lastName: string; }
export interface ShiftChangeResponseData {
    id: string;
    initiatingShift: ShiftInfo;
    initiatingMember: MemberMiniInfo;
    targetShift: ShiftInfo;
    targetMember: MemberMiniInfo;
    status: string;
    requestReason: string | null;
    resolutionNotes: string | null;
}

export const createChangeRequestAPI = async (data: ShiftChangeRequestData): Promise<ShiftChangeResponseData> => {
    const response = await apiClient.post('/shift-changes', data);
    return response.data;
};

export const getMyRequestsAPI = async (): Promise<ShiftChangeResponseData[]> => {
    const response = await apiClient.get('/shift-changes/my-requests');
    return response.data;
};

export const respondToRequestAPI = async (requestId: string, data: ShiftChangeActionData): Promise<ShiftChangeResponseData> => {
    const response = await apiClient.put(`/shift-changes/${requestId}/respond`, data);
    return response.data;
};

export const resolveRequestAPI = async (requestId: string, data: ShiftChangeActionData): Promise<ShiftChangeResponseData> => {
    const response = await apiClient.put(`/shift-changes/${requestId}/resolve`, data);
    return response.data;
};

export const cancelRequestAPI = async (requestId: string): Promise<ShiftChangeResponseData> => {
    const response = await apiClient.put(`/shift-changes/${requestId}/cancel`);
    return response.data;
};