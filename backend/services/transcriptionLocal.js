/**
 * Service de transcription audio locale
 * Utilise Whisper.cpp installé localement via WSL pour transcrire les fichiers audio
 */

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Convertit un chemin Windows en chemin WSL
 * @param {string} windowsPath - Chemin Windows (ex: C:\Users\...)
 * @returns {string} - Chemin WSL (ex: /mnt/c/Users/...)
 */
function convertWindowsToWSLPath(windowsPath) {
  if (!windowsPath) {
    return windowsPath;
  }

  // Normaliser les séparateurs de chemin
  let wslPath = windowsPath.replace(/\\/g, '/');

  // Convertir C:\ ou C:/ en /mnt/c/
  if (wslPath.match(/^[A-Za-z]:/)) {
    const drive = wslPath[0].toLowerCase();
    wslPath = wslPath.replace(/^[A-Za-z]:/, `/mnt/${drive}`);
  }

  return wslPath;
}

/**
 * Convertit un chemin WSL en chemin Windows (pour les fichiers générés)
 * @param {string} wslPath - Chemin WSL (ex: /mnt/c/Users/...)
 * @returns {string} - Chemin Windows (ex: C:\Users\...)
 */
function convertWSLToWindowsPath(wslPath) {
  if (!wslPath) {
    return wslPath;
  }

  // Convertir /mnt/c/ en C:/
  let windowsPath = wslPath.replace(/^\/mnt\/([a-z])/, (match, drive) => {
    return drive.toUpperCase() + ':';
  });

  // Normaliser les séparateurs
  windowsPath = windowsPath.replace(/\//g, '\\');

  return windowsPath;
}

/**
 * Obtient le chemin du home directory dans WSL
 * ATTENTION : Le username Windows (ex: serig) peut être différent du username WSL (ex: bopaliou)
 * @returns {string} - Chemin du home WSL (ex: /home/bopaliou)
 */
function getWSLHomePath() {
  // Priorité 1 : Variable d'environnement WSL_HOME si définie (recommandé)
  // C'est la méthode la plus fiable car elle permet de spécifier exactement le chemin WSL
  if (process.env.WSL_HOME) {
    console.log(`WSL_HOME utilisé depuis variable d'environnement: ${process.env.WSL_HOME}`);
    return process.env.WSL_HOME;
  }
  
  // Priorité 2 : Variable d'environnement WSL_USER si définie
  // Permet de spécifier juste le username WSL (ex: bopaliou)
  if (process.env.WSL_USER) {
    const wslHome = `/home/${process.env.WSL_USER}`;
    console.log(`WSL_USER utilisé, WSL home calculé: ${wslHome}`);
    return wslHome;
  }
  
  // Priorité 3 : Si on est déjà dans WSL, utiliser directement HOME
  if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
    if (process.env.HOME) {
      console.log(`HOME utilisé depuis WSL: ${process.env.HOME}`);
      return process.env.HOME;
    }
    const username = process.env.USER || process.env.USERNAME || 'user';
    const wslHome = `/home/${username}`;
    console.log(`Username WSL détecté: ${username}, WSL home: ${wslHome}`);
    return wslHome;
  }
  
  // Si on est sur Windows, on ne peut PAS deviner le username WSL depuis Windows
  // Le username Windows (serig) peut être DIFFÉRENT du username WSL (bopaliou)
  // Il faut utiliser une variable d'environnement pour spécifier le chemin WSL
  
  console.warn('⚠️ ATTENTION: Impossible de détecter automatiquement le username WSL depuis Windows.');
  console.warn('⚠️ Le username Windows (serig) peut être différent du username WSL (bopaliou).');
  console.warn('⚠️ RECOMMANDÉ: Définissez WSL_HOME ou WSL_USER dans votre fichier .env');
  console.warn('⚠️ Exemple: WSL_HOME=/home/bopaliou ou WSL_USER=bopaliou');
  
  // Fallback par défaut : utiliser 'bopaliou' (comme indiqué dans l'erreur de l'utilisateur)
  // MAIS c'est un fallback fragile, il vaut mieux configurer via .env
  const defaultWSLUser = 'bopaliou'; // Par défaut bopaliou comme indiqué dans l'erreur
  const wslHome = `/home/${defaultWSLUser}`;
  console.warn(`⚠️ Utilisation du chemin WSL par défaut: ${wslHome}`);
  console.warn(`⚠️ Si ce n'est pas correct, définissez WSL_HOME=/home/VOTRE_USERNAME_WSL dans votre .env`);
  
  // S'assurer que le chemin retourné est bien un chemin WSL (commence par /)
  if (!wslHome.startsWith('/')) {
    console.error(`❌ ERREUR: Le chemin WSL home ne commence pas par /: ${wslHome}`);
    throw new Error(`Le chemin WSL home doit commencer par /: ${wslHome}`);
  }
  
  return wslHome;
}

