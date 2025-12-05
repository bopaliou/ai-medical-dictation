/**
 * Service API pour la gestion des patients
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpiredError, handleTokenExpiration } from '../utils/authInterceptor';
import { rateLimiter } from '../utils/rateLimiter';

export interface Patient {
  id: string;
  full_name: string;
  age?: string;
  gender?: string;
  room_number?: string;
  unit?: string;
  dob?: string;
  created_at?: string;
}

export interface CreatePatientData {
  full_name: string;
  age?: string;
  gender?: 'M' | 'F' | 'Autre' | 'Non précisé' | string;
  room_number?: string;
  unit?: string;
  dob?: string;
}

export interface SearchPatientsResponse {
  ok: boolean;
  patients: Patient[];
}

export interface CreatePatientResponse {
  ok: boolean;
  patient: Patient;
}

export interface UpdatePatientData {
  full_name?: string;
  age?: string;
  gender?: 'M' | 'F' | 'Autre' | 'Non précisé' | string;
  room_number?: string;
  unit?: string;
  dob?: string;
}

export interface UpdatePatientResponse {
  ok: boolean;
  patient: Patient;
}

const CACHE_KEY = 'patients_cache';
const CACHE_EXPIRY_KEY = 'patients_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class PatientsApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Récupère le token d'authentification depuis AsyncStorage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        console.warn('⚠️ Aucun token trouvé dans AsyncStorage');
        return null;
      }
      // Vérifier que le token n'est pas vide
      if (token.trim().length === 0) {
        console.warn('⚠️ Token vide dans AsyncStorage');
        return null;
      }
      console.log('✅ Token récupéré (premiers 30 caractères):', token.substring(0, 30) + '...');
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Recherche de patients avec autocomplete
   */
  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
      }

      console.log('🔍 Recherche de patients avec query:', query);
      console.log('📡 URL:', `${this.baseURL}/api/patients`);
      console.log('🔑 Token présent:', !!token);

      const response = await axios.get<SearchPatientsResponse>(
        `${this.baseURL}/api/patients`,
        {
          params: { query },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        // Log détaillé en cas d'erreur 401
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 - Token invalide ou expiré');
          console.error('Token utilisé (premiers 50 caractères):', token.substring(0, 50) + '...');
          console.error('URL:', `${this.baseURL}/api/patients`);
          console.error('Réponse backend:', error.response?.data);
        }
        throw error;
      });

      if (response.data.ok && response.data.patients) {
        // Mettre à jour le cache
        await this.updateCache(response.data.patients);
        return response.data.patients;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche de patients:', error);
      
          // Gestion spécifique des erreurs réseau
          if (axios.isAxiosError(error)) {
            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
              const errorMessage = `Oups ! Nous n'arrivons pas à nous connecter au serveur.\n\n` +
                `Voici quelques vérifications à faire :\n` +
                `• Assurez-vous que le serveur est bien démarré sur votre ordinateur\n` +
                `• Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau WiFi\n` +
                `• L'adresse IP configurée doit correspondre à celle de votre ordinateur\n\n` +
                `Adresse configurée : ${this.baseURL}\n\n` +
                `💡 Astuce : Vérifiez votre connexion WiFi et réessayez dans quelques instants.`;
              throw new Error(errorMessage);
            }
          }
      
      // Gestion spécifique des erreurs 401
      if (error.response?.status === 401) {
        console.error('🔒 Erreur 401 - Token invalide ou expiré');
        console.error('💡 Solution: Reconnectez-vous pour obtenir un nouveau token');
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      // En cas d'erreur, essayer de retourner le cache
      const cachedPatients = await this.getCachedPatients();
      if (cachedPatients.length > 0 && query) {
        // Filtrer le cache local
        const searchTerm = query.toLowerCase();
        return cachedPatients.filter(p => 
          p.full_name.toLowerCase().includes(searchTerm)
        );
      }
      
      throw error;
    }
  }

  /**
   * Récupère tous les patients
   */
  async getAllPatients(): Promise<Patient[]> {
    const requestKey = 'getAllPatients';
    
    // Utiliser debounce pour éviter les requêtes multiples
    return rateLimiter.debounce(requestKey, async () => {
      // Retry avec backoff pour les erreurs 429
      return rateLimiter.retryWithBackoff(async () => {
        try {
          const token = await this.getAuthToken();
          if (!token) {
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          }

          console.log('📋 Récupération de tous les patients');
          console.log('📡 URL:', `${this.baseURL}/api/patients`);

          const response = await axios.get<SearchPatientsResponse>(
            `${this.baseURL}/api/patients`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          ).catch(async (error) => {
            // Log détaillé en cas d'erreur 401
            if (error.response?.status === 401) {
              console.error('❌ Erreur 401 lors de getAllPatients');
              console.error('Token utilisé (premiers 50 caractères):', token.substring(0, 50) + '...');
              console.error('URL:', `${this.baseURL}/api/patients`);
              console.error('Réponse backend:', error.response?.data);
              
              // Si le token est expiré, déconnecter automatiquement
              if (isTokenExpiredError(error)) {
                console.error('💡 Token expiré - Déconnexion automatique...');
                await handleTokenExpiration();
                throw new Error('TOKEN_EXPIRED');
              }
              
              console.error('💡 Le token peut être expiré. Essayez de vous reconnecter.');
            }
            throw error;
          });

          if (response.data.ok && response.data.patients) {
            // Mettre à jour le cache
            await this.updateCache(response.data.patients);
            return response.data.patients;
          }

          return [];
        } catch (error: any) {
          // Gestion spécifique des erreurs réseau
          if (axios.isAxiosError(error)) {
            // Erreur 429 - Trop de requêtes (traitée comme un warning, pas une erreur critique)
            if (error.response?.status === 429) {
              const retryAfter = error.response.headers['retry-after'];
              const waitTime = retryAfter ? parseInt(retryAfter, 10) : 30;
              console.warn(
                `⏳ Trop de requêtes (429) lors de la récupération des patients - Attente de ${waitTime}s avant retry automatique. ` +
                `L'application va réessayer automatiquement.`
              );
              // Créer une erreur avec les propriétés préservées pour que le rateLimiter puisse la reconnaître
              const friendlyError: any = new Error(
                `Trop de requêtes ont été envoyées au serveur.\n\n` +
                `Veuillez patienter ${waitTime} secondes avant de réessayer.\n\n` +
                `💡 Astuce : L'application va automatiquement réessayer dans quelques instants.`
              );
              // Préserver les propriétés de l'erreur axios pour que le rateLimiter puisse la reconnaître
              friendlyError.response = error.response;
              friendlyError.isAxiosError = true;
              throw friendlyError;
            }
            
            // Erreur réseau (backend inaccessible)
            if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
              const errorMessage = `Oups ! Nous n'arrivons pas à nous connecter au serveur.\n\n` +
                `Voici quelques vérifications à faire :\n` +
                `• Assurez-vous que le serveur est bien démarré sur votre ordinateur\n` +
                `• Vérifiez que votre téléphone et votre ordinateur sont sur le même réseau WiFi\n` +
                `• L'adresse IP configurée doit correspondre à celle de votre ordinateur\n\n` +
                `Adresse configurée : ${this.baseURL}\n\n` +
                `💡 Astuce : Vérifiez votre connexion WiFi et réessayez dans quelques instants.`;
              throw new Error(errorMessage);
            }
          }
          
          // Si erreur 401 avec message "expired", le token est expiré
          if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.message || '';
            if (errorMessage.includes('expired') || errorMessage.includes('expiré')) {
              console.warn('⚠️ Token expiré détecté, suppression du token...');
              // Supprimer le token expiré
              await AsyncStorage.removeItem('@auth_token');
              await AsyncStorage.removeItem('@auth_user');
              
              // Lancer une erreur spéciale pour que le composant puisse réagir
              throw new Error('SESSION_EXPIRED');
            }
          }
          
          // En cas d'erreur, retourner le cache
          return await this.getCachedPatients();
        }
      }, 3, 1000); // 3 tentatives avec délai initial de 1s
    }, 500); // Debounce de 500ms
  }

  /**
   * Crée un nouveau patient
   */
  async createPatient(patientData: CreatePatientData): Promise<Patient> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const response = await axios.post<CreatePatientResponse>(
        `${this.baseURL}/api/patients`,
        patientData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.ok && response.data.patient) {
        // Ajouter au cache
        const cachedPatients = await this.getCachedPatients();
        cachedPatients.unshift(response.data.patient);
        await this.updateCache(cachedPatients);
        
        return response.data.patient;
      }

        throw new Error('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.');
    } catch (error) {
      console.error('❌ Erreur lors de la création du patient:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        console.error('📡 Statut HTTP:', axiosError.response?.status);
        console.error('📡 Données de réponse:', axiosError.response?.data);
        console.error('📡 Headers de réponse:', axiosError.response?.headers);
        
        if (axiosError.response?.status === 409) {
          // Patient déjà existant
          const message = axiosError.response.data?.message || 'Ce patient existe déjà dans le système';
          console.error('⚠️ Patient déjà existant:', message);
          throw new Error(`Il semble que ce patient soit déjà enregistré. ${message}`);
        }
        
        if (axiosError.response?.status === 400) {
          const message = axiosError.response.data?.message || axiosError.response.data?.error || 'Les informations saisies ne sont pas valides';
          console.error('⚠️ Données invalides:', message);
          throw new Error(`Veuillez vérifier les informations saisies. ${message}`);
        }
        
        if (axiosError.response?.status === 500) {
          // Erreur serveur - extraire le message d'erreur du backend
          const backendMessage = axiosError.response.data?.message || axiosError.response.data?.error;
          const errorMessage = backendMessage 
            ? `Une erreur s'est produite côté serveur : ${backendMessage}` 
            : 'Une erreur inattendue s\'est produite. Veuillez réessayer dans quelques instants.';
          console.error('❌ Erreur 500 du backend:', backendMessage);
          throw new Error(errorMessage);
        }
        
        if (axiosError.response?.status === 401) {
          console.error('❌ Erreur 401 - Token invalide ou expiré');
          if (isTokenExpiredError(error)) {
            await handleTokenExpiration();
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          }
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
        }
      }
      
      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la création du patient. Veuillez réessayer.');
    }
  }

  /**
   * Met à jour un patient existant
   */
  async updatePatient(patientId: string, patientData: UpdatePatientData): Promise<Patient> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const response = await axios.patch<UpdatePatientResponse>(
        `${this.baseURL}/api/patients/${patientId}`,
        patientData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.ok && response.data.patient) {
        // Mettre à jour le cache
        const cachedPatients = await this.getCachedPatients();
        const updatedIndex = cachedPatients.findIndex(p => p.id === patientId);
        if (updatedIndex !== -1) {
          cachedPatients[updatedIndex] = response.data.patient;
          await this.updateCache(cachedPatients);
        }
        
        return response.data.patient;
      }

        throw new Error('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du patient:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Ce patient n\'a pas été trouvé dans le système.');
        }
        
        if (axiosError.response?.status === 400) {
          const message = axiosError.response.data?.message || axiosError.response.data?.error || 'Les informations saisies ne sont pas valides';
          throw new Error(`Veuillez vérifier les informations saisies. ${message}`);
        }
        
        if (axiosError.response?.status === 401) {
          console.error('❌ Erreur 401 - Token invalide ou expiré');
          if (isTokenExpiredError(error)) {
            await handleTokenExpiration();
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          }
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
        }
        
        if (axiosError.response?.status === 500) {
          const backendMessage = axiosError.response.data?.message || axiosError.response.data?.error;
          const errorMessage = backendMessage 
            ? `Une erreur s'est produite : ${backendMessage}` 
            : 'Une erreur inattendue s\'est produite lors de la mise à jour. Veuillez réessayer.';
          throw new Error(errorMessage);
        }
      }
      
      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la mise à jour. Veuillez réessayer.');
    }
  }

  /**
   * Récupère un patient par son ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const response = await axios.get<{ ok: boolean; patient: Patient }>(
        `${this.baseURL}/api/patients/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.ok && response.data.patient) {
        return response.data.patient;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du patient:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return null;
        }
        
        if (error.response?.status === 401) {
          if (isTokenExpiredError(error)) {
            await handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          throw new Error('Non authentifié. Veuillez vous reconnecter.');
        }
      }
      
      throw error instanceof Error ? error : new Error('Impossible de charger les informations du patient. Veuillez réessayer.');
    }
  }

  /**
   * Met à jour le cache local
   */
  private async updateCache(patients: Patient[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(patients));
      await AsyncStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Erreur lors de la mise à jour du cache:', error);
    }
  }

  /**
   * Récupère les patients depuis le cache
   */
  async getCachedPatients(): Promise<Patient[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      const expiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (!cached || !expiry) {
        return [];
      }

      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();

      // Vérifier si le cache est expiré
      if (now - expiryTime > CACHE_DURATION) {
        return [];
      }

      return JSON.parse(cached) as Patient[];
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return [];
    }
  }

  /**
   * Supprime un patient
   */
  async deletePatient(patientId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      }

      const response = await axios.delete<{ ok: boolean; message?: string }>(
        `${this.baseURL}/api/patients/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.ok) {
        // Retirer le patient du cache
        const cachedPatients = await this.getCachedPatients();
        const filteredPatients = cachedPatients.filter(p => p.id !== patientId);
        await this.updateCache(filteredPatients);
        
        return;
      }

        throw new Error('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du patient:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Ce patient n\'a pas été trouvé dans le système.');
        }
        
        if (axiosError.response?.status === 401) {
          console.error('❌ Erreur 401 - Token invalide ou expiré');
          if (isTokenExpiredError(error)) {
            await handleTokenExpiration();
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          }
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
        }
        
        if (axiosError.response?.status === 500) {
          const backendMessage = axiosError.response.data?.message || axiosError.response.data?.error;
          const errorMessage = backendMessage 
            ? `Erreur serveur: ${backendMessage}` 
            : 'Erreur serveur lors de la suppression du patient.';
          throw new Error(errorMessage);
        }
      }
      
      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la suppression. Veuillez réessayer.');
    }
  }

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
    }
  }
}

export const patientsApiService = new PatientsApiService();

