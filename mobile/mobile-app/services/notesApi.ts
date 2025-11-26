/**
 * Service API pour la gestion des notes
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpiredError, handleTokenExpiration } from '../utils/authInterceptor';

export interface Note {
  id: string;
  patient_id: string;
  created_by: string;
  created_at: string;
  recorded_at?: string;
  transcription_text?: string;
  structured_json?: any;
  pdf_url?: string;
  audio_url?: string;
  patients?: {
    full_name: string;
  };
}

export interface RecentNotesResponse {
  ok: boolean;
  notes: Note[];
}

class NotesApiService {
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
        console.warn('⚠️ Aucun token trouvé pour l\'API notes');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Récupère les notes récentes de l'utilisateur connecté
   */
  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log('📋 Récupération des notes récentes');
      console.log('📡 URL:', `${this.baseURL}/api/notes/recent`);

      const response = await axios.get<RecentNotesResponse>(
        `${this.baseURL}/api/notes/recent`,
        {
          params: { limit },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch(async (error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la récupération des notes récentes');
          console.error('Token utilisé (premiers 50 caractères):', token.substring(0, 50) + '...');
          console.error('URL:', `${this.baseURL}/api/notes/recent`);
          console.error('Réponse backend:', error.response?.data);
          
          if (isTokenExpiredError(error)) {
            console.error('💡 Token expiré - Déconnexion automatique...');
            await handleTokenExpiration();
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw error;
      });

      if (response.data.ok && response.data.notes) {
        return response.data.notes;
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des notes récentes:', error);
      
      if (error.message === 'TOKEN_EXPIRED') {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 401) {
          throw new Error('Non authentifié. Veuillez vous reconnecter.');
        }
        
        // Gérer les erreurs réseau
        if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          console.error('❌ Erreur réseau lors de la récupération des notes:', axiosError.code);
          console.error('📡 URL:', `${this.baseURL}/api/notes/recent`);
          console.error('📡 Message:', axiosError.message);
          console.error('📡 Base URL configurée:', this.baseURL);
          // Ne pas throw, retourner un tableau vide pour ne pas bloquer l'interface
          // L'utilisateur verra simplement une liste vide
          return [];
        }
        
        if (axiosError.code === 'ETIMEDOUT') {
          console.error('❌ Timeout lors de la récupération des notes');
          // Retourner un tableau vide plutôt que de planter
          return [];
        }
      }
      
      // En cas d'erreur, retourner un tableau vide plutôt que de planter
      return [];
    }
  }
}

export const notesApiService = new NotesApiService();

