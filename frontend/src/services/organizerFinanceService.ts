import { apiClient } from "@/utils/axios";

export class OrganizerFinanceService {
  static async getTransactions() {
    const response = await apiClient.get('/organizer/finance/transactions');
    return response.data;
  }

  static async getStats() {
    const response = await apiClient.get('/organizer/finance/stats');
    return response.data;
  }
}
