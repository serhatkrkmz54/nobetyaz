import apiClient from "@/lib/axios";

export interface QualificationDTO {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  employeeId: string | null;
  isActive: boolean;
  qualifications: QualificationDTO[] | null;
  userStatus: string;
  invitationToken?: string | null;
  username: string | null;
}

export interface MemberCreateRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  employeeId?: string | null;
  username: string;
  email: string;
  roles: string[];
}

export interface MemberUpdateRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  employeeId?: string | null;
  isActive: boolean;
  userId?: string | null;
  qualificationIds: string[];
}

export const getAllMembers = async (): Promise<Member[]> => {
  try {
    const response = await apiClient.get('/members');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch members:", error);
    throw error;
  }
};

export const createMember = async (data: MemberCreateRequest): Promise<Member> => {
  try {
    const response = await apiClient.post('/members', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create member:", error);
    throw error;
  }
};

export const updateMember = async (id: string, data: MemberUpdateRequest): Promise<Member> => {
  try {
    const response = await apiClient.put(`/members/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update member ${id}:`, error);
    throw error;
  }
};

export const deleteMember = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/members/${id}`);
  } catch (error) {
    console.error(`Failed to delete member ${id}:`, error);
    throw error;
  }
};

export const getMemberByUserId = async (userId: string): Promise<Member | null> => {
    try {
        const response = await apiClient.get<Member>(`/members/user/${userId}`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to fetch member by user ID ${userId}:`, error);
        if (error.response && error.response.status === 404) {
            return null;
        }
        return null;
    }
};

export const resendInvitationAPI = async (memberId: string): Promise<Member> => {
  try {
    const response = await apiClient.post<Member>(`/members/${memberId}/resend-invitation`);
    return response.data;
  } catch (error) {
    console.error(`Failed to resend invitation for member ${memberId}:`, error);
    throw error;
  }
};