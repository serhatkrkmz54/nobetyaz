import apiClient from "@/lib/axios";

export const isFeatureEnabledAPI = async (key: string): Promise<boolean> => {
  try {
    const response = await apiClient.get('/auth/feature-status', {
      params: { key }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to check feature flag ${key}:`, error);
    return false;
  }
};