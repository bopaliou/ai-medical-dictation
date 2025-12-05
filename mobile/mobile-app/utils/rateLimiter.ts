/**
 * Rate Limiter et Debouncing pour éviter les erreurs 429
 * Gère les requêtes multiples et les limite selon un délai
 */

interface PendingRequest {
  key: string;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RateLimiter {
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private requestTimers: Map<string, any> = new Map();
  private readonly minDelay: number = 500; // Délai minimum entre requêtes similaires (ms)
  private readonly maxDelay: number = 2000; // Délai maximum pour le debouncing (ms)

  /**
   * Debounce une requête - attend un délai avant d'exécuter
   */
  debounce<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = this.minDelay
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Annuler la requête précédente si elle existe
      const existingTimer = this.requestTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Créer une nouvelle requête avec délai
      const timer = setTimeout(async () => {
        this.requestTimers.delete(key);
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.requestTimers.set(key, timer);
    });
  }

  /**
   * Throttle une requête - limite la fréquence d'exécution
   */
  throttle<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = this.minDelay
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const lastRequest = this.pendingRequests.get(key);

      if (lastRequest && lastRequest.length > 0) {
        const lastTimestamp = lastRequest[lastRequest.length - 1].timestamp;
        const timeSinceLastRequest = now - lastTimestamp;

        if (timeSinceLastRequest < delay) {
          // Ajouter à la queue
          lastRequest.push({ key, timestamp: now, resolve, reject });
          return;
        }
      }

      // Exécuter immédiatement
      const executeRequest = async () => {
        try {
          const result = await fn();
          resolve(result);

          // Traiter les requêtes en attente
          const pending = this.pendingRequests.get(key);
          if (pending && pending.length > 0) {
            const nextRequest = pending.shift();
            if (nextRequest) {
              setTimeout(() => {
                this.throttle(key, fn, delay).then(nextRequest.resolve).catch(nextRequest.reject);
              }, delay);
            }
          }
        } catch (error) {
          reject(error);

          // Rejeter toutes les requêtes en attente
          const pending = this.pendingRequests.get(key);
          if (pending) {
            pending.forEach(req => req.reject(error));
            this.pendingRequests.delete(key);
          }
        }
      };

      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }

      executeRequest();
    });
  }

  /**
   * Retry avec backoff exponentiel pour les erreurs 429
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Si c'est une erreur 429, attendre avant de réessayer
        if (error?.response?.status === 429 && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt); // Backoff exponentiel
          const retryAfter = error?.response?.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

          console.log(`⏳ Trop de requêtes (429), nouvelle tentative dans ${Math.round(waitTime / 1000)}s (tentative ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Si toutes les tentatives ont échoué avec une erreur 429, créer un message d'erreur plus clair
        if (error?.response?.status === 429 && attempt >= maxRetries) {
          const retryAfter = error?.response?.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) : 30;
          const friendlyError = new Error(
            `Trop de requêtes ont été envoyées au serveur.\n\n` +
            `Veuillez patienter ${waitTime} secondes avant de réessayer.\n\n` +
            `💡 Astuce : L'application va automatiquement réessayer dans quelques instants.`
          );
          // Préserver les propriétés de l'erreur axios
          (friendlyError as any).response = error.response;
          (friendlyError as any).isAxiosError = true;
          throw friendlyError;
        }

        // Pour les autres erreurs ou si on a épuisé les tentatives
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Nettoie les timers et les requêtes en attente
   */
  clear(key?: string) {
    if (key) {
      const timer = this.requestTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.requestTimers.delete(key);
      }
      this.pendingRequests.delete(key);
    } else {
      // Nettoyer tout
      this.requestTimers.forEach(timer => clearTimeout(timer));
      this.requestTimers.clear();
      this.pendingRequests.clear();
    }
  }
}

// Instance singleton
export const rateLimiter = new RateLimiter();

