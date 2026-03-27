import { apiClient } from "@/utils/axios";
import type { Province, Ward } from "@/types";

export class LocationService {
  static async getAllProvinces(): Promise<Province[]> {
    const response = await apiClient.get<Province[]>("/locations/provinces");
    return response.data;
  }

  static async getWardsByProvince(provinceId: number): Promise<Ward[]> {
    const response = await apiClient.get<Ward[]>(`/locations/provinces/${provinceId}/wards`);
    return response.data;
  }
}
