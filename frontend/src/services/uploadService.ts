import { apiClient } from "@/utils/axios";

export class UploadService {
  static async uploadMultiple(formData: FormData) {
    const response = await apiClient.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
}