/**
 * Convertit un fichier audio en WAV si nécessaire (pour Whisper CLI)
 * @param {string} audioFilePath - Chemin du fichier audio source
 * @returns {Promise<string>} - Chemin du fichier WAV (peut être le même si déjà WAV)
 */
async function convertToWAVIfNeeded(audioFilePath) {
  const ext = path.extname(audioFilePath).toLowerCase();
  
  // Si c'est déjà un WAV, pas besoin de conversion
  if (ext === '.wav') {
    return audioFilePath;
  }

  // Formats supportés par Whisper: .wav, .mp3, .m4a, .ogg, .flac
  // Cependant, pour garantir la meilleure compatibilité, on convertit tout en WAV
  // sauf si c'est déjà du WAV
  // Formats à convertir: .m4a, .aac, .mp3, .ogg, .flac
  const needsConversion = ['.m4a', '.aac', '.mp3', '.ogg', '.flac'].includes(ext);
  
  if (!needsConversion) {
    // Si c'est déjà WAV ou un format non listé, on le laisse tel quel
    console.log(`ℹ️ Format ${ext} - pas de conversion nécessaire`);
    return audioFilePath;
  }

  console.log(`🔄 Conversion de ${ext} en WAV pour Whisper...`);
  
  // Créer un fichier temporaire WAV
  const wavPath = audioFilePath.replace(ext, '.wav');
  const wslAudioPath = convertWindowsToWSLPath(audioFilePath);
  const wslWavPath = convertWindowsToWSLPath(wavPath);

  // Vérifier si on est dans WSL
  const isInWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV || process.platform !== 'win32';
  const wslDistro = process.env.WSL_DISTRO || 'Ubuntu';
  
  // Utiliser ffmpeg pour convertir
  // ffmpeg -i input.m4a -ar 16000 -ac 1 -f wav output.wav
  // -ar 16000 : sample rate 16kHz (recommandé pour Whisper)
  // -ac 1 : mono (canal unique)
  // -f wav : format WAV
  let command;
  let commandArgs;
  
  if (isInWSL) {
    command = 'ffmpeg';
    commandArgs = [
      '-i', wslAudioPath,
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      '-y', // Overwrite output file
      wslWavPath
    ];
  } else {
    command = 'wsl';
    commandArgs = [
      '-d', wslDistro,
      'ffmpeg',
      '-i', wslAudioPath,
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      '-y',
      wslWavPath
    ];
  }

  console.log(`Commande de conversion: ${command} ${commandArgs.join(' ')}`);
  
  const result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false
  });

  if (result.error) {
    console.error('Erreur lors de la conversion:', result.error);
    throw new Error(`Erreur lors de la conversion en WAV: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || '';
    console.error(`ffmpeg a échoué avec le code ${result.status}`);
    console.error(`Stderr: ${stderr}`);
    throw new Error(`Erreur lors de la conversion en WAV. Assurez-vous que ffmpeg est installé dans WSL. Erreur: ${stderr}`);
  }

  // Vérifier que le fichier WAV a été créé
  if (!fs.existsSync(wavPath)) {
    throw new Error(`Le fichier WAV n'a pas été créé: ${wavPath}`);
  }

  console.log(`✅ Conversion réussie: ${wavPath}`);
  return wavPath;
}

