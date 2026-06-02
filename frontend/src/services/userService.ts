import { apiClient } from "@/utils/axios";

export class UserService {
  static async getAllUsers() {
    const response = await apiClient.get('/users/all');
    return response.data;
  }

  static async getCurrentUser() {
    const response = await apiClient.get('/users/me');
    return response.data;
  }

  static async updateName(fullName: string) {
    const response = await apiClient.post('/users/update-name', { fullName });
    return response.data;
  }

  static async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    const response = await apiClient.post('/users/change-password', payload);
    return response.data;
  }

  static async uploadAvatar(formData: FormData) {
    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
}
