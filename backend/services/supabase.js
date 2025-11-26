/**
 * Service Supabase
 * Gère les interactions avec Supabase (base de données et storage)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Client Supabase avec service role key pour les opérations backend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Noms des buckets de stockage
const BUCKET_AUDIO = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio-recordings';
const BUCKET_PDFS = process.env.SUPABASE_STORAGE_BUCKET_PDFS || 'medical-notes-pdf';

/**
 * Vérifie si un bucket existe dans Supabase Storage
 * @param {string} bucketName - Nom du bucket
 * @returns {Promise<boolean>}
 */
async function bucketExists(bucketName) {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error(`Erreur lors de la vérification des buckets: ${error.message}`);
      return false;
    }
    return data.some(bucket => bucket.name === bucketName);
  } catch (error) {
    console.error(`Erreur lors de la vérification du bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Upload un fichier audio vers Supabase Storage
 * @param {string} filePath - Chemin local du fichier
 * @param {string} fileName - Nom du fichier dans le storage
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadAudio(filePath, fileName) {
  try {
    console.log(`📤 Upload audio vers Supabase Storage...`);
    console.log(`   Fichier local: ${filePath}`);
    console.log(`   Nom dans storage: ${fileName}`);
    console.log(`   Bucket: ${BUCKET_AUDIO}`);
    
    // Vérifier que le bucket existe
    const bucketExistsCheck = await bucketExists(BUCKET_AUDIO);
    if (!bucketExistsCheck) {
      console.error(`❌ Le bucket '${BUCKET_AUDIO}' n'existe pas dans Supabase Storage`);
      console.error(`   Veuillez créer le bucket dans votre projet Supabase`);
      throw new Error(`Le bucket '${BUCKET_AUDIO}' n'existe pas. Créez-le dans Supabase Storage.`);
    }
    console.log(`✅ Bucket '${BUCKET_AUDIO}' trouvé`);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier audio n'existe pas: ${filePath}`);
    }
    
    // Obtenir les stats du fichier
    const fileStats = fs.statSync(filePath);
    console.log(`   Taille: ${fileStats.size} bytes`);
    
    const fileBuffer = fs.readFileSync(filePath);
    
    // Déterminer le type MIME depuis l'extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/m4a',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg'
    };
    const contentType = mimeTypes[ext] || 'audio/mpeg';
    console.log(`   Type MIME: ${contentType}`);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_AUDIO)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: false
      });

    if (error) {
      console.error('❌ Erreur Supabase Storage:', error);
      console.error('   Code:', error.statusCode);
      console.error('   Message:', error.message);
      throw new Error(`Erreur lors de l'upload audio: ${error.message}`);
    }

    if (!data) {
      throw new Error('Aucune donnée retournée par Supabase Storage');
    }

    console.log(`✅ Upload réussi, path: ${data.path}`);

    // Génération de l'URL publique (bucket public)
    const { data: urlData } = supabase.storage
      .from(BUCKET_AUDIO)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du fichier audio');
    }

    console.log(`✅ URL publique générée: ${urlData.publicUrl.substring(0, 80)}...`);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('❌ Erreur uploadAudio:', error);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

/**
 * Upload un PDF vers Supabase Storage
 * @param {string} filePath - Chemin local du fichier PDF
 * @param {string} fileName - Nom du fichier dans le storage
 * @param {boolean} upsert - Si true, remplace le fichier existant au lieu d'échouer (défaut: false)
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadPDF(filePath, fileName, upsert = false) {
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier PDF n'existe pas: ${filePath}`);
    }

    // Vérifier que le bucket existe
    const bucketExistsCheck = await bucketExists(BUCKET_PDFS);
    if (!bucketExistsCheck) {
      const errorMessage = `Le bucket '${BUCKET_PDFS}' n'existe pas dans Supabase Storage.\n` +
        `Pour créer le bucket, exécutez: npm run setup-storage\n` +
        `Ou créez-le manuellement dans Supabase Dashboard > Storage > New bucket`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`📤 Upload PDF: ${fileName}`);
    console.log(`   Fichier local: ${filePath}`);
    console.log(`   Bucket: ${BUCKET_PDFS}`);

    // Lire le fichier
    const fileBuffer = fs.readFileSync(filePath);
    const fileSize = fileBuffer.length;
    console.log(`   Taille: ${(fileSize / 1024).toFixed(2)} KB`);

    if (fileSize === 0) {
      throw new Error('Le fichier PDF est vide');
    }
    
    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_PDFS)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: upsert // Si true, remplace le fichier existant
      });

    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw new Error(`Erreur lors de l'upload PDF: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('L\'upload a réussi mais aucune donnée n\'a été retournée');
    }

    console.log(`   ✅ Upload réussi: ${data.path}`);

    // Génération de l'URL publique (bucket public)
    const { data: urlData } = supabase.storage
      .from(BUCKET_PDFS)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du PDF');
    }

    console.log(`   ✅ URL publique générée: ${urlData.publicUrl.substring(0, 80)}...`);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('❌ Erreur uploadPDF:', error);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

/**
 * Insère une note dans la base de données
 * @param {Object} noteData - Données de la note
 * @returns {Promise<Object>}
 */
