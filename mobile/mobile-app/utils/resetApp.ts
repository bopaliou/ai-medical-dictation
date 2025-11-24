/**
 * Utilitaire pour réinitialiser l'application
 * Supprime toutes les données stockées (onboarding, auth, etc.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = [
  '@has_seen_onboarding',
  '@auth_token',
  '@auth_user',
];

export async function resetApp(): Promise<void> {
  try {
    // Supprimer toutes les clés de stockage
    await Promise.all(
      STORAGE_KEYS.map(key => AsyncStorage.removeItem(key))
    );
    console.log('✅ Application réinitialisée');
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    throw error;
  }
}

