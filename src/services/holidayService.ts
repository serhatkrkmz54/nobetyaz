import apiClient from "@/lib/axios";

export type DayType = "WEEKDAY" | "WEEKEND" | "PUBLIC_HOLIDAY" | "RELIGIOUS_HOLIDAY" | "SPECIAL_DAY" | "ALL_DAYS";

export interface Holiday {
  id: string;
  name: string;
  holidayDate: string;
  holidayType: DayType;
}

export interface HolidayCreateRequest {
  name: string;
  holidayDate: string;
  holidayType: DayType;
}

export interface HolidayUpdateRequest {
  name: string;
  holidayDate: string;
  holidayType: DayType;
}

export const getAllHolidays = async (startDate?: string, endDate?: string): Promise<Holiday[]> => {
  try {
    const params = (startDate && endDate) ? { startDate, endDate } : {};
    const response = await apiClient.get('/management/holidays', { params });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
    throw error;
  }
};

export const createHoliday = async (data: HolidayCreateRequest): Promise<Holiday> => {
  try {
    const response = await apiClient.post('/management/holidays', data);
    return response.data;
  } catch (error) {
    console.error("Failed to create holiday:", error);
    throw error;
  }
};

export const updateHoliday = async (id: string, data: HolidayUpdateRequest): Promise<Holiday> => {
  try {
    const response = await apiClient.put(`/management/holidays/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update holiday ${id}:`, error);
    throw error;
  }
};

export const deleteHoliday = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/management/holidays/${id}`);
  } catch (error) {
    console.error(`Failed to delete holiday ${id}:`, error);
    throw error;
  }
};