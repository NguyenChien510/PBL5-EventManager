import { create } from "zustand";
import { LocationService } from "@/services/locationService";
import type { Province, Ward } from "@/types";

interface LocationState {
  provinces: Province[];
  wards: Ward[];
  isLoading: boolean;
  error: string | null;
  fetchProvinces: () => Promise<void>;
  fetchWards: (provinceId: number) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  provinces: [],
  wards: [],
  isLoading: false,
  error: null,

  fetchProvinces: async () => {
    if (get().provinces.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const provinces = await LocationService.getAllProvinces();
      set({ provinces, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch provinces", isLoading: false });
    }
  },

  fetchWards: async (provinceId: number) => {
    set({ isLoading: true, error: null });
    try {
      const wards = await LocationService.getWardsByProvince(provinceId);
      set({ wards, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch wards", isLoading: false });
    }
  },
}));
