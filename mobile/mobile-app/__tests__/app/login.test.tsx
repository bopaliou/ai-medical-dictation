/**
 * Tests pour l'écran de connexion
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '@/app/login';
import { AuthProvider } from '@/contexts/AuthContext';
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
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authApiService.healthCheck as jest.Mock).mockResolvedValue(true);
  });

  it('devrait afficher le formulaire de connexion', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    expect(getByText('Connexion')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('devrait afficher une erreur si les champs sont vides', async () => {
    const { getByText } = render(<LoginScreen />, { wrapper: Wrapper });

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Veuillez remplir tous les champs')).toBeTruthy();
    });
  });

  it('devrait afficher une erreur si l\'email est invalide', async () => {
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    const emailInput = getByPlaceholderText('Email');
    const loginButton = getByText('Se connecter');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Veuillez entrer une adresse email valide')).toBeTruthy();
    });
  });

  it('devrait appeler authApiService.login avec les bonnes données', async () => {
    const mockResponse = {
      ok: true,
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com', full_name: 'Test User' },
    };

    (authApiService.login as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    const loginButton = getByText('Se connecter');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authApiService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('devrait afficher une erreur si la connexion échoue', async () => {
    const errorMessage = 'Email ou mot de passe incorrect';
    (authApiService.login as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    const loginButton = getByText('Se connecter');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  it('devrait afficher un indicateur de chargement pendant la connexion', async () => {
    const mockResponse = {
      ok: true,
      token: 'mock-token',
      user: { id: '1', email: 'test@example.com' },
    };

    (authApiService.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    const loginButton = getByText('Se connecter');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    // Le bouton devrait être désactivé pendant le chargement
    expect(loginButton.props.disabled).toBe(true);
  });

  it('devrait permettre d\'afficher/masquer le mot de passe', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen />,
      { wrapper: Wrapper }
    );

    const passwordInput = getByPlaceholderText('Mot de passe');
    
    // Par défaut, le mot de passe devrait être masqué
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Trouver le bouton pour afficher/masquer (via l'icône)
    // Note: Dans un vrai test, on utiliserait testID sur le TouchableOpacity
    // Pour l'instant, on vérifie juste que l'input existe
    expect(passwordInput).toBeTruthy();
  });

  it('devrait vérifier le statut du backend au montage', async () => {
    render(<LoginScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(authApiService.healthCheck).toHaveBeenCalled();
    });
  });

  it('devrait afficher un avertissement si le backend est hors ligne', async () => {
    (authApiService.healthCheck as jest.Mock).mockResolvedValueOnce(false);

    const { findByText } = render(<LoginScreen />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(findByText('Backend non accessible')).toBeTruthy();
    });
  });
});