async function insertNote(noteData) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'insertion de la note: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur insertNote:', error);
    throw error;
  }
}

/**
 * Récupère les notes d'un patient
 * @param {string} patientId - ID du patient
 * @returns {Promise<Array>}
 */
async function getNotesByPatient(patientId) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des notes: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur getNotesByPatient:', error);
    throw error;
  }
}

/**
 * Récupère les notes récentes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur (created_by)
 * @param {number} limit - Nombre maximum de notes à retourner (défaut: 10)
 * @returns {Promise<Array>}
 */
async function getRecentNotesByUser(userId, limit = 10) {
  try {
    // Récupérer les notes avec jointure sur patients
    // Filtrer : seulement les notes avec PDF (rapports générés) et non supprimées
    const { data, error } = await supabase
      .from('notes')
      .select(`
        id,
        patient_id,
        created_at,
        recorded_at,
        transcription_text,
        pdf_url,
        audio_url,
        structured_json,
        status,
        patients(full_name)
      `)
      .eq('created_by', userId)
      .not('pdf_url', 'is', null) // Seulement les notes avec PDF (rapports générés)
      .neq('status', 'trash') // Exclure les rapports supprimés
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Erreur lors de la récupération des notes récentes: ${error.message}`);
    }

    // Formater les données pour faciliter l'accès côté frontend
    const formattedNotes = (data || []).map(note => ({
      ...note,
      patients: note.patients || null, // S'assurer que patients est un objet ou null
      status: note.status || 'final', // Valeur par défaut si status n'existe pas
    }));

    return formattedNotes;
  } catch (error) {
    console.error('Erreur getRecentNotesByUser:', error);
    throw error;
  }
}

/**
 * Récupère tous les rapports (notes) d'un utilisateur avec informations patient
 * @param {string} userId - ID de l'utilisateur (created_by)
 * @param {Object} options - Options de filtrage
 * @param {string} options.status - Filtrer par statut (draft, final, trash)
 * @param {number} options.limit - Nombre maximum de résultats
 * @param {number} options.offset - Offset pour la pagination
 * @returns {Promise<Array>}
 */
async function getReportsByUser(userId, options = {}) {
  try {
    const { status, limit, offset = 0 } = options;

    // Construire la requête - seulement les notes avec pdf_url (rapports générés)
    let query = supabase
      .from('notes')
      .select(`
        id,
        patient_id,
        created_at,
        recorded_at,
        pdf_url,
        audio_url,
        status,
        structured_json,
        patients(
          id,
          full_name,
          gender,
          dob
        )
      `)
      .eq('created_by', userId)
      .not('pdf_url', 'is', null) // Seulement les notes avec PDF (rapports générés)
      .order('created_at', { ascending: false });

    // Filtrer par statut si fourni
    if (status) {
      query = query.eq('status', status);
    }
    // Si status n'est pas fourni, on retourne tous les rapports (y compris trash et null)

    // Limiter les résultats si fourni
    if (limit) {
      query = query.limit(limit);
    }

    // Offset pour pagination
    if (offset > 0) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des rapports: ${error.message}`);
    }

    // Formater les données
    const formattedReports = (data || []).map(report => ({
      id: report.id,
      patient_id: report.patient_id,
      pdf_url: report.pdf_url,
      created_at: report.created_at,
      recorded_at: report.recorded_at,
      status: report.status || 'final', // Valeur par défaut
      patient: report.patients ? {
        id: report.patients.id,
        full_name: report.patients.full_name,
        gender: report.patients.gender,
        dob: report.patients.dob,
      } : null,
    }));

    return formattedReports;
  } catch (error) {
    console.error('Erreur getReportsByUser:', error);
    throw error;
  }
}

