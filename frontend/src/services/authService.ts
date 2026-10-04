import { apiClient } from './apiClient';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginPayload): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async registerRequest(data: RegisterPayload): Promise<any> {
    return await apiClient.post('/auth/register', data);
  },

  async verifyOtpAndRegister(data: { mssv: string; otp: string }): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>('/auth/verify-registration-otp', data);
  },

  async forgotPassword(mssv: string): Promise<any> {
    return await apiClient.post('/auth/forgot-password', { mssv });
  },

  async resetPassword(payload: { mssv: string; otp: string; newPassword: string }): Promise<any> {
    return await apiClient.post('/auth/reset-password', payload);
  }
};
