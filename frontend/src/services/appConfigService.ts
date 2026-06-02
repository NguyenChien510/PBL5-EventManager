import { apiClient } from "@/utils/axios";

export class AppConfigService {
  static async getGoogleClientId() {
    const response = await apiClient.get<{ clientId?: string }>('/public/config/google-client-id');
    return response.data.clientId || null;
  }
}
