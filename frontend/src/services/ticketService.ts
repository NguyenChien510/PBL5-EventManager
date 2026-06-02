import { apiClient } from "@/utils/axios";

export class TicketService {
  static async getMyTickets() {
    const response = await apiClient.get('/tickets/my');
    return response.data;
  }

  static async getTicketStatuses() {
    const response = await apiClient.get('/tickets/statuses');
    return response.data;
  }
}
