import apiClient from "@/lib/axios";
import { ScheduledShift } from "./scheduleService";
import { Member } from "./memberService";

export interface ShiftBidCreateData { notes?: string | null; }
export interface ShiftBidResponseData {
  id: string;
  memberId: string;
  memberFullName: string;
  bidStatus: string;
  notes: string | null;
}

export interface MyBidResponseData {
  bidId: string;
  bidStatus: string;
  bidNotes: string | null;
  shiftId: string;
  locationName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
}

export const getOpenBiddingShiftsAPI = async (): Promise<ScheduledShift[]> => {
  try {
    const response = await apiClient.get('/bidding/open-shifts');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch open bidding shifts:", error);
    throw error;
  }
};

export const createBidAPI = async (shiftId: string, notes: string | null): Promise<ShiftBidResponseData> => {
  try {
    const response = await apiClient.post(`/bidding/shifts/${shiftId}/bids`, { notes });
    return response.data;
  } catch (error) {
    console.error("Failed to create bid:", error);
    throw error;
  }
};

export const getMyBidsAPI = async (): Promise<MyBidResponseData[]> => {
  try {
    const response = await apiClient.get('/bidding/my-bids');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch my bids:", error);
    throw error;
  }
};

export const retractBidAPI = async (bidId: string): Promise<void> => {
  try {
    await apiClient.put(`/bidding/bids/${bidId}/retract`);
  } catch (error) {
    console.error(`Failed to retract bid ${bidId}:`, error);
    throw error;
  }
};

export const getBidsForShiftAPI = async (shiftId: string): Promise<ShiftBidResponseData[]> => {
  try {
    const response = await apiClient.get(`/bidding/shifts/${shiftId}/bids`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch bids for shift ${shiftId}:`, error);
    throw error;
  }
};

export const postShiftToBiddingAPI = async (shiftId: string): Promise<ScheduledShift> => {
  const response = await apiClient.post(`/bidding/shifts/${shiftId}/open`);
  return response.data;
};

export const placeBidAPI = async (shiftId: string, data: ShiftBidCreateData): Promise<ShiftBidResponseData> => {
  const response = await apiClient.post(`/bidding/shifts/${shiftId}/bids`, data);
  return response.data;
};

export const listBidsForShiftAPI = async (shiftId: string): Promise<ShiftBidResponseData[]> => {
  const response = await apiClient.get(`/bidding/shifts/${shiftId}/bids`);
  return response.data;
};

export const awardShiftAPI = async (shiftId: string, bidId: string): Promise<ScheduledShift> => {
  const response = await apiClient.post(`/bidding/shifts/${shiftId}/bids/${bidId}/award`);
  return response.data;
};