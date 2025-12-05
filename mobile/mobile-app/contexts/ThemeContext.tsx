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
  background: '#F8FAFC', // Slate-50 - Ultra light for antigravity feel
  backgroundSecondary: '#FFFFFF',
  backgroundCard: '#FFFFFF', // Clean white for cards
  backgroundElevated: '#FFFFFF',

  text: '#0F172A', // Slate-900
  textSecondary: '#475569', // Slate-600
  textMuted: '#94A3B8', // Slate-400
  textLight: '#CBD5E1', // Slate-300

  primary: '#258bef', // Royal Blue
  primaryLight: '#EFF6FF', // Blue-50
  primaryDark: '#1d4ed8', // Blue-700

  success: '#22c55e', // Vitality Green
  successLight: '#F0FDF4', // Green-50
  error: '#EF4444', // Red-500
  errorLight: '#FEF2F2', // Red-50
  warning: '#F59E0B', // Amber-500
  warningLight: '#FFFBEB', // Amber-50

  border: '#E2E8F0', // Slate-200
  borderLight: '#F1F5F9', // Slate-100
  borderCard: '#F1F5F9', // Subtle border

  overlay: 'rgba(15, 23, 42, 0.4)', // Slate-900 with opacity

  status: {
    draft: '#94A3B8', // Slate-400
    final: '#22c55e', // Vitality Green
    trash: '#EF4444', // Red-500
  },

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#258bef',

  fabBackground: '#22c55e', // Vitality Green for the main action
  fabIcon: '#FFFFFF',
};

// Palette Dark (Mode Sombre) - Inspiré iOS 17
const darkColors: ThemeColors = {
  background: '#0F172A', // Slate-900
  backgroundSecondary: '#1E293B', // Slate-800
  backgroundCard: '#1E293B', // Slate-800
  backgroundElevated: '#334155', // Slate-700

  text: '#F8FAFC', // Slate-50
  textSecondary: '#CBD5E1', // Slate-300
  textMuted: '#64748B', // Slate-500
  textLight: '#475569', // Slate-600

  primary: '#3b82f6', // Blue-500 (Brighter for dark mode)
  primaryLight: '#1e3a8a', // Blue-900
  primaryDark: '#60a5fa', // Blue-400

  success: '#22c55e', // Vitality Green
  successLight: '#14532d', // Green-900
  error: '#ef4444', // Red-500
  errorLight: '#7f1d1d', // Red-900
  warning: '#f59e0b', // Amber-500
  warningLight: '#78350f', // Amber-900

  border: '#334155', // Slate-700
  borderLight: '#1e293b', // Slate-800
  borderCard: '#334155',

  overlay: 'rgba(0, 0, 0, 0.7)',

  status: {
    draft: '#64748B',
    final: '#22c55e',
    trash: '#ef4444',
  },

  tabBarBackground: '#0F172A',
  tabBarBorder: '#334155',
  tabIconDefault: '#64748B',
  tabIconSelected: '#3b82f6',

  fabBackground: '#22c55e',
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

