/**
 * Helper pour vérifier et valider les tokens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Vérifie si le token est valide (non vide et format correct)
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || token.trim().length === 0) {
      return false;
    }
    
    // Un token JWT Supabase commence généralement par "eyJ" (base64)
    // et contient 3 parties séparées par des points
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('⚠️ Format de token invalide (devrait avoir 3 parties)');
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
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null && token.trim().length > 0;
}

