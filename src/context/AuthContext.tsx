import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoginRequest, User } from '../types/auth.types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser({
        username: currentUser.username,
        role: currentUser.role,
        fullName: currentUser.fullName,
        fillerId: currentUser.fillerId,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);

    // Store token and user info
    localStorage.setItem('jwt_token', response.token);
    localStorage.setItem('user_info', JSON.stringify(response));

    setUser({
      username: response.username,
      role: response.role,
      fullName: response.fullName,
      fillerId: response.fillerId,
    });
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
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