/**
 * Récupère un patient par ID
 * @param {string} patientId - ID du patient
 * @returns {Promise<Object>}
 */
async function getPatientById(patientId) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération du patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur getPatientById:', error);
    throw error;
  }
}

/**
 * Crée un nouveau patient
 * @param {Object} patientData - Données du patient
 * @returns {Promise<Object>}
 */
async function createPatient(patientData) {
  try {
    // Colonnes de base qui existent toujours dans le schéma
    const baseFields = ['full_name', 'gender', 'dob'];
    // Colonnes optionnelles qui peuvent ne pas exister si la migration n'a pas été exécutée
    const optionalFields = ['age', 'room_number', 'unit'];
    
    // Première tentative : avec tous les champs
    let filteredData = {};
    
    // Ajouter les champs de base
    for (const field of baseFields) {
      if (patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== '') {
        filteredData[field] = patientData[field];
      }
    }
    
    // Ajouter les champs optionnels
    for (const field of optionalFields) {
      if (patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== '') {
        filteredData[field] = patientData[field];
      }
    }
    
    console.log('📝 Données filtrées pour insertion:', JSON.stringify(filteredData, null, 2));
    console.log('🔑 Utilisation du service role key (RLS bypassé)');
    
    let { data, error } = await supabase
      .from('patients')
      .insert([filteredData])
      .select()
      .single();
    
    console.log('📡 Réponse Supabase - Error:', error ? JSON.stringify(error, null, 2) : 'null');
    console.log('📡 Réponse Supabase - Data:', data ? 'Patient créé' : 'null');

    // Si erreur liée à une colonne manquante, réessayer avec seulement les colonnes de base
    if (error && (error.message?.includes('column') || error.message?.includes('does not exist') || error.code === '42703')) {
      console.warn('⚠️ Colonnes optionnelles non disponibles, réessai avec colonnes de base uniquement');
      
      // Réessayer avec seulement les colonnes de base
      filteredData = {};
      for (const field of baseFields) {
        if (patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== '') {
          filteredData[field] = patientData[field];
        }
      }
      
      console.log('📝 Réessai avec données de base uniquement:', JSON.stringify(filteredData, null, 2));
      
      const retryResult = await supabase
        .from('patients')
        .insert([filteredData])
        .select()
        .single();
      
      if (retryResult.error) {
        error = retryResult.error;
      } else {
        data = retryResult.data;
        error = null;
        console.log('✅ Patient créé avec colonnes de base uniquement (migration non exécutée)');
      }
    }

    if (error) {
      console.error('❌ Erreur Supabase lors de la création du patient:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      console.error('   Erreur complète:', JSON.stringify(error, null, 2));
      console.error('   Données tentées:', JSON.stringify(filteredData, null, 2));
      console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'Défini' : 'MANQUANT');
      console.error('   SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Défini (premiers 20): ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'MANQUANT');
      
      // Si l'erreur indique qu'une colonne n'existe pas, suggérer d'exécuter la migration
      if (error.message && (error.message.includes('column') || error.message.includes('does not exist') || error.code === '42703')) {
        throw new Error(`Colonne manquante dans la base de données. Veuillez exécuter la migration: backend/migrations/add_patient_fields.sql. Erreur: ${error.message}`);
      }
      
      // Si erreur RLS (permission denied)
      if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        throw new Error(`Erreur de permissions (RLS). Le service role key devrait bypasser RLS. Vérifiez SUPABASE_SERVICE_ROLE_KEY. Erreur: ${error.message}`);
      }
      
      throw new Error(`Erreur lors de la création du patient: ${error.message || 'Erreur inconnue'}`);
    }

    console.log('✅ Patient créé avec succès:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Erreur createPatient:', error);
    throw error;
  }
}

/**
 * Récupère une note par son ID
 * @param {string} noteId - ID de la note
 * @returns {Promise<Object|null>}
 */
