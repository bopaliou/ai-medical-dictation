/**
 * Contexte d'authentification partagé pour éviter les problèmes de synchronisation
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: any;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let isLoggingInGlobal = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(AUTH_USER_KEY);
      
      if (token && userStr) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userStr));
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggingInGlobal) {
      checkAuthStatus();
    } else {
      setTimeout(() => {
        if (!isLoggingInGlobal) {
          checkAuthStatus();
        }
      }, 200);
    }
  }, []);

  const login = async (token: string, userData: any) => {
    isLoggingInGlobal = true;
    try {
      setIsAuthenticated(true);
      setUser(userData);
      
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      console.error('Erreur lors de la connexion:', error);
      throw error;
    } finally {
      isLoggingInGlobal = false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

