import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import type {
  AuthState,
  User,
  SignInPayload,
  SignUpPayload,
  ApiErrorResponse,
} from "@/types";
import { AuthService } from "@/services/authService";
import { REFRESH_TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/constants";

const dynamicStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name) || sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    const remember = localStorage.getItem("remember-me") === "true";
    if (remember) {
      localStorage.setItem(name, value);
      sessionStorage.removeItem(name);
    } else {
      sessionStorage.setItem(name, value);
      localStorage.removeItem(name);
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  }
};

interface AuthStore extends AuthState {
  signIn: (payload: SignInPayload, remember?: boolean) => Promise<User>;
  googleSignIn: (credential: string) => Promise<User>;
  signUp: (payload: SignUpPayload) => Promise<User>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  isTokenExpired: (token: string) => boolean;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) {
      return data.message;
    }
    if (data?.error) {
      return data.error;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      signIn: async (payload: SignInPayload, remember: boolean = false): Promise<User> => {
        set({ isLoading: true, error: null });
        localStorage.setItem("remember-me", remember ? "true" : "false");
        try {
          const response = await AuthService.signIn(payload);
          
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

          if (response.refreshToken) {
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem(
              REFRESH_TOKEN_STORAGE_KEY,
              response.refreshToken,
            );
          }
          set({
            accessToken: response.accessToken,
            user: response.user,
            isLoading: false,
          });
          return response.user;
        } catch (error) {
          const message = getErrorMessage(error, "Sign in failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      googleSignIn: async (credential: string): Promise<User> => {
        set({ isLoading: true, error: null });
        localStorage.setItem("remember-me", "true");
        try {
          const response = await AuthService.googleSignIn(credential);
          
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

          if (response.refreshToken) {
            localStorage.setItem(
              REFRESH_TOKEN_STORAGE_KEY,
              response.refreshToken,
            );
          }
          set({
            accessToken: response.accessToken,
            user: response.user,
            isLoading: false,
          });
          return response.user;
        } catch (error) {
          const message = getErrorMessage(error, "Google sign in failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signUp: async (payload: SignUpPayload): Promise<User> => {
        set({ isLoading: true, error: null });
        localStorage.setItem("remember-me", "true");
        try {
          const response = await AuthService.signUp(payload);
          
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

          if (response.refreshToken) {
            localStorage.setItem(
              REFRESH_TOKEN_STORAGE_KEY,
              response.refreshToken,
            );
          }
          set({
            accessToken: response.accessToken,
            user: response.user,
            isLoading: false,
          });
          return response.user;
        } catch (error) {
          const message = getErrorMessage(error, "Sign up failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signOut: async () => {
        // 1. Instantly clear all storages and reset global store state
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem("auth-storage");
        sessionStorage.removeItem("auth-storage");
        localStorage.removeItem("remember-me");

        set({
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        });

        // 2. Trigger backend sign-out in the background asynchronously
        AuthService.logout().catch((error) => {
          console.error("Background logout error:", error);
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      isTokenExpired: (token: string) => {
        if (!token) return true;
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          return (decoded.exp ?? 0) < currentTime;
        } catch {
          return true;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => dynamicStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
