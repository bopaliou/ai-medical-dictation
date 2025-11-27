/**
 * Theme Context - Système de thèmes complet (Light/Dark)
 * Inspiré de : Apple Health, Notion, Ada Health, iOS Settings
 * Support du thème système et toggle manuel
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundCard: string;
  backgroundElevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Status colors
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  
  // Borders
  border: string;
  borderLight: string;
  borderCard: string; // Bordure spécifique pour les cartes (plus claire en dark mode)
  
  // Overlay
  overlay: string;
  
  // Status
  status: {
    draft: string;
    final: string;
    trash: string;
  };
  
  // TabBar
  tabBarBackground: string;
  tabBarBorder: string;
  tabIconDefault: string;
  tabIconSelected: string;
  
  // FAB
  fabBackground: string;
  fabIcon: string;
}

interface Theme {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Palette Light (Mode Clair)
const lightColors: ThemeColors = {
  background: '#F5F6FA',
  backgroundSecondary: '#FAFAFA',
  backgroundCard: '#FFFFFF',
  backgroundElevated: '#FFFFFF',
  
  text: '#1B1B1D',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E93',
  textLight: '#C7C7CC',
  
  primary: '#0A84FF',
  primaryLight: '#E8F1FF',
  primaryDark: '#0051D5',
  
  success: '#34C759',
  successLight: '#E8F5E9',
  error: '#FF3B30',
  errorLight: '#FFEBEE',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  
  border: '#E5E5EA',
  borderLight: '#F0F0F0',
  borderCard: '#E5E5EA', // Même que border en light mode
  
  overlay: 'rgba(0, 0, 0, 0.4)',
  
  status: {
    draft: '#8E8E93',
    final: '#34C759',
    trash: '#FF3B30',
  },
  
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  tabIconDefault: '#8E8E93',
  tabIconSelected: '#0A84FF',
  
  fabBackground: '#0A84FF',
  fabIcon: '#FFFFFF',
};

// Palette Dark (Mode Sombre) - Inspiré iOS 17
const darkColors: ThemeColors = {
  background: '#0D0D0F',
  backgroundSecondary: '#1A1A1D',
  backgroundCard: '#161618',
  backgroundElevated: '#1C1C1E',
  
  text: '#F2F2F3',
  textSecondary: '#C7C7C9',
  textMuted: '#8E8E93',
  textLight: '#6B6B6E',
  
  primary: '#0A84FF',
  primaryLight: '#1A3A5C',
  primaryDark: '#0051D5',
  
  success: '#30D158',
  successLight: '#1A3A2A',
  error: '#FF453A',
  errorLight: '#3A1F1F',
  warning: '#FF9F0A',
  warningLight: '#3A2F1A',
  
  border: '#2A2A2D',
  borderLight: '#1F1F22',
  borderCard: '#3A3A3D', // Bordure plus claire pour les cartes en dark mode
  
  overlay: 'rgba(0, 0, 0, 0.6)',
  
  status: {
    draft: '#8E8E93',
    final: '#30D158',
    trash: '#FF453A',
  },
  
  tabBarBackground: '#111114',
  tabBarBorder: '#2A2A2D',
  tabIconDefault: 'rgba(255, 255, 255, 0.7)', // Plus clair pour mieux ressortir
  tabIconSelected: '#0A84FF',
  
  fabBackground: '#0A84FF',
  fabIcon: '#FFFFFF',
};

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Charger le thème depuis le stockage
  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Résoudre le thème effectif
  const resolvedTheme: ResolvedTheme = 
    themeMode === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : themeMode;

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode: ThemeMode = resolvedTheme === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const theme: Theme = {
    mode: themeMode,
    resolved: resolvedTheme,
    colors: resolvedTheme === 'dark' ? darkColors : lightColors,
  };

  // Ne pas rendre jusqu'à ce que le thème soit chargé
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

