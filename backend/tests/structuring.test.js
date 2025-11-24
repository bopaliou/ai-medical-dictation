/**
 * Tests unitaires pour le service de structuration
 */

const { structureTranscription, SYSTEM_PROMPT } = require('../services/structuring');

describe('Service de structuration', () => {
  describe('structureTranscription', () => {
    it('devrait être une fonction', () => {
      expect(typeof structureTranscription).toBe('function');
    });

    it('devrait rejeter si le texte est vide', async () => {
      await expect(structureTranscription('')).rejects.toThrow();
      await expect(structureTranscription(null)).rejects.toThrow();
    });

    it('devrait avoir un prompt système défini', () => {
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(typeof SYSTEM_PROMPT).toBe('string');
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    // Note: Les tests avec l'API Gemini réelle nécessitent une clé API valide
  });

  describe('SYSTEM_PROMPT', () => {
    it('devrait contenir les instructions pour extraction', () => {
      expect(SYSTEM_PROMPT).toContain('vitals');
      expect(SYSTEM_PROMPT).toContain('medications');
      expect(SYSTEM_PROMPT).toContain('care');
      expect(SYSTEM_PROMPT).toContain('observations');
      expect(SYSTEM_PROMPT).toContain('flags');
    });
  });
});

