import apiClient from "@/lib/axios";

export interface LeaveMemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
  phoneNumber: string | null;
}

export interface LeaveRequest {
  id: string;
  member: LeaveMemberInfo;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

export interface LeaveRequestCreateRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export const getMyLeaveRequestsAPI = async (): Promise<LeaveRequest[]> => {
  try {
    const response = await apiClient.get('/requests/leave/my');
    return response.data;
  } catch (error) { throw error; }
};

export const getAllLeaveRequestsAPI = async (): Promise<LeaveRequest[]> => {
  try {
    const response = await apiClient.get('/requests/leave/all');
    return response.data;
  } catch (error) { throw error; }
};

export const createLeaveRequestAPI = async (data: LeaveRequestCreateRequest): Promise<LeaveRequest> => {
  try {
    const response = await apiClient.post('/requests/leave', data);
    return response.data;
  } catch (error) { throw error; }
};

export const cancelLeaveRequestAPI = async (id: string): Promise<LeaveRequest> => {
  try {
    const response = await apiClient.put(`/requests/leave/${id}/cancel`);
    return response.data;
  } catch (error) { throw error; }
};

export const approveLeaveRequestAPI = async (id: string): Promise<LeaveRequest> => {
  try {
    const response = await apiClient.put(`/requests/leave/${id}/approve`);
    return response.data;
  } catch (error) { throw error; }
};

export const rejectLeaveRequestAPI = async (id: string): Promise<LeaveRequest> => {
  try {
    const response = await apiClient.put(`/requests/leave/${id}/reject`);
    return response.data;
  } catch (error) { throw error; }
};

export const getApprovedLeaveRequestsByPeriod = async (startDate: string, endDate: string): Promise<LeaveRequest[]> => {
  try {
    const response = await apiClient.get('/requests/leave/approved-by-period', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) { throw error; }
};