/**
 * Contexte d'authentification partagé pour éviter les problèmes de synchronisation
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setForceLogoutCallback } from '../utils/authInterceptor';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  user: any;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>; // Pour forcer la déconnexion (token expiré)
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
        // Note: La vérification d'expiration sera faite par le backend
        // Si le token est expiré, le backend retournera 401 et on gérera ça dans les services API
        // Les services API appelleront handleTokenExpiration() qui supprimera le token
        setIsAuthenticated(true);
        setUser(JSON.parse(userStr));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Vérifier périodiquement si le token existe encore (au cas où il serait supprimé par handleTokenExpiration)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(async () => {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        // Token supprimé (probablement par handleTokenExpiration)
        console.log('🔒 Token supprimé - Mise à jour de l\'état d\'authentification');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
      }
    }, 1000); // Vérifier toutes les 1 seconde (plus réactif)
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  // Réagir immédiatement quand isAuthenticated change à false
  useEffect(() => {
    if (isAuthenticated === false && !isLoading) {
      console.log('🔒 État d\'authentification: false - L\'utilisateur sera redirigé vers /login');
    }
  }, [isAuthenticated, isLoading]);

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
    
    // Enregistrer le callback pour que handleTokenExpiration puisse forcer la déconnexion
    setForceLogoutCallback(async () => {
      console.log('🔒 Callback forceLogout appelé depuis handleTokenExpiration');
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    });
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

  const forceLogout = async () => {
    // Force la déconnexion (utilisé quand le token est expiré)
    console.warn('⚠️ Déconnexion forcée (token expiré)');
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        forceLogout,
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

