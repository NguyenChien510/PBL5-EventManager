import { apiClient } from "@/utils/axios";
import type { SignInPayload, SignUpPayload, AuthResponse, User } from "@/types";
import { API_ENDPOINTS } from "@/constants";

export class AuthService {
  static async signIn(payload: SignInPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNIN,
      payload,
    );
    return response.data;
  }

  static async googleSignIn(credential: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.GOOGLE,
      { credential }
    );
    return response.data;
  }

  static async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      payload,
    );
    return response.data;
  }

  static async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      {},
    );
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  }
}
