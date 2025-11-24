/**
 * Tests unitaires pour le service de transcription
 */

const { transcribeAudio } = require('../services/transcription');
const fs = require('fs');
const path = require('path');

describe('Service de transcription', () => {
  // Tests basiques de structure
  describe('transcribeAudio', () => {
    it('devrait être une fonction', () => {
      expect(typeof transcribeAudio).toBe('function');
    });

    it('devrait rejeter si le fichier n\'existe pas', async () => {
      await expect(transcribeAudio('/chemin/inexistant/audio.m4a')).rejects.toThrow();
    });

    // Note: Les tests avec l'API Gemini réelle nécessitent une clé API valide
    // et peuvent être coûteux, donc on les garde pour l'intégration
  });
});

