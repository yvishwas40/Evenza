import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
}

interface AuthContextType {
  admin: Admin | null;
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isUser: boolean;
  login: (email: string, password: string, userType: 'admin' | 'user') => Promise<void>;
  register: (userData: any, userType: 'admin' | 'user') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAdmin = !!admin;
  const isUser = !!user;

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Try to get admin first
          try {
            const response = await api.get('/auth/me');
            setAdmin(response.data);
          } catch (adminError) {
            // If admin fails, try user
            try {
              const response = await api.get('/auth/user/me');
              setUser(response.data);
            } catch (userError) {
              console.error('Auth init error:', userError);
              localStorage.removeItem('token');
              setToken(null);
            }
          }
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string, userType: 'admin' | 'user' = 'user') => {
    try {
      const endpoint = userType === 'admin' ? '/auth/login' : '/auth/user/login';
      const response = await api.post(endpoint, { email, password });
      
      const { token: authToken } = response.data;
      
      if (userType === 'admin') {
        const { admin: adminData } = response.data;
        setAdmin(adminData);
        setUser(null);
      } else {
        const { user: userData } = response.data;
        setUser(userData);
        setAdmin(null);
      }
      
      setToken(authToken);
      localStorage.setItem('token', authToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: any, userType: 'admin' | 'user' = 'user') => {
    try {
      const endpoint = userType === 'admin' ? '/auth/register' : '/auth/user/register';
      const response = await api.post(endpoint, userData);
      
      const { token: authToken } = response.data;
      
      if (userType === 'admin') {
        const { admin: adminData } = response.data;
        setAdmin(adminData);
        setUser(null);
      } else {
        const { user: userResponseData } = response.data;
        setUser(userResponseData);
        setAdmin(null);
      }
      
      setToken(authToken);
      localStorage.setItem('token', authToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    setAdmin(null);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ admin, user, token, isAdmin, isUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
