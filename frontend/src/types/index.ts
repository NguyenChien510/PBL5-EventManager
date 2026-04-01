// Auth Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: {
    name: string;
  };
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  password: string;
  email: string;
  fullName: string;
  role: "USER" | "ORGANIZER";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  statusCode: number;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errorCode?: string;
  details?: Record<string, string>;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Province {
  id: number;
  name: string;
}

export interface Ward {
  id: number;
  name: string;
}
