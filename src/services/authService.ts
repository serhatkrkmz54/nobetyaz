import apiClient from "@/lib/axios";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ActivateAccountRequest {
  username: string;
  pin: string;
  newPassword: string;
}


export const activateAccountAPI = async (data: ActivateAccountRequest): Promise<string> => {
  try {
    const response = await apiClient.post('/auth/activate-account', data);
    return response.data;
  } catch (error) {
    console.error("Failed to activate account:", error);
    throw error;
  }
};

export const changePasswordAPI = async (data: ChangePasswordRequest): Promise<string> => {
  try {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  } catch (error) {
    console.error("Failed to change password:", error);
    throw error;
  }
};