async function getNoteById(noteId) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucune note trouvée
        return null;
      }
      throw new Error(`Erreur lors de la récupération de la note: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur getNoteById:', error);
    throw error;
  }
}

/**
 * Met à jour une note existante
 * @param {string} noteId - ID de la note
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>}
 */
/**
 * Normalise une URL publique Supabase pour extraire le bucket et le path
 * 
 * Cette fonction est idempotente et tolérante aux différents formats d'URL :
 * - Format public: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
 * - Format signé: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]?token=...
 * 
 * Raison d'être : Les fichiers peuvent être supprimés manuellement depuis Supabase UI,
 * donc les URLs peuvent être invalides ou les fichiers absents. Cette fonction permet
 * d'extraire le path de manière robuste pour une suppression idempotente.
 * 
 * @param {string} url - URL complète du fichier (publique ou signée)
 * @returns {{bucket: string, path: string} | null} - Objet avec bucket et path, ou null si l'URL est invalide
 */
function normalizePathFromPublicUrl(url) {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return null;
    }

    // Méthode 1: Utiliser l'API URL pour parser proprement
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Pattern: /storage/v1/object/public/[bucket]/[path] ou /storage/v1/object/sign/[bucket]/[path]
      const match = pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      
      if (match) {
        return {
          bucket: match[1],
          path: decodeURIComponent(match[2])
        };
      }
    } catch (urlError) {
      // Si l'URL n'est pas valide, essayer la méthode par split
    }

    // Méthode 2: Split manuel (fallback)
    const urlParts = url.split('/storage/v1/object/');
    if (urlParts.length < 2) {
      return null;
    }

    const pathAfterObject = urlParts[1].split('?')[0]; // Enlever les query params
    let pathParts;
    
    if (pathAfterObject.startsWith('public/')) {
      pathParts = pathAfterObject.replace('public/', '').split('/');
    } else if (pathAfterObject.startsWith('sign/')) {
      pathParts = pathAfterObject.replace('sign/', '').split('/');
    } else {
      return null;
    }

    if (pathParts.length < 2) {
      return null;
    }

    return {
      bucket: pathParts[0],
      path: pathParts.slice(1).join('/')
    };
  } catch (error) {
    return null;
  }
}

/**
 * Supprime un fichier du storage Supabase de manière idempotente
 * 
 * Cette fonction est idempotente : elle ne lève pas d'exception si le fichier est absent.
 * Cela permet de :
 * - Réessayer la suppression sans erreur si le fichier a déjà été supprimé
 * - Gérer les cas où le fichier a été supprimé manuellement depuis Supabase UI
 * - Éviter les erreurs lors de la suppression de rapports déjà partiellement supprimés
 * 
 * @param {string} bucket - Nom du bucket (ex: 'medical-notes-pdf', 'audio-recordings')
 * @param {string} filePath - Chemin du fichier dans le bucket (ex: 'pdfs/patient-id/file.pdf')
 * @returns {Promise<{success: boolean, message: string}>} - Résultat de la suppression
 */
async function removeFileIfExists(bucket, filePath) {
  try {
    if (!bucket || typeof bucket !== 'string' || bucket.trim() === '') {
      return { success: false, message: 'Bucket invalide' };
    }

    if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
      return { success: false, message: 'Path invalide' };
    }

    console.log(`🗑️ Tentative de suppression: ${bucket}/${filePath}`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      // Erreurs tolérées (fichier déjà supprimé, non trouvé, etc.)
      const errorMessage = error.message || String(error);
      const isNotFound = errorMessage.toLowerCase().includes('not found') ||
                        errorMessage.toLowerCase().includes('does not exist') ||
                        errorMessage.toLowerCase().includes('no such file') ||
                        error.statusCode === 404;

      if (isNotFound) {
        console.log(`   ℹ️  Fichier déjà absent: ${bucket}/${filePath} (suppression idempotente OK)`);
        return { success: true, message: 'Fichier déjà absent (idempotent)' };
      } else {
        console.warn(`   ⚠️  Erreur lors de la suppression (non bloquant): ${errorMessage}`);
        return { success: false, message: errorMessage };
      }
    }

    // Succès
    console.log(`   ✅ Fichier supprimé: ${bucket}/${filePath}`);
    return { success: true, message: 'Fichier supprimé avec succès' };

  } catch (error) {
    // Erreur inattendue (réseau, timeout, etc.) - loguer mais ne pas bloquer
    console.warn(`   ⚠️  Exception lors de la suppression (non bloquant): ${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * Supprime un fichier du storage Supabase (générique pour PDF ou audio)
 * @param {string} fileUrl - URL complète du fichier
 * @param {string} fileType - Type de fichier ('pdf' ou 'audio') pour les logs
 * @returns {Promise<void>}
 * @deprecated Utiliser removeFileIfExists() avec normalizePathFromPublicUrl() à la place
 */
async function deleteFileFromStorage(fileUrl, fileType = 'fichier') {
  try {
    if (!fileUrl || typeof fileUrl !== 'string' || fileUrl.trim() === '') {
      return;
    }

    const normalized = normalizePathFromPublicUrl(fileUrl);
    if (!normalized) {
      console.warn(`⚠️ Format d'URL ${fileType} non reconnu: ${fileUrl.substring(0, 80)}...`);
      return;
    }

    await removeFileIfExists(normalized.bucket, normalized.path);
  } catch (error) {
    console.warn(`⚠️ Erreur lors de la suppression du ${fileType} (non bloquant): ${error.message}`);
  }
}

/**
 * Supprime un fichier PDF du storage Supabase
 * @param {string} pdfUrl - URL complète du PDF
 * @returns {Promise<void>}
 */
async function deletePDFFromStorage(pdfUrl) {
  if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
    return; // Ignorer silencieusement si pas d'URL
  }
  return deleteFileFromStorage(pdfUrl, 'PDF');
}

/**
 * Supprime un fichier audio du storage Supabase
 * @param {string} audioUrl - URL complète de l'audio
 * @returns {Promise<void>}
 */
async function deleteAudioFromStorage(audioUrl) {
  if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
    return; // Ignorer silencieusement si pas d'URL
  }
  return deleteFileFromStorage(audioUrl, 'audio');
}

