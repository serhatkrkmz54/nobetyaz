import apiClient from "@/lib/axios";

import { User } from "@/store/authStore"; 

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

export const getUserProfileAPI = async (): Promise<User> => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    throw error;
  }
};


export const updateUserProfileAPI = async (data: UserUpdateRequest): Promise<User> => {
  try {
    const response = await apiClient.put('/users/me', data);
    return response.data;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
};