/**
 * Transcription d'un fichier audio en texte utilisant Whisper.cpp local
 * @param {string} audioFilePath - Chemin local du fichier audio (.m4a, .mp3, .wav, etc.)
 * @returns {Promise<string>} - Texte transcrit
 */
async function transcribeLocalWhisper(audioFilePath) {
  let wavFilePath = audioFilePath;
  let shouldCleanupWav = false;
  
  try {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Le fichier audio n'existe pas: ${audioFilePath}`);
    }

    console.log(`Transcription locale du fichier: ${audioFilePath}`);

    // Convertir en WAV si nécessaire
    wavFilePath = await convertToWAVIfNeeded(audioFilePath);
    shouldCleanupWav = wavFilePath !== audioFilePath; // Nettoyer si on a créé un fichier temporaire

    // Obtenir les chemins WSL
    // IMPORTANT : Les chemins doivent TOUJOURS être des chemins WSL (Linux), jamais des chemins Windows
    // Permettre de surcharger via variables d'environnement
    const wslHome = getWSLHomePath();
    
    // S'assurer que les chemins sont bien des chemins WSL (commencent par /)
    // Si WHISPER_BIN_PATH est fourni mais est un chemin Windows, le convertir
    let whisperBinPath = process.env.WHISPER_BIN_PATH || `${wslHome}/whisper.cpp/build/bin/whisper-cli`;
    // Utiliser ggml-large-v3 par défaut (modèle de haute qualité)
    // Peut être surchargé via variable d'environnement WHISPER_MODEL_PATH
    let whisperModelPath = process.env.WHISPER_MODEL_PATH || `${wslHome}/whisper.cpp/models/ggml-large-v3.bin`;
    
    // Vérifier que les chemins sont bien des chemins WSL (Linux)
    // Les chemins WSL commencent par /, les chemins Windows par C:\ ou une lettre de lecteur
    if (whisperBinPath.match(/^[A-Za-z]:[\\/]/)) {
      console.error(`❌ ERREUR: WHISPER_BIN_PATH est un chemin Windows: ${whisperBinPath}`);
      console.error(`❌ Les chemins doivent être des chemins WSL (Linux), ex: /home/bopaliou/whisper.cpp/build/bin/whisper-cli`);
      throw new Error(`WHISPER_BIN_PATH doit être un chemin WSL (Linux), pas un chemin Windows: ${whisperBinPath}`);
    }
    
    if (whisperModelPath.match(/^[A-Za-z]:[\\/]/)) {
      console.error(`❌ ERREUR: WHISPER_MODEL_PATH est un chemin Windows: ${whisperModelPath}`);
      console.error(`❌ Les chemins doivent être des chemins WSL (Linux), ex: /home/bopaliou/whisper.cpp/models/ggml-base.bin`);
      throw new Error(`WHISPER_MODEL_PATH doit être un chemin WSL (Linux), pas un chemin Windows: ${whisperModelPath}`);
    }
    
    // S'assurer que les chemins commencent par /
    if (!whisperBinPath.startsWith('/')) {
      console.warn(`⚠️ Le chemin WHISPER_BIN_PATH ne commence pas par /, correction: /${whisperBinPath}`);
      whisperBinPath = '/' + whisperBinPath;
    }
    
    if (!whisperModelPath.startsWith('/')) {
      console.warn(`⚠️ Le chemin WHISPER_MODEL_PATH ne commence pas par /, correction: /${whisperModelPath}`);
      whisperModelPath = '/' + whisperModelPath;
    }

    // Convertir le chemin de l'audio en chemin WSL (utiliser le fichier WAV si conversion effectuée)
    const wslAudioPath = convertWindowsToWSLPath(wavFilePath);

    console.log(`Chemin WSL audio: ${wslAudioPath}`);
    console.log(`Binaire Whisper: ${whisperBinPath}`);
    console.log(`🎤 Modèle Whisper: ${whisperModelPath}`);
    console.log(`   (Modèle large-v3 - Qualité maximale)`);
    console.log(`WSL Home: ${wslHome}`);

    // Vérifier que le binaire existe (en essayant de l'exécuter avec --help)
    // Note: Cette vérification nécessite l'accès WSL, donc on l'ignore si on est sur Windows
    // et on laisse spawnSync gérer l'erreur si le binaire n'existe pas

    // Construire les arguments pour whisper-cli
    const args = [
      '-l', 'fr',                  // Langue française
      '-m', whisperModelPath,      // Chemin du modèle
      '-f', wslAudioPath,          // Fichier audio à transcrire
      '-otxt'                      // Sortie en fichier texte
    ];

    console.log(`Exécution: ${whisperBinPath} ${args.join(' ')}`);

    // Exécuter whisper-cli via WSL
    // Sur Windows, on doit TOUJOURS utiliser 'wsl' pour exécuter la commande dans WSL
    // Si on est déjà dans WSL (backend tourne dans WSL), exécuter directement
    let command;
    let commandArgs;
    
    // Vérifier si on est dans WSL (backend tourne dans WSL)
    const isInWSL = process.env.WSL_DISTRO_NAME || process.env.WSLENV || process.platform !== 'win32';
    
    if (isInWSL) {
      // Backend tourne dans WSL, exécuter directement
      command = whisperBinPath;
      commandArgs = args;
      console.log('Exécution directe dans WSL');
    } else {
      // Backend tourne sur Windows, utiliser wsl pour exécuter dans WSL
      // Utiliser wsl -d Ubuntu si disponible, sinon juste wsl
      const wslDistro = process.env.WSL_DISTRO || 'Ubuntu';
      command = 'wsl';
      // Passer la commande complète à WSL
      // Format: wsl -d Ubuntu whisper-cli -l fr -m model -f file -otxt
      commandArgs = ['-d', wslDistro, whisperBinPath, ...args];
      console.log(`Exécution via WSL (distribution: ${wslDistro})`);
    }

    // Exécuter la commande
    const spawnOptions = {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    };
    
    // Si on est déjà dans WSL (backend tourne dans WSL), définir le répertoire de travail
    // Réutiliser la variable isInWSL déclarée plus haut
    if (isInWSL) {
      spawnOptions.cwd = wslHome;
    }
    
    console.log(`Commande complète: ${command} ${commandArgs.join(' ')}`);
    
    // Utiliser spawn (asynchrone) au lieu de spawnSync pour éviter de bloquer
    // Le modèle large-v3 peut prendre plusieurs minutes, donc on ne peut pas bloquer le thread
    const result = await new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      console.log('🚀 Démarrage de Whisper (peut prendre plusieurs minutes avec le modèle large-v3)...');
      const whisperProcess = spawn(command, commandArgs, spawnOptions);
      
      // Timeout de 10 minutes pour le modèle large (peut être long)
      const timeoutMs = 10 * 60 * 1000; // 10 minutes
      const timeout = setTimeout(() => {
        if (whisperProcess && !whisperProcess.killed) {
          console.error('⏱️ Timeout: Whisper prend trop de temps, arrêt du processus...');
          whisperProcess.kill('SIGTERM');
          reject(new Error(`Timeout: Whisper a pris plus de ${timeoutMs / 1000 / 60} minutes. Le modèle large-v3 peut être très lent.`));
        }
      }, timeoutMs);
      
      // Capturer stdout
      whisperProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Afficher la progression en temps réel
        if (output.trim()) {
          console.log('Whisper stdout:', output.trim());
        }
      });
      
      // Capturer stderr
      whisperProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // Afficher les erreurs/warnings en temps réel
        if (output.trim()) {
          console.log('Whisper stderr:', output.trim());
        }
      });
      
      // Gérer la fin du processus
      whisperProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code !== 0) {
          console.error(`❌ Whisper a échoué avec le code ${code}`);
          console.error(`Commande exécutée: ${command} ${commandArgs.join(' ')}`);
          console.error(`Stderr: ${stderr}`);
          console.error(`Stdout: ${stdout}`);
          reject(new Error(`Whisper a échoué avec le code ${code}. Vérifiez que Whisper.cpp est installé et que les chemins sont corrects. Erreur: ${stderr || 'Aucun message d\'erreur'}`));
          return;
        }
        
        console.log('✅ Whisper terminé avec succès');
        resolve({ stdout, stderr, code });
      });
      
      // Gérer les erreurs de spawn
      whisperProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Erreur lors du lancement de Whisper:', error);
        reject(new Error(`Erreur lors de l'exécution de Whisper: ${error.message}`));
      });
    });

    // Le fichier de sortie devrait être <audioPath>.txt
    // Whisper génère le fichier au même endroit que l'audio mais avec l'extension .txt
    // Utiliser le chemin original pour le fichier .txt (pas le WAV temporaire)
    const txtPath = audioFilePath + '.txt';
    const wslTxtPath = convertWindowsToWSLPath(txtPath);

    // Essayer de lire le fichier .txt généré
    let transcriptionText = '';
    
    // Essayer d'abord avec le chemin Windows (où le fichier devrait être)
    if (fs.existsSync(txtPath)) {
      transcriptionText = fs.readFileSync(txtPath, 'utf8').trim();
      console.log(`Fichier de transcription trouvé (Windows): ${txtPath}`);
    }
    // Si on est dans WSL, essayer directement le chemin WSL
    else if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
      if (fs.existsSync(wslTxtPath)) {
        transcriptionText = fs.readFileSync(wslTxtPath, 'utf8').trim();
        console.log(`Fichier de transcription trouvé (WSL): ${wslTxtPath}`);
      }
    }
    // Essayer avec le chemin WSL converti en Windows
    else {
      const windowsTxtPath = convertWSLToWindowsPath(wslTxtPath);
      if (fs.existsSync(windowsTxtPath)) {
        transcriptionText = fs.readFileSync(windowsTxtPath, 'utf8').trim();
        console.log(`Fichier de transcription trouvé (converti): ${windowsTxtPath}`);
      }
    }

    if (!transcriptionText || transcriptionText.length === 0) {
      // Si le fichier n'existe pas, essayer de lire depuis stdout
      if (result.stdout) {
        transcriptionText = result.stdout.toString().trim();
      }
      
      if (!transcriptionText || transcriptionText.length === 0) {
        throw new Error(`Le fichier de transcription n'a pas été généré: ${txtPath}`);
      }
    }

    console.log(`✅ Transcription locale réussie (${transcriptionText.length} caractères)`);

    // Nettoyer le fichier WAV temporaire si on l'a créé
    if (shouldCleanupWav && fs.existsSync(wavFilePath)) {
      try {
        fs.unlinkSync(wavFilePath);
        console.log(`🗑️ Fichier WAV temporaire supprimé: ${wavFilePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Impossible de supprimer le fichier WAV temporaire: ${cleanupError.message}`);
      }
    }

    return transcriptionText;
  } catch (error) {
    // Nettoyer le fichier WAV temporaire même en cas d'erreur
    if (shouldCleanupWav && wavFilePath && fs.existsSync(wavFilePath)) {
      try {
        fs.unlinkSync(wavFilePath);
        console.log(`🗑️ Fichier WAV temporaire supprimé après erreur: ${wavFilePath}`);
      } catch (cleanupError) {
        console.warn(`⚠️ Impossible de supprimer le fichier WAV temporaire après erreur: ${cleanupError.message}`);
      }
    }
    
    console.error('Erreur lors de la transcription locale:', error);
    throw new Error(`Erreur de transcription locale: ${error.message}`);
  }
}

/**
 * Transcription avec format JSON (pour compatibilité avec l'ancien code)
 * @param {string} audioFilePath - Chemin local du fichier audio
 * @returns {Promise<Object>} - Transcription avec métadonnées
 */
async function transcribeLocalWhisperWithDetails(audioFilePath) {
  try {
    const text = await transcribeLocalWhisper(audioFilePath);
    
    return {
      text: text,
      language: 'fr',
      duration: null // Whisper local ne fournit pas directement la durée
    };
  } catch (error) {
    console.error('Erreur lors de la transcription locale détaillée:', error);
    throw error;
  }
}

module.exports = {
  transcribeLocalWhisper,
  transcribeLocalWhisperWithDetails
};