/**
 * Crée une URL publique pour un fichier PDF à partir de son path
 * @param {string} filePath - Chemin du fichier dans le bucket (ex: "pdfs/patient-id/timestamp-note.pdf")
 * @param {number} expiresIn - Non utilisé (conservé pour compatibilité, les buckets publics n'expirent pas)
 * @returns {Promise<string>} - URL publique
 */
async function createSignedUrlForPDF(filePath, expiresIn = 31536000) {
  try {
    console.log(`🔗 Génération d'URL publique pour PDF: ${filePath}`);
    
    // Les buckets sont maintenant publics, utiliser getPublicUrl()
    const { data: urlData } = supabase.storage
      .from(BUCKET_PDFS)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du PDF');
    }

    console.log(`✅ URL publique générée: ${urlData.publicUrl.substring(0, 80)}...`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Erreur createSignedUrlForPDF:', error);
    throw error;
  }
}

/**
 * Supprime un rapport et tous ses fichiers associés de manière idempotente
 * 
 * Cette fonction est idempotente : elle peut être appelée plusieurs fois sans erreur,
 * même si le rapport ou les fichiers ont déjà été supprimés. Cela permet de :
 * - Réessayer la suppression sans erreur en cas d'échec partiel
 * - Gérer les cas où les fichiers ont été supprimés manuellement depuis Supabase UI
 * - Éviter les erreurs lors de la suppression de rapports déjà partiellement supprimés
 * 
 * Supprime automatiquement :
 * - Le PDF associé dans Supabase Storage (si présent, idempotent)
 * - Le fichier audio associé dans Supabase Storage (si présent, idempotent)
 * - Les entrées notes_audit liées (via ON DELETE CASCADE)
 * - La note elle-même de la base de données
 * 
 * @param {string} noteId - ID de la note à supprimer
 * @returns {Promise<{success: boolean, deleted: {note: boolean, pdf: boolean, audio: boolean, audit: boolean}}>}
 * @throws {Error} Seulement si la note existe mais ne peut pas être supprimée (contrainte FK, etc.)
 */
