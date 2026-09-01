import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string, remember?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('css_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default authenticated for seamless experience or initialized operator
    return {
      id: 'usr-operator-01',
      email: 'operator@company.com',
      name: 'Lead Site Reliability Engineer',
      role: 'Infrastructure Operator',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTpa3xPisbqwGHS40w1sQmcd-RWe_ytKQmEE5jiNLXgUpUpNxZNL772bj6if-h8FSsO8lkVbCE2u5xJJd1DQYovMD6z5oD-_7LrYJFjS3EU6ZnHfRVm6jB5rOPBKSgDHo1eWNlwyTp3OFJcO_Rli0JMZguxHbIMNUSlb7kny-_LOqJ1a4Al77m1WeVoWA1qstOrvHPDA6z0jelCmXELupZzD3EelxQHyiStjL7uowAdK3r0AgN9eBa'
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email?: string, password?: string, remember = true) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      if (remember) {
        localStorage.setItem('css_user_session', JSON.stringify(res.user));
      }
    } catch (err) {
      // Fallback
      const defaultUser: User = {
        id: 'usr-operator-01',
        email: email || 'operator@company.com',
        name: 'Lead Site Reliability Engineer',
        role: 'Infrastructure Operator',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTpa3xPisbqwGHS40w1sQmcd-RWe_ytKQmEE5jiNLXgUpUpNxZNL772bj6if-h8FSsO8lkVbCE2u5xJJd1DQYovMD6z5oD-_7LrYJFjS3EU6ZnHfRVm6jB5rOPBKSgDHo1eWNlwyTp3OFJcO_Rli0JMZguxHbIMNUSlb7kny-_LOqJ1a4Al77m1WeVoWA1qstOrvHPDA6z0jelCmXELupZzD3EelxQHyiStjL7uowAdK3r0AgN9eBa'
      };
      setUser(defaultUser);
      if (remember) {
        localStorage.setItem('css_user_session', JSON.stringify(defaultUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('css_user_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
