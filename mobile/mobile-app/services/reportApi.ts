/**
 * Service API pour la gestion des rapports (édition, génération PDF)
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleTokenExpiration, isTokenExpiredError } from '../utils/authInterceptor';

export interface SOAPIEStructure {
  S?: string; // Subjective (Motif de consultation)
  O?: {
    vitals?: {
      temperature?: string;
      blood_pressure?: string;
      heart_rate?: string;
      respiratory_rate?: string;
      spo2?: string;
      glycemia?: string;
    };
    exam?: string;
    labs?: string;
    medications?: string[];
  };
  A?: string; // Assessment (Évaluation)
  I?: string[] | string; // Intervention
  E?: string; // Evaluation (Évaluation post-intervention)
  P?: string; // Plan
}

export interface StructuredJson {
  patient?: {
    full_name?: string;
    age?: string;
    gender?: string;
    room_number?: string;
    unit?: string;
  };
  soapie?: SOAPIEStructure;
}

export interface GeneratePDFRequest {
  note_id?: string;
  patient_id?: string;
  structured_json: StructuredJson;
  transcription?: string;
}

export interface GeneratePDFResponse {
  ok: boolean;
  pdf_url: string;
  note_id?: string;
  message?: string;
}

export interface Report {
  id: string;
  patient_id: string;
  pdf_url: string;
  created_at: string;
  recorded_at?: string;
  status: 'draft' | 'final' | 'trash';
  structured_json?: StructuredJson | null; // Données SOAPIE structurées
  patient: {
    id: string;
    full_name: string;
    gender?: string;
    dob?: string;
  } | null;
}

export interface GetReportsResponse {
  ok: boolean;
  reports: Report[];
  count: number;
}

export interface ReportDetails {
  id: string;
  patient_id: string | null;
  pdf_url: string;
  created_at: string;
  recorded_at?: string;
  status: 'draft' | 'final' | 'trash';
  patient: {
    id: string | null;
    full_name: string;
    age: string | null;
    gender: string | null;
    room_number: string | null;
    unit: string | null;
  };
  soapie: {
    S?: string;
    O?: {
      vitals?: {
        temperature?: string;
        blood_pressure?: string;
        heart_rate?: string;
        respiratory_rate?: string;
        spo2?: string;
        glycemia?: string;
      };
      exam?: string;
      labs?: string;
      medications?: string[];
    };
    A?: string;
    I?: string[] | string;
    E?: string;
    P?: string;
  };
  transcription?: string;
}

export interface GetReportDetailsResponse {
  ok: boolean;
  report: ReportDetails;
}

class ReportApiService {
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
        console.warn('⚠️ Aucun token trouvé pour l\'API rapport');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Récupère les détails d'un rapport spécifique
   * @param {string} reportId - ID du rapport
   * @returns {Promise<ReportDetails>} - Détails du rapport
   */
  async getReportDetails(reportId: string): Promise<ReportDetails> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log(`📋 Récupération des détails du rapport: ${reportId}`);

      const response = await axios.get<GetReportDetailsResponse>(
        `${this.baseURL}/api/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la récupération des détails');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      if (response.data.ok && response.data.report) {
        console.log('✅ Détails du rapport récupérés avec succès');
        return response.data.report;
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des détails:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Rapport non trouvé');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à consulter ce rapport');
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la récupération des détails du rapport');
    }
  }

  /**
   * Récupère la liste des rapports de l'utilisateur connecté
   * @param {Object} options - Options de filtrage
   * @param {string} options.status - Filtrer par statut (draft, final, trash)
   * @param {number} options.limit - Nombre maximum de résultats
   * @param {number} options.offset - Offset pour la pagination
   */
  async getReports(options?: { status?: string; limit?: number; offset?: number }): Promise<GetReportsResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const url = `${this.baseURL}/api/reports${params.toString() ? `?${params.toString()}` : ''}`;

      console.log('📋 Récupération des rapports:', url);

      const response = await axios.get<GetReportsResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la récupération des rapports');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      if (response.data.ok) {
        return response.data;
      }

      throw new Error('Échec de la récupération des rapports');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des rapports:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        // Erreur réseau (backend inaccessible)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const errorMessage = `Impossible de se connecter au serveur.\n\n` +
            `Vérifiez que :\n` +
            `• Le backend est démarré (port 3000)\n` +
            `• Votre appareil est sur le même réseau WiFi\n` +
            `• L'IP dans app.json correspond à votre ordinateur\n` +
            `\nURL configurée : ${this.baseURL}`;
          throw new Error(errorMessage);
        }
        
        if (axiosError.response?.status === 404) {
          throw new Error('Endpoint des rapports non trouvé. Vérifiez la configuration du backend.');
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la récupération des rapports');
    }
  }

  /**
   * Met à jour le statut d'un rapport
   * @param {string} reportId - ID du rapport
   * @param {string} status - Nouveau statut (draft, final, trash)
   */
  async updateReportStatus(reportId: string, status: 'draft' | 'final' | 'trash'): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log(`📝 Mise à jour du statut du rapport: ${reportId} -> ${status}`);

      await axios.patch(
        `${this.baseURL}/api/reports/${reportId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la mise à jour du statut');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      console.log('✅ Statut du rapport mis à jour avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Rapport non trouvé');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas la permission de modifier ce rapport');
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la mise à jour du statut');
    }
  }

  /**
   * Génère ou régénère un PDF à partir d'un JSON SOAPIE structuré
   */
  async generatePDF(data: GeneratePDFRequest): Promise<GeneratePDFResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log('📄 Génération PDF avec structured_json:', {
        hasPatient: !!data.structured_json.patient,
        hasSOAPIE: !!data.structured_json.soapie,
        noteId: data.note_id,
        patientId: data.patient_id,
      });

      const response = await axios.post<GeneratePDFResponse>(
        `${this.baseURL}/api/report/generate`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 1 minute pour la génération PDF
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la génération PDF');
          console.error('Token utilisé (premiers 50 caractères):', token.substring(0, 50) + '...');
          console.error('URL:', `${this.baseURL}/api/report/generate`);
          console.error('Réponse backend:', error.response?.data);
        }
        throw error;
      });

      console.log('📥 Réponse backend reçue:', {
        ok: response.data.ok,
        hasPdfUrl: !!response.data.pdf_url,
        pdfUrl: response.data.pdf_url ? response.data.pdf_url.substring(0, 50) + '...' : 'absent',
        noteId: response.data.note_id,
        message: response.data.message
      });

      if (!response.data) {
        console.error('❌ Réponse backend vide');
        throw new Error('Réponse du serveur vide');
      }

      if (response.data.ok !== true) {
        console.error('❌ Réponse backend avec ok !== true:', response.data);
        throw new Error(response.data.message || 'Échec de la génération du PDF');
      }

      if (!response.data.pdf_url) {
        console.error('❌ pdf_url manquant dans la réponse:', response.data);
        throw new Error('URL du PDF non retournée par le serveur');
      }

      console.log('✅ PDF généré avec succès, URL:', response.data.pdf_url);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error);

      if (isTokenExpiredError(error)) {
        console.error('🔒 Erreur 401 - Token invalide ou expiré');
        await handleTokenExpiration();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Endpoint de génération PDF non trouvé. Vérifiez la configuration du backend.');
        }
        
        if (axiosError.response?.status === 400) {
          const errorMessage = axiosError.response.data?.message || 'Données invalides pour la génération PDF';
          console.error('❌ Erreur 400:', errorMessage);
          console.error('   Données envoyées:', JSON.stringify(data, null, 2));
          throw new Error(errorMessage);
        }
        
        if (axiosError.response?.status === 500) {
          const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Erreur serveur lors de la génération PDF';
          console.error('❌ Erreur 500:', errorMessage);
          console.error('   Détails backend:', axiosError.response.data);
          throw new Error(`Erreur serveur: ${errorMessage}`);
        }
        
        if (axiosError.response?.status) {
          console.error(`❌ Erreur HTTP ${axiosError.response.status}:`, axiosError.response.data);
          throw new Error(axiosError.response.data?.message || `Erreur HTTP ${axiosError.response.status}`);
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la génération du PDF');
    }
  }

  /**
   * Régénère l'URL signée pour le PDF d'un rapport
   * @param {string} reportId - ID du rapport
   * @returns {Promise<string>} - Nouvelle URL signée
   */
  async regenerateSignedUrl(reportId: string): Promise<string> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log(`🔗 Régénération de l'URL signée pour le rapport: ${reportId}`);

      const response = await axios.get<{ ok: boolean; signed_url: string }>(
        `${this.baseURL}/api/reports/${reportId}/signed-url`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la régénération de l\'URL');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      if (response.data.ok && response.data.signed_url) {
        console.log('✅ URL signée régénérée avec succès');
        return response.data.signed_url;
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error: any) {
      console.error('❌ Erreur lors de la régénération de l\'URL signée:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la régénération de l\'URL signée');
    }
  }

  /**
   * Supprime un rapport (met à la corbeille)
   * @param {string} reportId - ID du rapport à supprimer
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log(`🗑️ Suppression du rapport: ${reportId}`);

      await axios.delete(
        `${this.baseURL}/api/reports/${reportId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la suppression');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      console.log('✅ Rapport supprimé avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du rapport:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Rapport non trouvé');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas la permission de supprimer ce rapport');
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la suppression du rapport');
    }
  }

  /**
   * Met un rapport en brouillon
   * @param {string} reportId - ID du rapport à mettre en brouillon
   */
  async saveAsDraft(reportId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Non authentifié - Token manquant. Veuillez vous reconnecter.');
      }

      console.log(`📝 Mise en brouillon du rapport: ${reportId}`);

      await axios.patch(
        `${this.baseURL}/api/reports/${reportId}`,
        { status: 'draft' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      ).catch((error) => {
        if (error.response?.status === 401) {
          console.error('❌ Erreur 401 lors de la mise en brouillon');
          if (isTokenExpiredError(error)) {
            handleTokenExpiration();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }
        throw error;
      });

      console.log('✅ Rapport mis en brouillon avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise en brouillon:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message?: string }>;
        
        if (axiosError.response?.status === 404) {
          throw new Error('Rapport non trouvé');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas la permission de modifier ce rapport');
        }
      }

      throw error instanceof Error ? error : new Error('Erreur lors de la mise en brouillon');
    }
  }
}

export const reportApiService = new ReportApiService();

