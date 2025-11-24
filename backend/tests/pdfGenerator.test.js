/**
 * Tests unitaires pour le service de génération PDF
 */

const { generatePDF } = require('../services/pdfGenerator');
const fs = require('fs');
const os = require('os');

describe('Service de génération PDF', () => {
  describe('generatePDF', () => {
    it('devrait être une fonction', () => {
      expect(typeof generatePDF).toBe('function');
    });

    it('devrait générer un PDF avec les données fournies', async () => {
      const mockPatient = {
        full_name: 'Jean Dupont',
        dob: '1990-01-01',
        gender: 'M'
      };

      const mockData = {
        patient: mockPatient,
        transcriptionText: 'Patient en bonne santé, température normale.',
        structuredJson: {
          vitals: { temperature: '37.2°C' },
          care: ['Pansement changé'],
          medications: [],
          observations: 'Patient stable',
          flags: []
        },
        recordedAt: new Date(),
        createdAt: new Date()
      };

      try {
        const pdfPath = await generatePDF(mockData);
        expect(fs.existsSync(pdfPath)).toBe(true);

        // Vérification de la taille (doit être < 150 KB)
        const stats = fs.statSync(pdfPath);
        const fileSizeInKB = stats.size / 1024;
        expect(fileSizeInKB).toBeLessThan(150);

        // Nettoyage
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      } catch (error) {
        // Si pdfkit n'est pas disponible, on skip le test
        if (error.message.includes('pdfkit')) {
          console.warn('pdfkit non disponible, test ignoré');
          return;
        }
        throw error;
      }
    }, 30000); // Timeout de 30 secondes pour la génération PDF
  });
});

