import { apiClient } from "@/utils/axios";

export class EventService {
  static async getEventById(id: string) {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  }

  static async getEventTicketTypes(id: string) {
    const response = await apiClient.get(`/events/${id}/ticket-types`);
    return response.data;
  }

  static async getEventSeats(id: string) {
    const response = await apiClient.get(`/events/${id}/seats`);
    return response.data;
  }

  static async getUpcomingCardData() {
    const response = await apiClient.get(`/events/upcoming-card-data`);
    return response.data;
  }
}