async function deleteReportAndFiles(noteId) {
  const result = {
    success: false,
    deleted: {
      note: false,
      pdf: false,
      audio: false,
      audit: false
    }
  };

  try {
    // Validation de l'ID
    if (!noteId || typeof noteId !== 'string' || noteId.trim() === '') {
      throw new Error('ID de note invalide');
    }

    console.log(`🗑️ Suppression idempotente du rapport: ${noteId}`);

    // CAS 1: Récupérer la note pour obtenir les URLs des fichiers
    let note = null;
    let pdfUrl = null;
    let audioUrl = null;

    try {
      note = await getNoteById(noteId);
      if (note) {
        pdfUrl = note.pdf_url || null;
        audioUrl = note.audio_url || null;
        console.log(`   📋 Note trouvée:`, {
          id: note.id,
          pdf_url: pdfUrl ? 'présent' : 'absent',
          audio_url: audioUrl ? 'présent' : 'absent'
        });
      } else {
        console.log(`   ℹ️  Note non trouvée (déjà supprimée ?): ${noteId}`);
      }
    } catch (error) {
      console.log(`   ℹ️  Erreur lors de la récupération de la note (peut être déjà supprimée): ${error.message}`);
      // Continuer quand même pour nettoyer les fichiers si on a les URLs ailleurs
    }

    // CAS 2: Supprimer le PDF du storage (idempotent)
    if (pdfUrl) {
      const normalized = normalizePathFromPublicUrl(pdfUrl);
      if (normalized) {
        const pdfResult = await removeFileIfExists(normalized.bucket, normalized.path);
        result.deleted.pdf = pdfResult.success;
        console.log(`   ${pdfResult.success ? '✅' : '⚠️'} PDF: ${pdfResult.message}`);
      } else {
        console.warn(`   ⚠️  Impossible d'extraire le path du PDF depuis l'URL: ${pdfUrl.substring(0, 80)}...`);
      }
    } else {
      console.log(`   ℹ️  Pas de PDF à supprimer (URL absente)`);
    }

    // CAS 3: Supprimer l'audio du storage (idempotent)
    if (audioUrl) {
      const normalized = normalizePathFromPublicUrl(audioUrl);
      if (normalized) {
        const audioResult = await removeFileIfExists(normalized.bucket, normalized.path);
        result.deleted.audio = audioResult.success;
        console.log(`   ${audioResult.success ? '✅' : '⚠️'} Audio: ${audioResult.message}`);
      } else {
        console.warn(`   ⚠️  Impossible d'extraire le path de l'audio depuis l'URL: ${audioUrl.substring(0, 80)}...`);
      }
    } else {
      console.log(`   ℹ️  Pas d'audio à supprimer (URL absente)`);
    }

    // CAS 4: Supprimer les notes_audit manuellement (idempotent, même si CASCADE le fait aussi)
    try {
      const { error: auditError } = await supabase
        .from('notes_audit')
        .delete()
        .eq('note_id', noteId);

      if (auditError) {
        // Erreur non bloquante - CASCADE le fera de toute façon
        console.log(`   ℹ️  Erreur lors de la suppression des audits (non bloquant, CASCADE s'en chargera): ${auditError.message}`);
      } else {
        result.deleted.audit = true;
        console.log(`   ✅ Notes_audit supprimées`);
      }
    } catch (error) {
      console.log(`   ℹ️  Exception lors de la suppression des audits (non bloquant): ${error.message}`);
    }

    // CAS 5: Supprimer la note de la base de données
    // Si la note n'existe pas, c'est OK (idempotent)
    const { error: noteError, data } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .select();

    if (noteError) {
      // Si l'erreur est liée à la contrainte de clé étrangère,
      // cela signifie que la migration SQL n'a pas été appliquée.
      if (noteError.message && noteError.message.includes('notes_audit_note_id_fkey')) {
        throw new Error(
          `Erreur de contrainte FK: La migration SQL n'a pas été appliquée. ` +
          `Veuillez exécuter: supabase/migrations/fix_audit_trigger_on_delete.sql`
        );
      }
      throw new Error(`Erreur lors de la suppression de la note: ${noteError.message}`);
    }

    // Vérifier si la note a été supprimée
    if (data && data.length > 0) {
      result.deleted.note = true;
      console.log(`   ✅ Note supprimée de la base de données`);
    } else {
      console.log(`   ℹ️  Note non trouvée ou déjà supprimée (idempotent OK)`);
      // C'est OK si la note n'existe pas - c'est idempotent
    }

    result.success = true;
    console.log(`✅ Suppression idempotente terminée: ${noteId}`, result.deleted);
    return result;

  } catch (error) {
    console.error(`❌ Erreur lors de la suppression du rapport: ${error.message}`);
    throw error;
  }
}

/**
 * Supprime une note (hard delete)
 * 
 * @deprecated Utiliser deleteReportAndFiles() à la place pour une suppression idempotente
 * @param {string} noteId - ID de la note à supprimer
 * @param {boolean} deleteFiles - Si true, supprime aussi le PDF et l'audio du storage (défaut: true)
 * @returns {Promise<void>}
 * @throws {Error} Si la note n'existe pas ou si la suppression échoue
 */
