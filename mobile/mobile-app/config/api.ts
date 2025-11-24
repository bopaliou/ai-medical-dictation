/**
 * Configuration de l'API backend
 * 
 * L'URL du backend peut être configurée de plusieurs façons (par ordre de priorité) :
 * 1. Dans app.json > expo.extra.API_BASE_URL (recommandé)
 * 2. Variable d'environnement API_BASE_URL
 * 3. Valeur par défaut intelligente selon la plateforme
 * 
 * IMPORTANT : 
 * - Web/Émulateur : localhost fonctionne
 * - Appareil physique : il faut utiliser l'IP réseau (192.168.x.x)
 *   car localhost sur un téléphone = le téléphone lui-même, pas votre ordinateur !
 * 
 * Voir EXPLICATION_LOCALHOST.md pour plus de détails
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getEnvVar = (key: string, defaultValue?: string): string => {
  // Essayer d'abord depuis app.json extra (via Constants)
  let value = Constants.expoConfig?.extra?.[key];
  
  // Si pas trouvé, essayer depuis process.env
  if (!value) {
    value = process.env[key];
  }
  
  // Si toujours pas trouvé, utiliser la valeur par défaut
  if (!value) {
    value = defaultValue;
  }
  
  // Logs de débogage
  if (__DEV__) {
    if (Constants.expoConfig?.extra?.[key]) {
      console.log(`✅ ${key} trouvé dans app.json:`, Constants.expoConfig.extra[key]);
    } else if (process.env[key]) {
      console.log(`✅ ${key} trouvé dans process.env:`, process.env[key]);
    } else if (defaultValue) {
      console.log(`⚠️ ${key} utilise la valeur par défaut:`, defaultValue);
    } else {
      console.warn(`⚠️ Variable d'environnement ${key} non définie.`);
    }
  }
  
  return value || '';
};

// Détection de l'environnement
const isWeb = Platform.OS === 'web';

// URL par défaut intelligente selon la plateforme
const getDefaultUrl = (): string => {
  if (isWeb) {
    // Web : localhost fonctionne
    return 'http://localhost:3000';
  }
  
  // Pour mobile :
  // - Émulateur Android : 10.0.2.2 fonctionne
  // - Simulateur iOS : localhost fonctionne
  // - Appareil physique : il FAUT utiliser l'IP réseau (192.168.x.x)
  // 
  // Par défaut, on utilise localhost mais l'utilisateur DOIT configurer
  // l'IP réseau dans app.json pour un appareil physique
  return 'http://localhost:3000';
};

// URL de base de l'API backend
export const API_CONFIG = {
  BASE_URL: getEnvVar('API_BASE_URL', getDefaultUrl()),
};

// Validation et avertissements
if (__DEV__) {
  const isConfigured = !!(Constants.expoConfig?.extra?.API_BASE_URL || process.env.API_BASE_URL);
  const isLocalhost = API_CONFIG.BASE_URL.includes('localhost') || API_CONFIG.BASE_URL.includes('127.0.0.1');
  
  console.log('📡 API Configuration:');
  console.log('   BASE_URL:', API_CONFIG.BASE_URL);
  console.log('   Platform:', Platform.OS);
  console.log('   Source:', Constants.expoConfig?.extra?.API_BASE_URL ? 'app.json' : (process.env.API_BASE_URL ? 'process.env' : 'default'));
  
  // Avertir seulement si localhost est utilisé sur mobile ET que c'est la valeur par défaut
  // Si c'est configuré explicitement dans app.json, c'est probablement pour un émulateur
  if (!isWeb && isLocalhost && !isConfigured) {
    console.warn(
      '⚠️ ATTENTION: localhost ne fonctionne que sur émulateur/simulateur.\n' +
      '   Sur un appareil physique, configurez votre IP réseau dans app.json > expo.extra.API_BASE_URL\n' +
      '   Exemple: "http://192.168.1.13:3000"\n' +
      '   Voir EXPLICATION_LOCALHOST.md pour comprendre pourquoi.'
    );
  } else if (!isWeb && isLocalhost && isConfigured) {
    // Info si localhost est configuré explicitement (probablement pour émulateur)
    console.log('ℹ️  localhost configuré - OK pour émulateur/simulateur');
  }
  
  // Confirmer la configuration
  if (isConfigured) {
    console.log('✅ URL backend configurée:', API_CONFIG.BASE_URL);
  } else {
    console.warn(
      '⚠️ API_BASE_URL utilise la valeur par défaut.\n' +
      '   Pour un appareil physique, configurez votre IP réseau dans app.json > expo.extra.API_BASE_URL'
    );
  }
}

export default API_CONFIG;

