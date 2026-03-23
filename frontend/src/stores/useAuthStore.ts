import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type {
  AuthState,
  User,
  SignInPayload,
  SignUpPayload,
  ApiErrorResponse,
} from "@/types";
import { AuthService } from "@/services/authService";
import { REFRESH_TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/constants";

interface AuthStore extends AuthState {
  signIn: (payload: SignInPayload) => Promise<void>;
  googleSignIn: (credential: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
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
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      signIn: async (payload: SignInPayload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.signIn(payload);
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
        } catch (error) {
          const message = getErrorMessage(error, "Sign in failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      googleSignIn: async (credential: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.googleSignIn(credential);
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
        } catch (error) {
          const message = getErrorMessage(error, "Google sign in failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signUp: async (payload: SignUpPayload) => {
        set({ isLoading: true, error: null });
        try {
          const response = await AuthService.signUp(payload);
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
        } catch (error) {
          const message = getErrorMessage(error, "Sign up failed");
          set({ error: message, isLoading: false });
          throw new Error(message);
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          set({
            user: null,
            accessToken: null,
            isLoading: false,
            error: null,
          });
        }
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
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
