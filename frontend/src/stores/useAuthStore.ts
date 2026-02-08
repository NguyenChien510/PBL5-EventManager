import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, SignInPayload, SignUpPayload } from "@/types";
import { AuthService } from "@/services/authService";
import { REFRESH_TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/constants";

interface AuthStore extends AuthState {
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

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
          const message =
            error instanceof Error ? error.message : "Sign in failed";
          set({ error: message, isLoading: false });
          throw error;
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
          const message =
            error instanceof Error ? error.message : "Sign up failed";
          set({ error: message, isLoading: false });
          throw error;
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
