export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'dentist' | 'assistant' | 'receptionist' | 'admin';
  licenseNumber?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'dentist' | 'assistant' | 'receptionist' | 'admin';
  licenseNumber?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}