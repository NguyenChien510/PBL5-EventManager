import { apiClient } from "@/utils/axios";

export interface Notification {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
}

export class NotificationService {
  static async getNotifications() {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  }

  static async markAsRead(id: number) {
    await apiClient.post(`/notifications/${id}/read`);
  }

  static async markAllAsRead() {
    await apiClient.post('/notifications/read-all');
  }
}
