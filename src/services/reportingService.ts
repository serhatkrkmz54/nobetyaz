import apiClient from "@/lib/axios";

export interface MonthlySummary {
  memberId: string;
  memberFullName: string;
  year: number;
  month: number;
  totalScheduledHours: number;
  totalLeaveDays: number;
}

export interface AdminDashboardStats {
  totalActiveMembers: number;
  shiftsOpen: number;
  shiftsBidding: number;
  shiftsConfirmed: number;
  pendingShiftChanges: number;
  pendingLeaveRequests: number;
  pendingBids: number;
  monthStartDate: string;
  monthEndDate: string;
}

export const getMemberMonthlySummary = async (memberId: string, year: number, month: number): Promise<MonthlySummary> => {
  try {
    const response = await apiClient.get(`/reports/members/${memberId}/monthly-summary`, {
      params: { year, month }
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch monthly summary:", error);
    throw error;
  }
};

export const getAdminDashboardStatsAPI = async (): Promise<AdminDashboardStats> => {
  try {
    const response = await apiClient.get('/reports/admin-stats');
    return response.data;
  } catch (error) {
    console.error("Admin istatistikleri çekilemedi:", error);
    throw error;
  }
};