async function deleteNote(noteId, deleteFiles = true) {
  // Déléguer à deleteReportAndFiles pour la compatibilité
  const result = await deleteReportAndFiles(noteId);
  if (!result.success) {
    throw new Error('Échec de la suppression de la note');
  }
}

/**
 * Met à jour une note existante
 * @param {string} noteId - ID de la note
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>}
 */
async function updateNote(noteId, updates) {
  try {
    // Ne pas inclure updated_at car la colonne n'existe pas dans la table notes
    // Si vous voulez ajouter cette colonne, exécutez :
    // ALTER TABLE notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    const updatePayload = { ...updates };
    
    const { data, error } = await supabase
      .from('notes')
      .update(updatePayload)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de la note: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur updateNote:', error);
    throw error;
  }
}

/**
 * Récupère tous les patients
 * @returns {Promise<Array>}
 */
async function getAllPatients() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des patients: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur getAllPatients:', error);
    throw error;
  }
}

/**
 * Recherche des patients par nom (autocomplete)
 * @param {string} query - Terme de recherche
 * @param {number} limit - Nombre maximum de résultats (défaut: 20)
 * @returns {Promise<Array>}
 */
async function searchPatients(query, limit = 20) {
  try {
    // Colonnes de base qui existent toujours
    const baseColumns = 'id, full_name, gender, dob';
    // Colonnes optionnelles qui peuvent ne pas exister
    const optionalColumns = ', age, room_number, unit';
    
    // Essayer d'abord avec toutes les colonnes
    let selectColumns = baseColumns + optionalColumns;
    
    if (!query || query.trim().length === 0) {
      // Si pas de query, retourner les patients récents
      let { data, error } = await supabase
        .from('patients')
        .select(selectColumns)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Si erreur de colonne manquante, réessayer avec colonnes de base uniquement
      if (error && (error.message?.includes('column') || error.message?.includes('does not exist') || error.code === '42703')) {
        console.warn('⚠️ Colonnes optionnelles non disponibles dans searchPatients, utilisation des colonnes de base');
        selectColumns = baseColumns;
        const retryResult = await supabase
          .from('patients')
          .select(selectColumns)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (retryResult.error) {
          error = retryResult.error;
        } else {
          data = retryResult.data;
          error = null;
        }
      }

      if (error) {
        throw new Error(`Erreur lors de la recherche de patients: ${error.message}`);
      }

      return data || [];
    }

    const searchTerm = query.trim().toLowerCase();
    
    // Recherche par nom (ilike pour insensible à la casse)
    let { data, error } = await supabase
      .from('patients')
      .select(selectColumns)
      .ilike('full_name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Si erreur de colonne manquante, réessayer avec colonnes de base uniquement
    if (error && (error.message?.includes('column') || error.message?.includes('does not exist') || error.code === '42703')) {
      console.warn('⚠️ Colonnes optionnelles non disponibles dans searchPatients, utilisation des colonnes de base');
      selectColumns = baseColumns;
      const retryResult = await supabase
        .from('patients')
        .select(selectColumns)
        .ilike('full_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (retryResult.error) {
        error = retryResult.error;
      } else {
        data = retryResult.data;
        error = null;
      }
    }

    if (error) {
      throw new Error(`Erreur lors de la recherche de patients: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Erreur searchPatients:', error);
    throw error;
  }
}

/**
 * Supprime un fichier temporaire
 * @param {string} filePath - Chemin du fichier à supprimer
 */
function deleteTemporaryFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${filePath}:`, error);
  }
}

module.exports = {
  supabase,
  uploadAudio,
  uploadPDF,
  insertNote,
  getNotesByPatient,
  getRecentNotesByUser,
  getReportsByUser,
  getNoteById,
  updateNote,
  deleteNote,
  deleteReportAndFiles,
  removeFileIfExists,
  normalizePathFromPublicUrl,
  deletePDFFromStorage,
  deleteAudioFromStorage,
  createSignedUrlForPDF,
  getPatientById,
  createPatient,
  getAllPatients,
  searchPatients,
  deleteTemporaryFile,
  BUCKET_AUDIO,
  BUCKET_PDFS
};

