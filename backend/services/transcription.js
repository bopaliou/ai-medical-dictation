/**
 * Service de transcription audio
 * Utilise Groq Whisper-large-v3 pour transcrire les fichiers audio
 */

const fs = require('fs');
const Groq = require('groq-sdk');

// Initialiser le client Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Transcription d'un fichier audio en texte via Groq Whisper-large-v3
 * @param {string} audioFilePath - Chemin local du fichier audio (.m4a, .mp3, .wav, etc.)
 * @returns {Promise<string>} - Texte transcrit
 */
async function transcribeAudio(audioFilePath) {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY n\'est pas défini dans les variables d\'environnement');
    }

    console.log(`🎤 Transcription via Groq Whisper-large-v3 du fichier: ${audioFilePath}`);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Le fichier audio n'existe pas: ${audioFilePath}`);
    }

    // Créer un stream du fichier audio
    const audioStream = fs.createReadStream(audioFilePath);
    
    // Obtenir le nom du fichier pour le type MIME
    const fileName = require('path').basename(audioFilePath);
    const fileExtension = require('path').extname(audioFilePath).toLowerCase();
    
    // Déterminer le type MIME
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/m4a',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg'
    };
    const mimeType = mimeTypes[fileExtension] || 'audio/mpeg';
    
    // Appeler l'API Groq pour la transcription
    // Groq utilise l'API OpenAI-compatible, donc on peut utiliser response_format: 'text'
    const result = await groq.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-large-v3',
      response_format: 'text',
      language: 'fr'
    });

    // Groq retourne directement le texte si response_format est 'text'
    // Sinon, extraire le texte de l'objet résultat
    const transcriptionText = typeof result === 'string' ? result : (result.text || result || '');
    
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      throw new Error('La transcription est vide');
    }

    console.log(`✅ Transcription réussie (${transcriptionText.length} caractères)`);
    
    return transcriptionText.trim();
  } catch (error) {
    console.error('❌ Erreur lors de la transcription Groq:', error);
    
    // Améliorer les messages d'erreur
    if (error.message?.includes('API key')) {
      throw new Error('Erreur d\'authentification Groq. Vérifiez GROQ_API_KEY.');
    }
    if (error.message?.includes('rate limit')) {
      throw new Error('Limite de taux Groq atteinte. Réessayez plus tard.');
    }
    if (error.message?.includes('file')) {
      throw new Error(`Erreur avec le fichier audio: ${error.message}`);
    }
    
    throw new Error(`Erreur de transcription Groq: ${error.message}`);
  }
}

/**
 * Transcription avec format JSON (pour obtenir plus de détails)
 * @param {string} audioFilePath - Chemin local du fichier audio
 * @returns {Promise<Object>} - Transcription avec métadonnées
 */
async function transcribeAudioWithDetails(audioFilePath) {
  try {
    const text = await transcribeAudio(audioFilePath);
    
    return {
      text: text,
      language: 'fr',
      duration: null // Groq ne fournit pas directement la durée dans la réponse text
    };
  } catch (error) {
    console.error('Erreur lors de la transcription détaillée:', error);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
  transcribeAudioWithDetails
};
