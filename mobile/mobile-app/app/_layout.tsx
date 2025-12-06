import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import * as SplashScreenNative from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import SplashScreen from '@/components/SplashScreen';

// Empêcher le splash screen natif de se masquer automatiquement
SplashScreenNative.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { theme } = useTheme();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFinished, setSplashFinished] = useState(false);

  // Masquer le splash screen natif IMMÉDIATEMENT au montage
  useEffect(() => {
    // Masquer le splash natif le plus rapidement possible
    // Ne pas attendre, masquer immédiatement pour afficher notre splash React
    SplashScreenNative.hideAsync().catch(() => {
      // Ignorer les erreurs silencieusement
    });
  }, []);

  // Gérer l'affichage du splash screen React uniquement au démarrage
  useEffect(() => {
    if (splashFinished) return;

    // Le splash React s'affiche pendant 2.5 secondes puis disparaît
    const timer = setTimeout(() => {
      setShowSplash(false);
      setSplashFinished(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [splashFinished]);

  useEffect(() => {
    if (onboardingLoading || authLoading || isAuthenticated === null || !splashFinished) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';
    const inTabs = segments[0] === '(tabs)';
    const currentRoute = segments[0];
    const secondSegment = segments[1];

    // Routes qui sont autorisées même si on n'est pas dans les tabs
    const allowedRoutes = ['record', 'settings', 'modal', 'report', 'pdf-viewer', 'patient'];
    // Vérifier si on est sur une route report (report/details, report/edit, etc.)
    const isReportRoute = (currentRoute as string) === 'report' || ((currentRoute as string) === 'report' && secondSegment);
    const isAllowedRoute = allowedRoutes.includes(currentRoute) || isReportRoute;

    // PRIORITÉ 1: Si l'utilisateur est authentifié, il ne doit pas voir l'onboarding
    // et doit être redirigé vers l'application
    if (isAuthenticated === true) {
      // Si on est sur l'onboarding alors qu'on est authentifié, rediriger vers l'app
      if (inOnboarding) {
        router.replace('/(tabs)');
        return;
      }

      // Si on est sur le login alors qu'on est authentifié, rediriger vers l'app
      if (inLogin) {
        const timeoutId = setTimeout(() => {
          if (segments[0] === 'login') {
            router.replace('/(tabs)');
          }
        }, 1000);
        return () => clearTimeout(timeoutId);
      }

      // Ne pas rediriger si on est sur une route autorisée (record, settings, etc.)
      if (!inTabs && !isAllowedRoute) {
        router.replace('/(tabs)');
      }
      return;
    }

    // PRIORITÉ 2: Si l'utilisateur n'est pas authentifié, vérifier l'onboarding
    if (isAuthenticated === false) {
      // Si l'utilisateur a vu l'onboarding mais n'est pas authentifié
      if (hasSeenOnboarding === true) {
        // Si on est sur l'onboarding alors qu'on l'a déjà vu, rediriger vers login
        if (inOnboarding) {
          router.replace('/login');
          return;
        }

        // Si on est dans les tabs sans être authentifié, rediriger vers login
        if (inTabs) {
          router.replace('/login');
          return;
        }

        // Si on est déjà sur login, ne rien faire
        if (inLogin) return;

        // Sinon, rediriger vers login
        router.replace('/login');
        return;
      }

      // Si l'utilisateur n'a pas vu l'onboarding, l'afficher
      if (hasSeenOnboarding === false) {
        if (!inOnboarding) {
          router.replace('/onboarding');
        }
        return;
      }
    }
  }, [hasSeenOnboarding, isAuthenticated, onboardingLoading, authLoading, segments, router, splashFinished]);

  return (
    <NavigationThemeProvider value={theme.resolved === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Afficher le splash React immédiatement pour couvrir le splash natif */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          duration={2500}
        />
      )}
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="pdf-viewer" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="patient/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
            title: 'Patient'
          }}
        />
        <Stack.Screen
          name="report/details"
          options={{
            headerShown: false,
            presentation: 'card',
            title: 'Rapport'
          }}
        />
        <Stack.Screen
          name="report/edit"
          options={{
            headerShown: false,
            presentation: 'card',
            title: 'Édition Rapport'
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OnboardingProvider>
          <RootLayoutNav />
        </OnboardingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
