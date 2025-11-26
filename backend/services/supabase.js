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

    // Génération de l'URL publique signée (ou privée)
    const { data: urlData } = supabase.storage
      .from(BUCKET_AUDIO)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du fichier audio');
    }

    console.log(`✅ URL publique générée: ${urlData.publicUrl}`);

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
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadPDF(filePath, fileName) {
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
        upsert: false
      });

    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw new Error(`Erreur lors de l'upload PDF: ${error.message}`);
    }

    if (!data || !data.path) {
      throw new Error('L\'upload a réussi mais aucune donnée n\'a été retournée');
    }

    console.log(`   ✅ Upload réussi: ${data.path}`);

    // Génération de l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_PDFS)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Impossible de générer l\'URL publique du PDF');
    }

    console.log(`   ✅ URL publique: ${urlData.publicUrl}`);

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
 * Supprime un fichier PDF du storage Supabase
 * @param {string} pdfUrl - URL complète du PDF
 * @returns {Promise<void>}
 */
async function deletePDFFromStorage(pdfUrl) {
  try {
    if (!pdfUrl) {
      console.log('⚠️ Aucune URL PDF fournie, skip suppression storage');
      return;
    }

    // Extraire le chemin du fichier depuis l'URL
    // Format URL: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = pdfUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      console.warn('⚠️ Format d\'URL PDF non reconnu:', pdfUrl);
      return;
    }

    const pathParts = urlParts[1].split('/');
    const bucketName = pathParts[0];
    const filePath = pathParts.slice(1).join('/');

    console.log(`🗑️ Suppression du PDF du storage: ${bucketName}/${filePath}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      // Ne pas faire échouer la suppression de la note si le PDF n'existe pas
      console.warn('⚠️ Erreur lors de la suppression du PDF du storage (non bloquant):', error.message);
    } else {
      console.log(`✅ PDF supprimé du storage: ${filePath}`);
    }
  } catch (error) {
    // Ne pas faire échouer la suppression de la note si le PDF ne peut pas être supprimé
    console.warn('⚠️ Erreur lors de la suppression du PDF du storage (non bloquant):', error.message);
  }
}

/**
 * Supprime une note (soft delete ou hard delete)
 * @param {string} noteId - ID de la note à supprimer
 * @param {boolean} deletePDF - Si true, supprime aussi le PDF du storage (défaut: true)
 * @returns {Promise<void>}
 */
async function deleteNote(noteId, deletePDF = true) {
  try {
    console.log(`🗑️ Suppression de la note: ${noteId}`);

    // Récupérer la note pour obtenir l'URL du PDF
    let pdfUrl = null;
    if (deletePDF) {
      const note = await getNoteById(noteId);
      if (note && note.pdf_url) {
        pdfUrl = note.pdf_url;
      }
    }
    
    // Supprimer la note de la base de données
    // NOTE: Avec ON DELETE CASCADE sur la contrainte FK notes_audit_note_id_fkey,
    // tous les audits associés seront automatiquement supprimés par la base de données.
    // Le trigger BEFORE DELETE insère un audit de suppression juste avant la suppression,
    // mais cet audit sera aussi supprimé par CASCADE (comportement souhaité).
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      // Si l'erreur est liée à la contrainte de clé étrangère,
      // cela signifie que la migration SQL n'a pas été appliquée.
      if (error.message && error.message.includes('notes_audit_note_id_fkey')) {
        console.error(`❌ Erreur de contrainte FK détectée.`);
        console.error(`❌ La migration SQL n'a pas été appliquée.`);
        console.error(`❌ Veuillez exécuter: supabase/migrations/fix_audit_trigger_on_delete.sql`);
        console.error(`❌ Dans Supabase Dashboard > SQL Editor`);
        throw new Error(
          `Erreur lors de la suppression de la note: ${error.message}\n` +
          `SOLUTION: Appliquez la migration SQL dans Supabase Dashboard > SQL Editor:\n` +
          `Fichier: supabase/migrations/fix_audit_trigger_on_delete.sql\n` +
          `Cette migration recrée la contrainte FK avec ON DELETE CASCADE.`
        );
      } else {
        throw new Error(`Erreur lors de la suppression de la note: ${error.message}`);
      }
    } else {
      console.log(`✅ Note supprimée de la base de données (les audits associés ont été supprimés automatiquement par CASCADE)`);
    }

    // Supprimer le PDF du storage si demandé
    if (deletePDF && pdfUrl) {
      await deletePDFFromStorage(pdfUrl);
    }

    console.log(`✅ Note supprimée avec succès: ${noteId}`);
  } catch (error) {
    console.error('Erreur deleteNote:', error);
    throw error;
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
  deletePDFFromStorage,
  getPatientById,
  createPatient,
  getAllPatients,
  searchPatients,
  deleteTemporaryFile,
  BUCKET_AUDIO,
  BUCKET_PDFS
};

