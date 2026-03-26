// Auth Types
export interface User {
  id: string;
  username: string;
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
  username: string;
  password: string;
}

export interface SignUpPayload {
  username: string;
  password: string;
  email: string;
  fullName: string;
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
