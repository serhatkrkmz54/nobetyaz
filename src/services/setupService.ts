import apiClient from "@/lib/axios";

export interface SetupRequest {
  industryProfile: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhoneNumber: string;
}

/**
 * Backend'e kurulum isteği gönderir.
 */
export const performSetup = async (data: SetupRequest): Promise<void> => {
  try {
    await apiClient.post('/setup', data);
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  }
};