/**
 * Service de transcription audio
 * Utilise Whisper.cpp local installé dans WSL pour transcrire les fichiers audio
 */

const { transcribeLocalWhisper, transcribeLocalWhisperWithDetails } = require('./transcriptionLocal');

/**
 * Transcription d'un fichier audio en texte
 * Utilise Whisper.cpp local via WSL
 * @param {string} audioFilePath - Chemin local du fichier audio (.m4a, .mp3, .wav, etc.)
 * @returns {Promise<string>} - Texte transcrit
 */
async function transcribeAudio(audioFilePath) {
  try {
    console.log(`Transcription locale du fichier: ${audioFilePath}`);
    
    // Utiliser la transcription locale Whisper.cpp
    const transcriptionText = await transcribeLocalWhisper(audioFilePath);
    
    return transcriptionText;
  } catch (error) {
    console.error('Erreur lors de la transcription:', error);
    throw new Error(`Erreur de transcription: ${error.message}`);
  }
}

/**
 * Transcription avec format JSON (pour obtenir plus de détails)
 * Utilise Whisper.cpp local via WSL
 * @param {string} audioFilePath - Chemin local du fichier audio
 * @returns {Promise<Object>} - Transcription avec métadonnées
 */
async function transcribeAudioWithDetails(audioFilePath) {
  try {
    console.log('Transcription locale détaillée...');
    
    // Utiliser la transcription locale Whisper.cpp avec détails
    const result = await transcribeLocalWhisperWithDetails(audioFilePath);
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la transcription détaillée:', error);
    throw error;
  }
}

module.exports = {
  transcribeAudio,
  transcribeAudioWithDetails
};
