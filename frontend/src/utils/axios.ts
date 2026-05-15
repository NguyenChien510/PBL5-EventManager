import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, API_TIMEOUT } from "@/constants";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retryCount?: number;
  }
}

const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    withCredentials: true,
  });

  // Helper to get storage data dynamically from either provider
  const getStoredAuth = (): string | null => {
    return localStorage.getItem("auth-storage") || sessionStorage.getItem("auth-storage");
  };

  // Request interceptor
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const rawAuth = getStoredAuth();
      const token = rawAuth
        ? (JSON.parse(rawAuth) as { state?: { accessToken?: string } })?.state
            ?.accessToken
        : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retryCount?: number;
      };

      // Skip refresh for auth endpoints
      if (
        originalRequest.url?.includes("/auth/signin") ||
        originalRequest.url?.includes("/auth/signup") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (status === 401 && originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;

        try {
          const response = await api.post(
            "/auth/refresh",
            {},
            {
              withCredentials: true,
            },
          );

          const accessToken = response.data?.accessToken;
          if (!accessToken) {
            throw new Error("Refresh response missing accessToken");
          }
          
          const rawAuth = getStoredAuth();
          const parsed = rawAuth
            ? (JSON.parse(rawAuth) as { state?: { accessToken?: string } })
            : { state: {} };
          const nextState = {
            ...parsed,
            state: {
              ...parsed.state,
              accessToken,
            },
          };
          
          // Write to the correct target storage
          const remember = localStorage.getItem("remember-me") === "true";
          const storageTarget = remember ? localStorage : sessionStorage;
          storageTarget.setItem("auth-storage", JSON.stringify(nextState));

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (err) {
          // Clear everything
          localStorage.removeItem("auth-storage");
          sessionStorage.removeItem("auth-storage");
          localStorage.removeItem("refreshToken");
          sessionStorage.removeItem("refreshToken");
          window.location.href = "/signin";
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
};

export const apiClient = createApiClient();
