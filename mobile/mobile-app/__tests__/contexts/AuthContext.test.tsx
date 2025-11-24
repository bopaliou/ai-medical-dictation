/**
 * Tests pour le contexte d'authentification
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

describe('AuthContext', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('devrait initialiser avec isAuthenticated = null et isLoading = true', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isAuthenticated).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('devrait détecter un utilisateur non authentifié au démarrage', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('devrait détecter un utilisateur authentifié si un token existe', async () => {
    const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
    const mockToken = 'mock-token';

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('devrait permettre la connexion', async () => {
    const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
    const mockToken = 'mock-token';

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login(mockToken, mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);

    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

    expect(storedToken).toBe(mockToken);
    expect(JSON.parse(storedUser!)).toEqual(mockUser);
  });

  it('devrait permettre la déconnexion', async () => {
    const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test User' };
    const mockToken = 'mock-token';

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

    expect(storedToken).toBeNull();
    expect(storedUser).toBeNull();
  });

  it('devrait gérer les erreurs lors de la connexion', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simuler une erreur AsyncStorage
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage error'));

    await act(async () => {
      await expect(
        result.current.login('token', { id: '1' })
      ).rejects.toThrow();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('devrait gérer les erreurs lors de la déconnexion', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'mock-token';

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockToken);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simuler une erreur AsyncStorage
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

    await act(async () => {
      await result.current.logout();
    });

    // Même en cas d'erreur, l'état devrait être mis à jour
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('devrait lancer une erreur si useAuth est utilisé en dehors du provider', () => {
    // Supprimer console.error pour éviter le warning dans les tests
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = consoleError;
  });
});

