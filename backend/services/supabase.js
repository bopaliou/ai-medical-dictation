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
 * Upload un fichier audio vers Supabase Storage
 * @param {string} filePath - Chemin local du fichier
 * @param {string} fileName - Nom du fichier dans le storage
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadAudio(filePath, fileName) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_AUDIO)
      .upload(fileName, fileBuffer, {
        contentType: 'audio/m4a',
        upsert: false
      });

    if (error) {
      throw new Error(`Erreur lors de l'upload audio: ${error.message}`);
    }

    // Génération de l'URL publique signée (ou privée)
    const { data: urlData } = supabase.storage
      .from(BUCKET_AUDIO)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Erreur uploadAudio:', error);
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
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_PDFS)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      throw new Error(`Erreur lors de l'upload PDF: ${error.message}`);
    }

    // Génération de l'URL publique signée
    const { data: urlData } = supabase.storage
      .from(BUCKET_PDFS)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Erreur uploadPDF:', error);
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
    // Filtrer uniquement les colonnes qui existent dans le schéma
    // Schéma: id, full_name, gender, dob, created_at
    const allowedFields = ['full_name', 'gender', 'dob'];
    const filteredData = {};
    
    for (const field of allowedFields) {
      if (patientData[field] !== undefined && patientData[field] !== null) {
        filteredData[field] = patientData[field];
      }
    }
    
    console.log('Données filtrées pour insertion:', JSON.stringify(filteredData, null, 2));
    
    const { data, error } = await supabase
      .from('patients')
      .insert([filteredData])
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du patient: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur createPatient:', error);
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
  getPatientById,
  createPatient,
  getAllPatients,
  deleteTemporaryFile,
  BUCKET_AUDIO,
  BUCKET_PDFS
};

