/**
 * Intercepteur pour gérer automatiquement les tokens expirés
 * Redirige vers la page de connexion si le token est expiré
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Import du contexte d'authentification pour forcer la mise à jour de l'état
// Note: On ne peut pas importer directement useAuth ici car c'est un hook
// On va plutôt utiliser un callback ou un événement personnalisé

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

/**
 * Vérifie si une erreur indique que le token est expiré
 */
export function isTokenExpiredError(error: any): boolean {
  if (!error) return false;
  
  // Vérifier le status HTTP
  if (error.response?.status === 401) {
    const message = error.response?.data?.message || '';
    if (message.includes('expired') || message.includes('expiré') || message.includes('invalid JWT')) {
      return true;
    }
  }
  
  // Vérifier le message d'erreur
  const errorMessage = error.message || '';
  if (errorMessage.includes('TOKEN_EXPIRED') || errorMessage.includes('expired') || errorMessage.includes('expiré')) {
    return true;
  }
  
  return false;
}

/**
 * Callback pour forcer la mise à jour de l'état d'authentification
 * Sera défini par AuthContext lors de l'initialisation
 */
let forceLogoutCallback: (() => Promise<void>) | null = null;

/**
 * Définit le callback pour forcer la déconnexion
 * Appelé par AuthContext lors de l'initialisation
 */
export function setForceLogoutCallback(callback: () => Promise<void>) {
  forceLogoutCallback = callback;
}

/**
 * Déconnecte l'utilisateur et redirige vers la page de connexion
 */
export async function handleTokenExpiration(): Promise<void> {
  try {
    console.log('🔒 Token expiré - Suppression du token et des données utilisateur...');
    
    // Supprimer le token et les données utilisateur
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    
    // Appeler le callback pour forcer la mise à jour de l'état d'authentification
    if (forceLogoutCallback) {
      try {
        await forceLogoutCallback();
        console.log('✅ État d\'authentification mis à jour via callback');
      } catch (callbackError) {
        console.error('Erreur lors de l\'appel du callback forceLogout:', callbackError);
      }
    }
    
    // Attendre un peu pour que AsyncStorage et l'état se synchronisent
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Rediriger explicitement vers la page de connexion
    // Utiliser replace pour éviter de pouvoir revenir en arrière
    try {
      router.replace('/login');
      console.log('✅ Redirection vers /login effectuée');
    } catch (navError) {
      console.error('Erreur lors de la redirection:', navError);
      // Fallback: essayer avec push
      try {
        router.push('/login');
      } catch (pushError) {
        console.error('Erreur avec router.push aussi:', pushError);
      }
    }
    
    console.log('🔒 Token expiré - Déconnexion et redirection vers login terminées');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
  }
}

