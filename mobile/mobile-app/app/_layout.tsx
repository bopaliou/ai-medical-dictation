import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (onboardingLoading || authLoading || isAuthenticated === null) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';
    const inTabs = segments[0] === '(tabs)';

    if (!hasSeenOnboarding) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
      return;
    }

    if (hasSeenOnboarding) {
      if (inOnboarding) return;

      if (isAuthenticated === true) {
        if (inLogin) {
          const timeoutId = setTimeout(() => {
            if (segments[0] === 'login') {
              router.replace('/(tabs)');
            }
          }, 1000);
          return () => clearTimeout(timeoutId);
        }
        
        if (!inTabs) {
          router.replace('/(tabs)');
        }
        return;
      }

      if (isAuthenticated === false) {
        if (inTabs) {
          router.replace('/login');
          return;
        }
        
        if (inLogin) return;
        
        if (!inOnboarding) {
          router.replace('/login');
        }
        return;
      }
    }
  }, [hasSeenOnboarding, isAuthenticated, onboardingLoading, authLoading, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
