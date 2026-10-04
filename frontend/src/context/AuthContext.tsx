import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginPayload } from '../types/auth.types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      const storedUser = await AsyncStorage.getItem('@auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to restore auth credentials', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginPayload) => {
    try {
      const res = await authService.login(credentials);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        await AsyncStorage.setItem('@auth_token', res.token);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(res.user));
        return { success: true, message: res.message || 'Đăng nhập thành công' };
      }
      return { success: false, message: res.message || 'Đăng nhập thất bại' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi mạng hoặc server không phản hồi' };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(['@auth_token', '@auth_user']);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedUser };
      setUser(merged);
      AsyncStorage.setItem('@auth_user', JSON.stringify(merged));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
