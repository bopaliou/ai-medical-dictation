/**
 * Route d'upload audio
 * POST /api/upload-audio
 * Pipeline complet: upload → transcription → structuration → PDF → stockage
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const { authenticate, authorize } = require('../middleware/auth');
const { transcribeAudio } = require('../services/transcription');
const { structureSOAPIE } = require('../services/structuring');
const { generatePDF } = require('../services/pdfGenerator');
const {
  uploadAudio,
  uploadPDF,
  insertNote,
  getPatientById,
  createPatient,
  deleteTemporaryFile
} = require('../services/supabase');

const router = express.Router();

// Route GET pour informer sur l'utilisation de l'endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Endpoint d\'upload audio',
    method: 'POST',
    path: '/api/upload/audio',
    description: 'Upload un fichier audio (.m4a) avec patient_id et user_id',
    requiredFields: ['audio', 'patient_id', 'user_id']
  });
});

// Configuration multer pour l'upload temporaire
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers audio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio sont autorisés'), false);
    }
  }
});

/**
 * @swagger
 * /api/upload/audio:
 *   post:
 *     summary: Upload un fichier audio et génère automatiquement transcription, structuration et PDF
 *     description: |
 *       Upload un fichier audio pour créer une note médicale. 
 *       Si `patient_id` n'est pas fourni, un nouveau patient sera créé automatiquement 
 *       à partir des informations extraites de la transcription audio.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Fichier audio (.m4a, .mp3, .wav, etc.)
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID du patient (optionnel - si non fourni, un patient sera créé depuis l'audio)
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de l'utilisateur (optionnel - utilise l'utilisateur authentifié par défaut)
 *               recorded_at:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'enregistrement (optionnel - utilise la date actuelle par défaut)
 *     responses:
 *       200:
 *         description: Note créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *                 patient_created:
 *                   type: boolean
 *                   description: Indique si un nouveau patient a été créé
 *                   example: false
 *       400:
 *         description: Paramètres invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Patient non trouvé (si patient_id fourni mais inexistant)
 *       500:
 *         description: Erreur serveur
 */
