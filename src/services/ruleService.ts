import apiClient from "@/lib/axios";

export interface RuleConfiguration {
  ruleKey: string;
  ruleValue: string;
  description: string;
}

export interface RuleConfigurationUpdateRequest {
  ruleValue: string;
}


export const getAllRules = async (): Promise<RuleConfiguration[]> => {
  try {
    const response = await apiClient.get('/management/rules');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch rules:", error);
    throw error;
  }
};

export const updateRule = async (ruleKey: string, data: RuleConfigurationUpdateRequest): Promise<RuleConfiguration> => {
  try {
    const response = await apiClient.put(`/management/rules/${ruleKey}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update rule ${ruleKey}:`, error);
    throw error;
  }
};