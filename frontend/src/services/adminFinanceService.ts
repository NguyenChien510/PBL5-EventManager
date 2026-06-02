import { apiClient } from "@/utils/axios";

export class AdminFinanceService {
  static async getOverview() {
    const response = await apiClient.get('/admin/finance/overview');
    return response.data;
  }

  static async getConfig() {
    const response = await apiClient.get('/admin/finance/config');
    return response.data;
  }

  static async updateConfig(payload: {
    defaultCommissionRate: string;
    autoApply: boolean;
  }) {
    const response = await apiClient.post('/admin/finance/config', payload);
    return response.data;
  }

  static async getOrders(page: number, keyword: string = '') {
    const query = new URLSearchParams({
      page: page.toString(),
      size: '5',
      keyword,
    });
    const response = await apiClient.get(`/admin/orders?${query.toString()}`);
    return response.data;
  }

  static async getEventSessionSeats(sessionId: number | string) {
    const response = await apiClient.get(`/events/sessions/${sessionId}/seats`);
    return response.data;
  }
}
