/**
 * Authentication Types
 */

export interface User {
  id: number;
  mssv?: string;
  full_name: string;
  email: string;
  role: 'sinh_vien' | 'admin';
  phone?: string;
  avatar?: string;
  class_name?: string;
  faculty?: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  mssv?: string;
  password?: string;
}

export interface RegisterPayload {
  mssv: string;
  password: string;
  fullName?: string;
  email?: string;
}