router.post('/audio', authenticate, authorize(['nurse', 'admin']), upload.single('audio'), async (req, res) => {
  let audioFilePath = null;

  try {
    // Validation des paramètres
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier audio manquant' });
    }

    const { patient_id, user_id, recorded_at } = req.body;
    
    // Récupérer les données patient si fournies (format: patient[full_name], patient[age], etc.)
    let patientData = null;
    if (req.body['patient[full_name]'] || req.body['patient[age]'] || req.body['patient[gender]'] || 
        req.body['patient[room_number]'] || req.body['patient[unit]']) {
      patientData = {
        full_name: req.body['patient[full_name]'] || null,
        age: req.body['patient[age]'] || null,
        gender: req.body['patient[gender]'] || null,
        room_number: req.body['patient[room_number]'] || null,
        unit: req.body['patient[unit]'] || null
      };
    }

    // user_id n'est plus nécessaire car on utilise req.user.id
    audioFilePath = req.file.path;
    const recordedAt = recorded_at ? new Date(recorded_at) : new Date();
    const userId = req.user.id;

    let patient;
    let patient_id_final = null; // Initialiser à null pour détecter les cas non initialisés
    let patient_created = false;

    // Si patient_id est fourni, vérifier qu'il existe
    if (patient_id) {
      console.log(`Upload audio reçu pour patient existant: ${patient_id}`);
      try {
        patient = await getPatientById(patient_id);
        patient_id_final = patient_id;
      } catch (error) {
        return res.status(404).json({ error: 'Patient non trouvé' });
      }
    } else if (patientData && patientData.full_name && patientData.full_name.trim()) {
      // Si des données patient sont fournies mais pas de patient_id, créer le patient
      console.log('Création du patient depuis les données fournies...');
      try {
        patient = await createPatient(patientData);
        patient_id_final = patient.id;
        patient_created = true;
        console.log(`✅ Patient créé: ${patient_id_final} - ${patient.full_name}`);
      } catch (error) {
        console.error('Erreur lors de la création du patient:', error);
        // Ne pas continuer si la création échoue - on attendra l'extraction depuis l'audio
        // patient_id_final reste null, sera défini plus tard lors de l'extraction
        console.log('⚠️ Continuation sans patient - extraction depuis l\'audio...');
      }
    } else {
      console.log('Upload audio sans patient_id ni données patient - extraction depuis l\'audio...');
    }

    // Étape 1: Transcription via Whisper
    console.log('Étape 1: Transcription...');
    let transcriptionText = await transcribeAudio(audioFilePath);
    
    // Vérifier que la transcription a retourné du texte
    if (!transcriptionText || transcriptionText.trim().length === 0) {
      console.error('❌ ERREUR: La transcription est vide');
      return res.status(400).json({
        error: 'TRANSCRIPTION_EMPTY',
        message: 'La transcription audio a échoué ou est vide. Vérifiez que le fichier audio contient de la parole.',
        details: 'Le fichier audio n\'a pas pu être transcrit. Assurez-vous que le fichier contient de la parole audible.'
      });
    }
    
    console.log(`✅ Transcription réussie (${transcriptionText.length} caractères)`);
    console.log(`📝 Aperçu transcription: ${transcriptionText.substring(0, 200)}...`);

    // Étape 1.5: Nettoyage de la transcription (correction fautes courantes)
    const { cleanTranscription } = require('../services/cleanTranscription');
    const originalLength = transcriptionText.length;
    transcriptionText = cleanTranscription(transcriptionText);
    if (transcriptionText.length !== originalLength) {
      console.log('📝 Transcription nettoyée (corrections appliquées)');
    }

    // Étape 2: Structuration SOAPIE via Gemini (utilise transcriptionText nettoyé de Whisper)
    console.log('Étape 2: Structuration SOAPIE...');
    console.log(`📋 Longueur du texte à structurer: ${transcriptionText.length} caractères`);
    let structuredJson;
    try {
      structuredJson = await structureSOAPIE(transcriptionText);
      
      // Validation que structuredJson contient patient et soapie
      if (!structuredJson || (!structuredJson.patient && !structuredJson.soapie)) {
        throw new Error('La structuration n\'a pas retourné de données patient ou soapie valides');
      }
      
      // Vérifier si les données sont vides (tous les champs sont vides)
      const hasPatientData = structuredJson.patient && (
        structuredJson.patient.full_name?.trim() ||
        structuredJson.patient.age?.trim() ||
        structuredJson.patient.gender?.trim()
      );
      
      const hasSOAPIEData = structuredJson.soapie && (
        structuredJson.soapie.S?.trim() ||
        structuredJson.soapie.A?.trim() ||
        structuredJson.soapie.I?.length > 0 ||
        structuredJson.soapie.E?.trim() ||
        structuredJson.soapie.P?.trim() ||
        structuredJson.soapie.O?.exam?.trim() ||
        structuredJson.soapie.O?.labs?.trim() ||
        (structuredJson.soapie.O?.medications && structuredJson.soapie.O.medications.length > 0)
      );
      
      if (!hasPatientData && !hasSOAPIEData) {
        console.warn('⚠️ ATTENTION: La structuration a retourné un objet vide (tous les champs sont vides)');
        console.warn('⚠️ Cela peut indiquer que:');
        console.warn('   1. La transcription est de mauvaise qualité');
        console.warn('   2. Le modèle Gemini n\'a pas pu extraire d\'informations');
        console.warn('   3. Le prompt système est trop strict');
        console.warn(`📝 Transcription originale (${transcriptionText.length} caractères):`);
        console.warn(transcriptionText.substring(0, 500));
      }
      
      console.log('✅ Structuration réussie');
      console.log('Patient extrait:', structuredJson.patient?.full_name || '(non identifié)');
      console.log('SOAPIE présent:', !!structuredJson.soapie);
      console.log('Données patient présentes:', hasPatientData);
      console.log('Données SOAPIE présentes:', hasSOAPIEData);
    } catch (structError) {
      console.error('❌ Erreur lors de la structuration SOAPIE:', structError);
      
      // Vérifier si c'est une erreur 503 (overloaded)
      const isOverloaded = structError.message?.includes('503') || 
                          structError.message?.includes('overloaded') || 
                          structError.message?.includes('UNAVAILABLE') ||
                          structError.status === 503;
      
      // Extraire le raw output si disponible dans l'erreur
      const rawSnippet = structError.rawSnippet || structError.message?.substring(0, 500) || 'Non disponible';
      
      // Si c'est une erreur 503, retourner un structured_json minimal pour permettre la continuation
      if (isOverloaded) {
        console.warn('⚠️ Modèle Gemini surchargé (503). Retour d\'un structured_json minimal.');
        structuredJson = {
          patient: {
            full_name: '',
            age: '',
            gender: '',
            room_number: '',
            unit: ''
          },
          soapie: {
            S: '',
            O: {
              vitals: {
                temperature: '',
                blood_pressure: '',
                heart_rate: '',
                respiratory_rate: '',
                spo2: '',
                glycemia: ''
              },
              exam: '',
              labs: '',
              medications: []
            },
            A: '',
            I: [],
            E: '',
            P: ''
          }
        };
        console.log('✅ Structured_json minimal créé pour permettre la continuation manuelle');
        // Continuer avec le structured_json minimal au lieu de retourner une erreur
      } else {
        // Autre erreur, retourner une erreur 400
        return res.status(400).json({
          error: 'STRUCTURATION_FAILED',
          message: 'Échec de la structuration SOAPIE. Le modèle n\'a pas retourné de JSON valide.',
          details: structError.message,
          rawModelOutput: rawSnippet
        });
      }
    }
    
    // Si patient_id n'était pas fourni, créer un patient depuis les informations extraites
    if (!patient_id) {
      console.log('Étape 2.5: Création du patient depuis les informations extraites...');
      
      const extractedPatient = structuredJson.patient || {};
      
      // Préparer les données du patient
      // Note: La table patients n'a que: id, full_name, gender, dob, created_at
      // Les champs room_number et unit ne sont pas dans le schéma, on les stockera dans structured_json si nécessaire
      // Le nouveau format retourne des chaînes vides si non mentionné
      const patientData = {
        full_name: extractedPatient.full_name && extractedPatient.full_name.trim() !== '' 
          ? extractedPatient.full_name 
          : 'Patient non identifié',
        gender: extractedPatient.gender && extractedPatient.gender.trim() !== '' 
          ? extractedPatient.gender 
          : null
      };
      
      // Convertir l'âge en date de naissance si disponible
      if (extractedPatient.age && extractedPatient.age.trim() !== '') {
        const currentYear = new Date().getFullYear();
        const age = parseInt(extractedPatient.age);
        if (!isNaN(age) && age > 0 && age < 150) {
          patientData.dob = new Date(currentYear - age, 0, 1).toISOString().split('T')[0];
        }
      }
      
      // Log pour déboguer - vérifier que room_number et unit ne sont pas dans patientData
      console.log('Données patient à insérer:', JSON.stringify(patientData, null, 2));
      
      try {
        patient = await createPatient(patientData);
        patient_id_final = patient.id;
        console.log(`✅ Patient créé avec succès: ${patient_id_final} - ${patient.full_name}`);
      } catch (error) {
        console.error('Erreur lors de la création du patient:', error);
        return res.status(500).json({ 
          error: 'Erreur lors de la création du patient', 
          message: error.message 
        });
      }
    } else {
      // Si patient_id était fourni, mettre à jour les informations si elles sont meilleures
      const extractedPatient = structuredJson.patient;
      if (extractedPatient) {
        // Note: room_number et unit ne sont pas dans le schéma de la table patients
        // Ces informations seront disponibles dans structuredJson.patient pour le PDF
        
        // Le nouveau format retourne des chaînes vides si non mentionné
        if (extractedPatient.full_name && extractedPatient.full_name.trim() !== '' && 
            (!patient.full_name || patient.full_name === 'Patient non identifié')) {
          patient.full_name = extractedPatient.full_name;
        }
        if (extractedPatient.gender && extractedPatient.gender.trim() !== '' && !patient.gender) {
          patient.gender = extractedPatient.gender;
        }
        if (extractedPatient.age && extractedPatient.age.trim() !== '' && !patient.dob) {
          const currentYear = new Date().getFullYear();
          const age = parseInt(extractedPatient.age);
          if (!isNaN(age) && age > 0 && age < 150) {
            patient.dob = new Date(currentYear - age, 0, 1).toISOString().split('T')[0];
          }
        }
        
        // Stocker room_number et unit dans l'objet patient en mémoire pour le PDF
        // (mais pas dans la base de données car ces colonnes n'existent pas)
        if (extractedPatient.room_number && extractedPatient.room_number.trim() !== '') {
          patient.room_number = extractedPatient.room_number;
        }
        if (extractedPatient.unit && extractedPatient.unit.trim() !== '') {
          patient.unit = extractedPatient.unit;
        }
      }
      patient_id_final = patient_id;
    }

    // Vérifier que patient_id_final est défini avant de continuer
    if (!patient_id_final) {
      console.error('❌ ERREUR: patient_id_final n\'est pas défini après l\'extraction');
      return res.status(500).json({
        error: 'Erreur lors de la création du patient',
        message: 'Impossible de créer ou identifier le patient. Veuillez réessayer.'
      });
    }

    // Étape 3: Upload audio vers Supabase Storage (sans générer le PDF pour l'instant)
    console.log('Étape 3: Upload audio...');
    const audioFileName = `audio/${patient_id_final}/${Date.now()}-${req.file.filename}`;
    let audioUploadResult;
    try {
      audioUploadResult = await uploadAudio(audioFilePath, audioFileName);
      console.log(`✅ Audio uploadé avec succès: ${audioUploadResult.url}`);
    } catch (uploadError) {
      console.error('❌ Erreur lors de l\'upload audio:', uploadError);
      // Ne pas bloquer le processus, continuer sans audio_url
      audioUploadResult = {
        url: null,
        path: null
      };
      console.warn('⚠️ Continuation sans audio_url - la note sera créée sans lien audio');
    }

    // NOTE: Le PDF ne sera PAS généré automatiquement lors de l'upload
    // Il sera généré uniquement lorsque l'utilisateur clique sur "Générer le rapport PDF"
    // dans l'écran d'édition via l'endpoint /api/report/generate
    console.log('ℹ️ PDF non généré automatiquement - sera généré lors de l\'édition');

    // Étape 4: Insertion dans la base de données (sans PDF pour l'instant)
    console.log('Étape 4: Insertion en base...');
    const noteData = {
      patient_id: patient_id_final,
      created_by: userId,
      recorded_at: recordedAt.toISOString(),
      transcription_text: transcriptionText,
      structured_json: structuredJson,
      pdf_url: null, // PDF sera généré plus tard lors de l'édition
      audio_url: audioUploadResult?.url || null, // Utiliser l'URL si disponible, sinon null
      synced: true
    };

    console.log('📝 Données de la note à insérer:', {
      patient_id: noteData.patient_id,
      created_by: noteData.created_by,
      audio_url: noteData.audio_url ? 'présent' : 'absent',
      transcription_length: noteData.transcription_text?.length || 0
    });

    const note = await insertNote(noteData);
    
    console.log(`✅ Note insérée avec succès: ${note.id}`);
    console.log(`   audio_url dans la note: ${note.audio_url || 'null'}`);

    // Nettoyage des fichiers temporaires
    deleteTemporaryFile(audioFilePath);

    console.log(`Note créée avec succès: ${note.id}`);

    // Réponse
    res.status(201).json({
      ok: true,
      transcription: transcriptionText,
      structured_json: structuredJson,
      pdf_url: null, // PDF sera généré lors de l'édition
      note: {
        id: note.id,
        patient_id: note.patient_id,
        created_by: note.created_by,
        transcription_text: note.transcription_text,
        structured_json: note.structured_json,
        pdf_url: note.pdf_url,
        audio_url: note.audio_url,
        created_at: note.created_at
      },
      patient_created: patient_created || !patient_id, // Indique si un nouveau patient a été créé
      patient: patient || null // Retourner le patient créé ou existant
    });

  } catch (error) {
    console.error('Erreur lors du traitement de l\'upload:', error);

    // Nettoyage en cas d'erreur
    if (audioFilePath) {
      deleteTemporaryFile(audioFilePath);
    }

    res.status(500).json({
      error: 'Erreur lors du traitement de l\'upload',
      message: error.message
    });
  }
});

module.exports = router;

