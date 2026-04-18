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

  static async searchEvents(params: any) {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.categoryId && params.categoryId !== 'all') query.append('categoryId', params.categoryId.toString());
    if (params.province && params.province !== 'Chọn khu vực' && params.province !== 'Tất cả khu vực') query.append('province', params.province);
    if (params.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params.dateFilter && params.dateFilter !== 'Tất cả thời gian') query.append('dateFilter', params.dateFilter);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const response = await apiClient.get(`/events/search?${query.toString()}`);
    return response.data;
  }
  
  static async getAllAdminEvents(page: number = 0, size: number = 5, statuses?: string[], keyword?: string) {
    const query = new URLSearchParams();
    query.append('page', page.toString());
    query.append('size', size.toString());
    if (keyword) query.append('keyword', keyword);
    if (statuses && statuses.length > 0) {
      statuses.forEach(s => query.append('statuses', s));
    }
    
    const response = await apiClient.get(`/events/admin/all?${query.toString()}`);
    return response.data;
  }



  static async updateEventStatus(id: number | string, status: string, rejectReason?: string) {
    let url = `/events/admin/${id}/status?status=${status}`;
    if (rejectReason) {
      url += `&rejectReason=${encodeURIComponent(rejectReason)}`;
    }
    const response = await apiClient.patch(url);
    return response.data;
  }

  static async getOrganizerDashboard(page: number = 0, size: number = 10, status?: string) {
    let url = `/events/organizer/dashboard?page=${page}&size=${size}`;
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  }

  static async createEvent(data: any) {
    const response = await apiClient.post('/events', data);
    return response.data;
  }

  static async getEventManageStats(id: string | number) {
    const response = await apiClient.get(`/organizer/events/${id}/manage/stats`);
    return response.data;
  }

  static async getEventAttendees(id: string | number) {
    const response = await apiClient.get(`/organizer/events/${id}/manage/attendees`);
    return response.data;
  }

  static async checkInTicket(ticketId: number, checkedIn: boolean) {
    const response = await apiClient.patch(`/organizer/tickets/${ticketId}/check-in?checkedIn=${checkedIn}`);
    return response.data;
  }
}
