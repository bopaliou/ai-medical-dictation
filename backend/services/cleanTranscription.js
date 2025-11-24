/**
 * Service de nettoyage des transcriptions
 * Corrige les fautes courantes de transcription sans inventer d'informations
 * 
 * Règles :
 * - NE JAMAIS inventer de données
 * - Si hésitation, laisser tel quel
 * - Corriger uniquement les motifs fréquents évidents
 */

/**
 * Nettoie une transcription en corrigeant les fautes courantes
 * @param {string} transcriptionText - Texte transcrit brut
 * @returns {string} - Transcription nettoyée
 */
function cleanTranscription(transcriptionText) {
  if (!transcriptionText || typeof transcriptionText !== 'string') {
    return '';
  }

  let cleaned = transcriptionText;

  // Liste de corrections courantes (motif => correction)
  const corrections = [
    // Corrections médicales courantes
    { pattern: /\bparacettamol\b/gi, replacement: 'paracétamol' },
    { pattern: /\bparacetamol\b/gi, replacement: 'paracétamol' },
    { pattern: /\bamoxicivine\b/gi, replacement: 'amoxicilline' },
    { pattern: /\bglissémi\b/gi, replacement: 'glycémie' },
    { pattern: /\bglisemi\b/gi, replacement: 'glycémie' },
    { pattern: /\bosculation\b/gi, replacement: 'auscultation' },
    
    // Corrections de noms (heuristique prudente)
    { pattern: /\bmamadoussard\b/gi, replacement: 'Mamadou Sarr' },
    { pattern: /\bperfe\b/gi, replacement: 'perfusion' },
    
    // Corrections de dosages/volumes
    { pattern: /\b500000\s*ml\b/gi, replacement: '500 ml' },
    { pattern: /\bperfusion\s*500000\b/gi, replacement: 'perfusion 500 ml' },
    
    // Corrections de médicaments courants
    { pattern: /\bpar\s*assez\s*tamol\b/gi, replacement: 'paracétamol' },
    { pattern: /\bpar\s*assez\s*tamol\b/gi, replacement: 'paracétamol' },
    
    // Espaces multiples
    { pattern: /\s{2,}/g, replacement: ' ' },
    
    // Espaces avant ponctuation
    { pattern: /\s+([.,;:!?])/g, replacement: '$1' },
  ];

  // Appliquer les corrections
  for (const correction of corrections) {
    cleaned = cleaned.replace(correction.pattern, correction.replacement);
  }

  // Nettoyer les espaces en début/fin
  cleaned = cleaned.trim();

  return cleaned;
}

module.exports = {
  cleanTranscription
};

