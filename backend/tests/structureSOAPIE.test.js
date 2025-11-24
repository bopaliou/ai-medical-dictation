/**
 * Tests unitaires pour structureSOAPIE
 * Teste la structuration SOAPIE avec l'exemple Mamadou Sarr
 */

const { structureSOAPIE } = require('../services/structuring');

// Transcription d'exemple (Mamadou Sarr)
const exampleTranscription = `Patients Mamadoussard, homme de 52 ans, chambre 17 en médecine interne.
Il dit qu'il se sent très faible depuis hier soir, avec frissons et mal de têtes.
La famille confirme qu'il a fait de la fièvre toute la nuit.
Température actuelle, 39,1, tension très sur 8, fréquence cardiaque 88, respiration 22, saturation 97%.
A l'osculation, respiration un peu rapide mais pas de ciblant. Glissémi, 1,4.
Je lui ai administré par assez tamol 1 gramme, perfusion de sérumes salées 500 ml et amoxicivine 1 gramme selon protocole du médecin.
La perfe est correctement en place. J'ai demandé bilan sanguin complet en attente.
Après les médicaments, il dit se sentir légèrement mieux mais toujours fatigué.
Température descendue à 38,6.
Surveillez température toutes les 30 minutes, surveillez perfusion, surveillez respiration aussi et attendre résultat du laboratoire.`;

describe('structureSOAPIE', () => {
  test('devrait retourner un objet avec patient et soapie', async () => {
    // Skip le test si GEMINI_API_KEY n'est pas définie
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY non définie, test ignoré');
      return;
    }

    const result = await structureSOAPIE(exampleTranscription);

    // Vérifier que le résultat contient patient et soapie
    expect(result).toHaveProperty('patient');
    expect(result).toHaveProperty('soapie');

    // Vérifier la structure patient
    expect(result.patient).toHaveProperty('full_name');
    expect(result.patient).toHaveProperty('age');
    expect(result.patient).toHaveProperty('gender');
    expect(result.patient).toHaveProperty('room_number');
    expect(result.patient).toHaveProperty('unit');

    // Vérifier la structure soapie
    expect(result.soapie).toHaveProperty('S');
    expect(result.soapie).toHaveProperty('O');
    expect(result.soapie).toHaveProperty('A');
    expect(result.soapie).toHaveProperty('I');
    expect(result.soapie).toHaveProperty('E');
    expect(result.soapie).toHaveProperty('P');

    // Vérifier la structure O (Objectif)
    expect(result.soapie.O).toHaveProperty('vitals');
    expect(result.soapie.O).toHaveProperty('exam');
    expect(result.soapie.O).toHaveProperty('labs');
    expect(result.soapie.O).toHaveProperty('medications');

    // Vérifier la structure vitals
    expect(result.soapie.O.vitals).toHaveProperty('temperature');
    expect(result.soapie.O.vitals).toHaveProperty('blood_pressure');
    expect(result.soapie.O.vitals).toHaveProperty('heart_rate');
    expect(result.soapie.O.vitals).toHaveProperty('respiratory_rate');
    expect(result.soapie.O.vitals).toHaveProperty('spo2');
    expect(result.soapie.O.vitals).toHaveProperty('glycemia');
  }, 30000); // Timeout de 30 secondes pour l'appel API

  test('devrait extraire correctement le nom du patient (Mamadou Sarr)', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY non définie, test ignoré');
      return;
    }

    const result = await structureSOAPIE(exampleTranscription);

    // Vérifier que le nom du patient contient "Mamadou" ou "Sarr"
    expect(result.patient.full_name).toBeTruthy();
    expect(
      result.patient.full_name.toLowerCase().includes('mamadou') ||
      result.patient.full_name.toLowerCase().includes('sarr')
    ).toBe(true);
  }, 30000);

  test('devrait extraire correctement les signes vitaux', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY non définie, test ignoré');
      return;
    }

    const result = await structureSOAPIE(exampleTranscription);

    // Vérifier que la température est extraite (39,1 ou 38,6)
    expect(result.soapie.O.vitals.temperature).toBeTruthy();
    
    // Vérifier que les autres signes vitaux sont présents
    expect(result.soapie.O.vitals.heart_rate).toBeTruthy();
    expect(result.soapie.O.vitals.respiratory_rate).toBeTruthy();
    expect(result.soapie.O.vitals.spo2).toBeTruthy();
  }, 30000);

  test('devrait retourner un JSON valide même avec une transcription vide', async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY non définie, test ignoré');
      return;
    }

    // Test avec une transcription vide (doit retourner des valeurs vides)
    const result = await structureSOAPIE('');

    expect(result).toHaveProperty('patient');
    expect(result).toHaveProperty('soapie');
    expect(result.patient.full_name).toBe('');
    expect(result.soapie.S).toBe('');
  }, 30000);

  test('devrait lancer une erreur si la transcription est vide', async () => {
    await expect(structureSOAPIE('')).rejects.toThrow();
  });
});

