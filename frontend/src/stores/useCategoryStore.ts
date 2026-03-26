import { create } from "zustand";
import { CategoryService } from "@/services/categoryService";
import type { Category } from "@/types";

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getCategoryById: (id: number) => Category | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    if (get().categories.length > 0) return; // Already fetched
    
    set({ isLoading: true, error: null });
    try {
      const categories = await CategoryService.getAllCategories();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch categories", isLoading: false });
    }
  },

  getCategoryById: (id: number) => {
    return get().categories.find((c) => c.id === id);
  },
}));
