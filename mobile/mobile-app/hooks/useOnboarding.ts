/**
 * Hook pour gérer l'affichage de l'onboarding
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@has_seen_onboarding';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'onboarding:', error);
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const markOnboardingAsSeen = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      // Mettre à jour l'état immédiatement
      setHasSeenOnboarding(true);
      // Forcer une re-vérification pour s'assurer que la valeur est bien sauvegardée
      await checkOnboardingStatus();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'onboarding:', error);
    }
  };

  return {
    hasSeenOnboarding,
    isLoading,
    markOnboardingAsSeen,
  };
}

