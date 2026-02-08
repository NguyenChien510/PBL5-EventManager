export const API_BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:8080/api" : "/api";

export const TOKEN_STORAGE_KEY = "accessToken";
export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
export const USER_STORAGE_KEY = "user";

export const API_TIMEOUT = 10000;
export const MAX_RETRY_COUNT = 3;

export const ROUTES = {
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  HOME: "/",
  EVENTS: "/events",
  EVENT_DETAIL: "/events/:id",
  PROFILE: "/profile",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  EVENTS: {
    LIST: "/events",
    CREATE: "/events",
    DETAIL: "/events/:id",
    UPDATE: "/events/:id",
    DELETE: "/events/:id",
  },
} as const;
