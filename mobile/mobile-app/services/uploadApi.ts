/**
 * Service API pour l'upload audio
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreatePatientData } from './patientsApi';

export interface UploadAudioResponse {
  ok: boolean;
  transcription: string;
  structured_json: any;
  pdf_url: string;
  note: {
    id: string;
    patient_id: string;
    created_by: string;
    transcription_text: string;
    structured_json: any;
    pdf_url: string;
    audio_url: string;
    created_at: string;
  };
  patient_created: boolean;
  patient: {
    id: string;
    full_name: string;
    [key: string]: any;
  } | null;
}

class UploadApiService {
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
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Upload un fichier audio
   */
  async uploadAudio(
    audioUri: string,
    options: {
      patientId?: string | null;
      patientData?: CreatePatientData | null;
    } = {}
  ): Promise<UploadAudioResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      // Créer FormData
      const formData = new FormData();

      // Détecter le format du fichier depuis l'URI
      // Les formats supportés sont: .wav, .mp3, .flac, .m4a
      const uriLower = audioUri.toLowerCase();
      let fileExtension = '.wav'; // Format par défaut (privilégié)
      let mimeType = 'audio/wav'; // MIME type par défaut
      
      if (uriLower.endsWith('.wav')) {
        fileExtension = '.wav';
        mimeType = 'audio/wav';
      } else if (uriLower.endsWith('.mp3')) {
        fileExtension = '.mp3';
        mimeType = 'audio/mpeg';
      } else if (uriLower.endsWith('.flac')) {
        fileExtension = '.flac';
        mimeType = 'audio/flac';
      } else if (uriLower.endsWith('.m4a')) {
        fileExtension = '.m4a';
        mimeType = 'audio/m4a';
      } else {
        // Si le format n'est pas détecté, utiliser WAV par défaut
        console.log('⚠️ Format audio non détecté, utilisation de WAV par défaut');
        fileExtension = '.wav';
        mimeType = 'audio/wav';
      }

      // Ajouter le fichier audio avec le format détecté
      const audioFile = {
        uri: audioUri,
        type: mimeType,
        name: `recording-${Date.now()}${fileExtension}`,
      } as any;
      formData.append('audio', audioFile);
      
      console.log(`📤 Upload audio en format: ${fileExtension} (${mimeType})`);

      // Ajouter patient_id si fourni
      if (options.patientId) {
        formData.append('patient_id', options.patientId);
      }

      // Ajouter les données patient si fournies (mais pas de patient_id)
      if (options.patientData && !options.patientId) {
        if (options.patientData.full_name) {
          formData.append('patient[full_name]', options.patientData.full_name);
        }
        if (options.patientData.age) {
          formData.append('patient[age]', options.patientData.age);
        }
        if (options.patientData.gender) {
          formData.append('patient[gender]', options.patientData.gender);
        }
        if (options.patientData.room_number) {
          formData.append('patient[room_number]', options.patientData.room_number);
        }
        if (options.patientData.unit) {
          formData.append('patient[unit]', options.patientData.unit);
        }
      }

      const response = await axios.post<UploadAudioResponse>(
        `${this.baseURL}/api/upload/audio`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes pour l'upload et le traitement
        }
      );

      if (response.data.ok) {
        return response.data;
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 401) {
          throw new Error('Non authentifié');
        }
        
        if (axiosError.response?.status === 400) {
          throw new Error(axiosError.response.data?.message || 'Données invalides');
        }
        
        if (axiosError.code === 'ERR_NETWORK' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          console.error('❌ Erreur réseau:', axiosError.code);
          console.error('📡 URL:', `${this.baseURL}/api/upload/audio`);
          console.error('📡 Message:', axiosError.message);
          console.error('📡 Base URL configurée:', this.baseURL);
          console.error('📡 Détails complets:', {
            code: axiosError.code,
            message: axiosError.message,
            response: axiosError.response?.data,
            request: axiosError.request ? 'Request object exists' : 'No request object',
          });
          throw new Error('Erreur de connexion. Vérifiez que le serveur backend est démarré et accessible.');
        }
        
        if (axiosError.code === 'ETIMEDOUT') {
          console.error('❌ Timeout lors de l\'upload');
          throw new Error('Le traitement de l\'audio prend trop de temps. Veuillez réessayer.');
        }
      }
      
      throw error instanceof Error ? error : new Error('Erreur lors de l\'upload');
    }
  }
}

export const uploadApiService = new UploadApiService();

