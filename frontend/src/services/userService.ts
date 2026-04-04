import { apiClient } from "@/utils/axios";

export class UserService {
  static async getAllUsers() {
    const response = await apiClient.get('/users/all');
    return response.data;
  }
}
