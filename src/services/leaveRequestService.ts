import apiClient from "@/lib/axios";
import { Member } from "./memberService";
import { LeaveRequestCreateRequest } from "./leaveService";

export interface LeaveMemberInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
  phoneNumber: string | null;
}

export interface LeaveRecordResponse {
  id: string;
  memberId: string;
  member: LeaveMemberInfo;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
}

export interface LeaveRecordCreateRequest {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface LeaveResolveRequest {
  approved: boolean;
  notes?: string | null;
}

export const createLeaveRequestAPI = async (data: LeaveRequestCreateRequest): Promise<LeaveRecordResponse> => {
  try {
    const response = await apiClient.post('/requests/leave', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create leave request:", error);
    throw error;
  }
};

// YOL: /api/requests/leave/my
export const getMyLeaveRequestsAPI = async (): Promise<LeaveRecordResponse[]> => {
  try {
    const response = await apiClient.get('/requests/leave/my');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch my leave requests:", error);
    throw error;
  }
};

// YOL: /api/requests/leave/all
export const getAllLeaveRequestsAPI = async (): Promise<LeaveRecordResponse[]> => {
  try {
    const response = await apiClient.get('/requests/leave/all');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch ALL leave requests:", error);
    throw error;
  }
};

// YOL: /api/requests/leave/{id}/approve
export const approveLeaveRequestAPI = async (leaveId: string): Promise<LeaveRecordResponse> => {
  try {
    const response = await apiClient.put(`/requests/leave/${leaveId}/approve`);
    return response.data;
  } catch (error) {
    console.error(`Failed to approve leave request ${leaveId}:`, error);
    throw error;
  }
};

// YOL: /api/requests/leave/{id}/reject
export const rejectLeaveRequestAPI = async (leaveId: string): Promise<LeaveRecordResponse> => {
  try {
    const response = await apiClient.put(`/requests/leave/${leaveId}/reject`);
    return response.data;
  } catch (error) {
    console.error(`Failed to reject leave request ${leaveId}:`, error);
    throw error;
  }
};

// YOL: /api/requests/leave/{id}/cancel (PUT metodu ile)
export const cancelLeaveRequestAPI = async (leaveId: string): Promise<LeaveRecordResponse> => {
  try {
    const response = await apiClient.put(`/requests/leave/${leaveId}/cancel`);
    return response.data;
  } catch (error) {
    console.error(`Failed to cancel leave request ${leaveId}:`, error);
    throw error;
  }
};