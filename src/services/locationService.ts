import apiClient from "@/lib/axios";

export interface Location {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface LocationCreateRequest {
  name: string;
  description?: string | null;
}

export interface LocationUpdateRequest {
  name: string;
  description?: string | null;
  isActive: boolean;
}

export const getAllLocations = async (includeInactive: boolean = false): Promise<Location[]> => {
  try {
    const response = await apiClient.get('/locations', {
      params: { includeInactive: includeInactive },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    throw error;
  }
};

export const createLocation = async (data: LocationCreateRequest): Promise<Location> => {
  try {
    const response = await apiClient.post('/locations', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create location:", error);
    throw error;
  }
};

export const updateLocation = async (id: string, data: LocationUpdateRequest): Promise<Location> => {
  try {
    const response = await apiClient.put(`/locations/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update location ${id}:`, error);
    throw error;
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/locations/${id}`);
  } catch (error) {
    console.error(`Failed to delete location ${id}:`, error);
    throw error;
  }
};