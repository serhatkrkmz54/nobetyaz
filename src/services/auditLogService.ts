import apiClient from "@/lib/axios";

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  actionType: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
}

export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const response = await apiClient.get('/management/audit-logs');
    return response.data.sort((a: AuditLog, b: AuditLog) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    throw error;
  }
};