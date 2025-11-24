/**
 * Tests pour le service authApi
 */

import axios from 'axios';
import { authApiService, LoginCredentials, LoginResponse } from '@/services/authApi';
import { API_CONFIG } from '@/config/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('authApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockSuccessResponse: LoginResponse = {
      ok: true,
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'nurse',
      },
    };

    it('devrait réussir la connexion avec des identifiants valides', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: mockSuccessResponse,
        status: 200,
      });

      const result = await authApiService.login(mockCredentials);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/auth/login`,
        {
          email: mockCredentials.email,
          password: mockCredentials.password,
        },
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        })
      );
    });

    it('devrait lancer une erreur si la réponse est invalide', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { ok: false },
        status: 200,
      });

      await expect(authApiService.login(mockCredentials)).rejects.toThrow(
        'Réponse invalide du serveur'
      );
    });

    it('devrait gérer les erreurs réseau', async () => {
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ERR_NETWORK',
        response: undefined,
      });

      await expect(authApiService.login(mockCredentials)).rejects.toThrow(
        'Impossible de se connecter au serveur'
      );
    });

    it('devrait gérer les erreurs 401 (non autorisé)', async () => {
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: 'Unauthorized', message: 'Email ou mot de passe incorrect' },
        },
      });

      await expect(authApiService.login(mockCredentials)).rejects.toThrow(
        'Email ou mot de passe incorrect'
      );
    });

    it('devrait gérer les erreurs 400 (mauvaise requête)', async () => {
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Bad Request', message: 'Données invalides' },
        },
      });

      await expect(authApiService.login(mockCredentials)).rejects.toThrow(
        'Données invalides'
      );
    });

    it('devrait gérer les erreurs 500 (erreur serveur)', async () => {
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      });

      await expect(authApiService.login(mockCredentials)).rejects.toThrow(
        'Erreur serveur'
      );
    });

    it('devrait nettoyer les messages d\'erreur pour ne pas exposer les endpoints', async () => {
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: 'Unauthorized',
            message: 'Utilisez POST /api/auth/login pour vous connecter. Si vous n\'avez pas de compte, utilisez /api/auth/signup pour vous inscrire.',
          },
        },
      });

      try {
        await authApiService.login(mockCredentials);
      } catch (error: any) {
        expect(error.message).not.toContain('/api/auth/');
        expect(error.message).not.toContain('signup');
        expect(error.message).not.toContain('inscrire');
      }
    });
  });

  describe('healthCheck', () => {
    it('devrait retourner true si le serveur est accessible', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
      });

      const result = await authApiService.healthCheck();

      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/health`,
        { timeout: 5000 }
      );
    });

    it('devrait retourner false si le serveur n\'est pas accessible', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await authApiService.healthCheck();

      expect(result).toBe(false);
    });

    it('devrait retourner false si le serveur répond avec un code d\'erreur', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 500,
      });

      const result = await authApiService.healthCheck();

      expect(result).toBe(false);
    });
  });
});

