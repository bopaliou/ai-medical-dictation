/**
 * Utilitaires pour la gestion de l'authentification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Vérifie si un token est présent et valide
 */
export async function hasValidToken(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || token.trim().length === 0) {
      return false;
    }
    // Vérifier que le token a au moins une longueur minimale (JWT typiquement > 100 caractères)
    if (token.length < 50) {
      console.warn('⚠️ Token semble invalide (trop court)');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
}

/**
 * Récupère le token depuis AsyncStorage
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
}

/**
 * Supprime le token (pour déconnexion)
 */
export async function clearToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Erreur lors de la suppression du token:', error);
  }
}

