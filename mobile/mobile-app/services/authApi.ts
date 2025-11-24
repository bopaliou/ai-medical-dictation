/**
 * Service API pour l'authentification
 * Communique avec le backend pour la connexion
 */

import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  hint?: string;
}

class AuthApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Nettoie les messages d'erreur pour ne pas exposer les endpoints API
   * et supprime les références à l'inscription (non disponible dans l'app)
   */
  private sanitizeErrorMessage(message: string): string {
    if (!message) return message;
    
    // Supprimer les références aux endpoints API
    let cleaned = message
      .replace(/\/api\/[^\s]+/g, '')
      .replace(/POST\s+\/api\/[^\s]+/gi, '')
      .replace(/GET\s+\/api\/[^\s]+/gi, '')
      .replace(/avec\s+\{[^}]+\}/gi, '')
      // Supprimer les phrases qui mentionnent l'inscription/création de compte
      .replace(/Si vous n'avez pas de compte[^.]*\./gi, '')
      .replace(/utilisez\s+[^\s]+\s+pour\s+vous\s+inscrire/gi, '')
      .replace(/utilisez\s+[^\s]+\s+pour\s+créer\s+un\s+compte/gi, '')
      .replace(/créez\s+un\s+nouveau\s+compte/gi, 'contactez votre administrateur')
      .replace(/créez\s+un\s+compte/gi, 'contactez votre administrateur')
      .replace(/vous\s+inscrire/gi, 'contacter votre administrateur')
      .replace(/vous\s+inscrire/gi, 'contacter votre administrateur')
      .replace(/réessayer\s+de\s+vous\s+inscrire/gi, 'contacter votre administrateur')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Si le message est devenu vide après nettoyage, retourner un message générique
    if (!cleaned || cleaned.length < 3) {
      return '';
    }
    
    return cleaned;
  }

  /**
   * Connexion avec email et mot de passe
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = `${this.baseURL}/api/auth/login`;

    try {
      const response = await axios.post<LoginResponse>(
        url,
        {
          email: credentials.email,
          password: credentials.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      if (response.data.ok && response.data.token && response.data.user) {
        return response.data;
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (error.code === 'ERR_NETWORK' || !error.response) {
          // Afficher l'URL configurée pour faciliter le diagnostic
          const configUrl = this.baseURL;
          throw new Error(
            `Impossible de se connecter au serveur.\n\n` +
            `URL configurée: ${configUrl}\n\n` +
            `Vérifiez que:\n` +
            `• Le backend est démarré\n` +
            `• L'IP dans app.json correspond à celle affichée par le backend\n` +
            `• Votre appareil et l'ordinateur sont sur le même réseau WiFi\n` +
            `• Le firewall autorise les connexions sur le port 3000\n\n` +
            `Consultez DIAGNOSTIC_CONNEXION.md pour plus d'aide.`
          );
        }

        const status = error.response.status;
        const errorData = error.response.data;

        // Nettoyer les messages d'erreur pour ne pas exposer les endpoints
        const cleanMessage = this.sanitizeErrorMessage(errorData?.message || errorData?.error || '');

        if (status === 401) {
          throw new Error(cleanMessage || 'Email ou mot de passe incorrect');
        }

        if (status === 400) {
          throw new Error(cleanMessage || 'Données invalides');
        }

        if (status === 500) {
          throw new Error(cleanMessage || 'Erreur serveur. Veuillez réessayer plus tard.');
        }

        throw new Error(cleanMessage || `Erreur ${status}`);
      }

      throw error instanceof Error ? error : new Error('Une erreur inconnue est survenue');
    }
  }

  /**
   * Vérifier si le serveur est accessible
   */
  async healthCheck(): Promise<boolean> {
    const url = `${this.baseURL}/health`;
    try {
      const response = await axios.get(url, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const authApiService = new AuthApiService();

