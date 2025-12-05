/**
 * Tests d'intégration pour le flux d'authentification complet
 */

import React from 'react';
import { render, fireEvent, waitFor, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authApiService } from '@/services/authApi';

// Mock authApiService
jest.mock('@/services/authApi', () => ({
  authApiService: {
    login: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

// Mock expo-router
const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
  getSegments: jest.fn(() => []),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => [],
}));

describe('Flux d\'authentification complet', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    jest.clearAllMocks();
    (authApiService.healthCheck as jest.Mock).mockResolvedValue(true);
  });

  it('devrait permettre un flux de connexion complet', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'nurse',
    };

    const mockToken = 'mock-jwt-token';

    const mockLoginResponse = {
      ok: true,
      token: mockToken,
      user: mockUser,
    };

    (authApiService.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

    // Test du contexte d'authentification
    const { result: authResult } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(authResult.current.isLoading).toBe(false);
    });

    // Vérifier l'état initial
    expect(authResult.current.isAuthenticated).toBe(false);
    expect(authResult.current.user).toBeNull();

    // Simuler la connexion
    await waitFor(async () => {
      await authResult.current.login(mockToken, mockUser);
    });

    // Vérifier l'état après connexion
    expect(authResult.current.isAuthenticated).toBe(true);
    expect(authResult.current.user).toEqual(mockUser);

    // Vérifier que les données sont stockées dans AsyncStorage
    const storedToken = await AsyncStorage.getItem('@auth_token');
    const storedUser = await AsyncStorage.getItem('@auth_user');

    expect(storedToken).toBe(mockToken);
    expect(JSON.parse(storedUser!)).toEqual(mockUser);

    // Simuler la déconnexion
    await waitFor(async () => {
      await authResult.current.logout();
    });

    // Vérifier l'état après déconnexion
    expect(authResult.current.isAuthenticated).toBe(false);
    expect(authResult.current.user).toBeNull();

    // Vérifier que les données sont supprimées d'AsyncStorage
    const tokenAfterLogout = await AsyncStorage.getItem('@auth_token');
    const userAfterLogout = await AsyncStorage.getItem('@auth_user');

    expect(tokenAfterLogout).toBeNull();
    expect(userAfterLogout).toBeNull();
  });

  it('devrait restaurer la session au redémarrage de l\'app', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
    };

    const mockToken = 'mock-jwt-token';

    // Simuler une session existante
    await AsyncStorage.setItem('@auth_token', mockToken);
    await AsyncStorage.setItem('@auth_user', JSON.stringify(mockUser));

    // Créer un nouveau contexte (simule un redémarrage)
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Vérifier que la session est restaurée
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('devrait gérer les erreurs de connexion de manière gracieuse', async () => {
    const errorMessage = 'Email ou mot de passe incorrect';
    (authApiService.login as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Tenter de se connecter avec des identifiants invalides
    await expect(
      result.current.login('invalid-token', { id: '1' })
    ).rejects.toThrow();

    // L'état devrait rester non authentifié
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

