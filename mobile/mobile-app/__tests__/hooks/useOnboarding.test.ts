/**
 * Tests pour le hook useOnboarding
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '@/hooks/useOnboarding';

const ONBOARDING_KEY = '@has_seen_onboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('devrait initialiser avec hasSeenOnboarding = null et isLoading = true', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.hasSeenOnboarding).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('devrait détecter que l\'onboarding n\'a pas été vu', async () => {
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSeenOnboarding).toBe(false);
  });

  it('devrait détecter que l\'onboarding a été vu', async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSeenOnboarding).toBe(true);
  });

  it('devrait marquer l\'onboarding comme vu', async () => {
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasSeenOnboarding).toBe(false);

    await act(async () => {
      await result.current.markOnboardingAsSeen();
    });

    expect(result.current.hasSeenOnboarding).toBe(true);

    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    expect(stored).toBe('true');
  });

  it('devrait gérer les erreurs lors de la vérification', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage error'));

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // En cas d'erreur, devrait retourner false par défaut
    expect(result.current.hasSeenOnboarding).toBe(false);
  });

  it('devrait gérer les erreurs lors de la sauvegarde', async () => {
    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

    await act(async () => {
      await result.current.markOnboardingAsSeen();
    });

    // Même en cas d'erreur, l'état devrait être mis à jour localement
    expect(result.current.hasSeenOnboarding).toBe(true);
  });
});

