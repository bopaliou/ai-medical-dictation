/**
 * Service API pour la gestion des rapports (édition, génération PDF)
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleTokenExpiration, isTokenExpiredError } from '../utils/authInterceptor';
import { rateLimiter } from '../utils/rateLimiter';

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
    const requestKey = `getReportDetails_${reportId}`;
    
    // Utiliser debounce pour éviter les requêtes multiples
    return rateLimiter.debounce(requestKey, async () => {
      // Retry avec backoff pour les erreurs 429
      return rateLimiter.retryWithBackoff(async () => {
        try {
          const token = await this.getAuthToken();
          if (!token) {
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
                throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
              }
            }
            throw error;
          });

          if (response.data.ok && response.data.report) {
            console.log('✅ Détails du rapport récupérés avec succès');
            return response.data.report;
          }

          throw new Error('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.');
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ error: string; message?: string }>;
            
            // Erreur 429 - Trop de requêtes (traitée comme un warning, pas une erreur critique)
            if (axiosError.response?.status === 429) {
              const retryAfter = axiosError.response.headers['retry-after'];
              const waitTime = retryAfter ? parseInt(retryAfter, 10) : 30;
              console.warn(
                `⏳ Trop de requêtes (429) lors de la récupération des détails - Attente de ${waitTime}s avant retry automatique. ` +
                `L'application va réessayer automatiquement.`
              );
              throw new Error(
                `Trop de requêtes ont été envoyées au serveur.\n\n` +
                `Veuillez patienter ${waitTime} secondes avant de réessayer.\n\n` +
                `💡 Astuce : L'application va automatiquement réessayer dans quelques instants.`
              );
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
            
            if (axiosError.response?.status === 404) {
              throw new Error('Ce rapport n\'a pas été trouvé dans le système.');
            }
            
            if (axiosError.response?.status === 403) {
              throw new Error('Vous n\'avez pas l\'autorisation de consulter ce rapport.');
            }
          }
          
          // Pour les autres erreurs, logger comme erreur
          console.error('❌ Erreur lors de la récupération des détails:', error);

          throw error instanceof Error ? error : new Error('Erreur lors de la récupération des détails du rapport');
        }
      }, 3, 1000); // 3 tentatives avec délai initial de 1s
    }, 500); // Debounce de 500ms
  }

  /**
   * Récupère la liste des rapports de l'utilisateur connecté
   * @param {Object} options - Options de filtrage
   * @param {string} options.status - Filtrer par statut (draft, final, trash)
   * @param {number} options.limit - Nombre maximum de résultats
   * @param {number} options.offset - Offset pour la pagination
   */
  async getReports(options?: { status?: string; limit?: number; offset?: number }): Promise<GetReportsResponse> {
    const requestKey = `getReports_${options?.status || 'all'}_${options?.limit || 'default'}`;
    
    // Utiliser debounce pour éviter les requêtes multiples
    return rateLimiter.debounce(requestKey, async () => {
      // Retry avec backoff pour les erreurs 429
      return rateLimiter.retryWithBackoff(async () => {
        try {
          const token = await this.getAuthToken();
          if (!token) {
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
                throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
              }
            }
            throw error;
          });

          if (response.data.ok) {
            return response.data;
          }

          throw new Error('Impossible de charger les rapports. Veuillez réessayer.');
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ error: string; message?: string }>;
            
            // Erreur 429 - Trop de requêtes (traitée comme un warning, pas une erreur critique)
            if (axiosError.response?.status === 429) {
              const retryAfter = axiosError.response.headers['retry-after'];
              const waitTime = retryAfter ? parseInt(retryAfter, 10) : 30;
              console.warn(
                `⏳ Trop de requêtes (429) - Attente de ${waitTime}s avant retry automatique. ` +
                `L'application va réessayer automatiquement.`
              );
              throw new Error(
                `Trop de requêtes ont été envoyées au serveur.\n\n` +
                `Veuillez patienter ${waitTime} secondes avant de réessayer.\n\n` +
                `💡 Astuce : L'application va automatiquement réessayer dans quelques instants.`
              );
            }
          }
          
          // Pour les autres erreurs, logger comme erreur
          console.error('❌ Erreur lors de la récupération des rapports:', error);

          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ error: string; message?: string }>;
            
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
            
            if (axiosError.response?.status === 404) {
              throw new Error('Le service de rapports n\'est pas disponible. Veuillez réessayer plus tard.');
            }
          }

          throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors du chargement des rapports. Veuillez réessayer.');
        }
      }, 3, 1000); // 3 tentatives avec délai initial de 1s
    }, 500); // Debounce de 500ms
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
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
          throw new Error('Ce rapport n\'a pas été trouvé dans le système.');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas l\'autorisation de modifier ce rapport.');
        }
      }

      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la mise à jour. Veuillez réessayer.');
    }
  }

  /**
   * Génère ou régénère un PDF à partir d'un JSON SOAPIE structuré
   */
  async generatePDF(data: GeneratePDFRequest): Promise<GeneratePDFResponse> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
        throw new Error('Le serveur n\'a pas renvoyé de réponse. Veuillez réessayer.');
      }

      if (response.data.ok !== true) {
        console.error('❌ Réponse backend avec ok !== true:', response.data);
        throw new Error(response.data.message || 'La génération du PDF a échoué. Veuillez réessayer.');
      }

      if (!response.data.pdf_url) {
        console.error('❌ pdf_url manquant dans la réponse:', response.data);
        throw new Error('Le PDF n\'a pas pu être généré. Veuillez réessayer.');
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
          throw new Error('Le service de génération PDF n\'est pas disponible. Veuillez réessayer plus tard.');
        }
        
        if (axiosError.response?.status === 400) {
          const errorMessage = axiosError.response.data?.message || 'Les données fournies ne sont pas valides pour générer le PDF';
          console.error('❌ Erreur 400:', errorMessage);
          console.error('   Données envoyées:', JSON.stringify(data, null, 2));
          throw new Error(`Veuillez vérifier les informations saisies. ${errorMessage}`);
        }
        
        if (axiosError.response?.status === 500) {
          const errorMessage = axiosError.response.data?.message || axiosError.response.data?.error || 'Une erreur s\'est produite lors de la génération du PDF';
          console.error('❌ Erreur 500:', errorMessage);
          console.error('   Détails backend:', axiosError.response.data);
          throw new Error(`Une erreur inattendue s'est produite. ${errorMessage} Veuillez réessayer dans quelques instants.`);
        }
        
        if (axiosError.response?.status) {
          console.error(`❌ Erreur HTTP ${axiosError.response.status}:`, axiosError.response.data);
          throw new Error(axiosError.response.data?.message || `Erreur HTTP ${axiosError.response.status}`);
        }
      }

      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la génération du PDF. Veuillez réessayer.');
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
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
          }
        }
        throw error;
      });

      if (response.data.ok && response.data.signed_url) {
        console.log('✅ URL signée régénérée avec succès');
        return response.data.signed_url;
      }

      throw new Error('Une réponse inattendue a été reçue du serveur. Veuillez réessayer.');
    } catch (error: any) {
      console.error('❌ Erreur lors de la régénération de l\'URL signée:', error);
      throw error instanceof Error ? error : new Error('Impossible de régénérer l\'URL. Veuillez réessayer.');
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
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
          throw new Error('Ce rapport n\'a pas été trouvé dans le système.');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas la permission de supprimer ce rapport');
        }
      }

      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la suppression. Veuillez réessayer.');
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
        throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
            throw new Error('Votre session a expiré. Veuillez vous reconnecter pour continuer.');
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
          throw new Error('Ce rapport n\'a pas été trouvé dans le système.');
        }
        
        if (axiosError.response?.status === 403) {
          throw new Error('Vous n\'avez pas l\'autorisation de modifier ce rapport.');
        }
      }

      throw error instanceof Error ? error : new Error('Une erreur s\'est produite lors de la sauvegarde en brouillon. Veuillez réessayer.');
    }
  }
}

export const reportApiService = new ReportApiService();

