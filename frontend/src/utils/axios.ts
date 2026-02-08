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

  // Request interceptor
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const rawAuth = localStorage.getItem("auth-storage");
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

      // Skip refresh untuk auth endpoints
      if (
        originalRequest.url?.includes("/auth/signin") ||
        originalRequest.url?.includes("/auth/signup") ||
        originalRequest.url?.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (
        (status === 401 || status === 403) &&
        originalRequest._retryCount < 3
      ) {
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
          const rawAuth = localStorage.getItem("auth-storage");
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
          localStorage.setItem("auth-storage", JSON.stringify(nextState));

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (err) {
          const rawAuth = localStorage.getItem("auth-storage");
          if (rawAuth) {
            const parsed = JSON.parse(rawAuth) as {
              state?: { accessToken?: string };
            };
            if (parsed.state) {
              delete parsed.state.accessToken;
              localStorage.setItem("auth-storage", JSON.stringify(parsed));
            }
          }
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
