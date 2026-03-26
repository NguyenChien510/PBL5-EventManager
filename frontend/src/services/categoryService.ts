import { apiClient } from "@/utils/axios";
import type { Category } from "@/types";

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>("/public/categories");
    return response.data;
  }
}
