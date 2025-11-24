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
  let pdfFilePath = null;

  try {
    // Validation des paramètres
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier audio manquant' });
    }

    const { patient_id, user_id, recorded_at } = req.body;

    // user_id n'est plus nécessaire car on utilise req.user.id
    audioFilePath = req.file.path;
    const recordedAt = recorded_at ? new Date(recorded_at) : new Date();
    const userId = req.user.id;

    let patient;
    let patient_id_final;

    // Si patient_id est fourni, vérifier qu'il existe
    if (patient_id) {
      console.log(`Upload audio reçu pour patient existant: ${patient_id}`);
      try {
        patient = await getPatientById(patient_id);
        patient_id_final = patient_id;
      } catch (error) {
        return res.status(404).json({ error: 'Patient non trouvé' });
      }
    } else {
      console.log('Upload audio sans patient_id - extraction depuis l\'audio...');
    }

    // Étape 1: Transcription via Whisper
    console.log('Étape 1: Transcription...');
    let transcriptionText = await transcribeAudio(audioFilePath);

    // Étape 1.5: Nettoyage de la transcription (correction fautes courantes)
    const { cleanTranscription } = require('../services/cleanTranscription');
    const originalLength = transcriptionText.length;
    transcriptionText = cleanTranscription(transcriptionText);
    if (transcriptionText.length !== originalLength) {
      console.log('📝 Transcription nettoyée (corrections appliquées)');
    }

    // Étape 2: Structuration SOAPIE via Gemini (utilise transcriptionText nettoyé de Whisper)
    console.log('Étape 2: Structuration SOAPIE...');
    let structuredJson;
    try {
      structuredJson = await structureSOAPIE(transcriptionText);
      
      // Validation que structuredJson contient patient et soapie
      if (!structuredJson || (!structuredJson.patient && !structuredJson.soapie)) {
        throw new Error('La structuration n\'a pas retourné de données patient ou soapie valides');
      }
      
      console.log('✅ Structuration réussie');
      console.log('Patient extrait:', structuredJson.patient?.full_name || '(non identifié)');
      console.log('SOAPIE présent:', !!structuredJson.soapie);
    } catch (structError) {
      console.error('❌ Erreur lors de la structuration SOAPIE:', structError);
      
      // Extraire le raw output si disponible dans l'erreur
      const rawSnippet = structError.rawSnippet || structError.message?.substring(0, 500) || 'Non disponible';
      
      return res.status(400).json({
        error: 'STRUCTURATION_FAILED',
        message: 'Échec de la structuration SOAPIE. Le modèle n\'a pas retourné de JSON valide.',
        details: structError.message,
        rawModelOutput: rawSnippet
      });
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

    // Étape 3: Génération PDF
    console.log('Étape 3: Génération PDF...');
    
    // Récupération des informations de l'infirmière depuis req.user
    const nurseInfo = {
      full_name: req.user.full_name || req.user.user_metadata?.full_name || 'Infirmière',
      service: req.user.service || req.user.user_metadata?.service || 'Service',
      role: req.user.role || req.user.user_metadata?.role || 'nurse'
    };
    
    pdfFilePath = await generatePDF({
      patient,
      transcriptionText,
      structuredJson,
      recordedAt,
      createdAt: new Date(),
      user: nurseInfo
    });

    // Étape 4: Upload audio vers Supabase Storage
    console.log('Étape 4: Upload audio...');
    const audioFileName = `audio/${patient_id_final}/${Date.now()}-${req.file.filename}`;
    const audioUploadResult = await uploadAudio(audioFilePath, audioFileName);

    // Étape 5: Upload PDF vers Supabase Storage
    console.log('Étape 5: Upload PDF...');
    const pdfFileName = `pdfs/${patient_id_final}/${Date.now()}-note.pdf`;
    const pdfUploadResult = await uploadPDF(pdfFilePath, pdfFileName);

    // Étape 6: Insertion dans la base de données
    console.log('Étape 6: Insertion en base...');
    const noteData = {
      patient_id: patient_id_final,
      created_by: userId,
      recorded_at: recordedAt.toISOString(),
      transcription_text: transcriptionText,
      structured_json: structuredJson,
      pdf_url: pdfUploadResult.url,
      audio_url: audioUploadResult.url,
      synced: true
    };

    const note = await insertNote(noteData);

    // Nettoyage des fichiers temporaires
    deleteTemporaryFile(audioFilePath);
    deleteTemporaryFile(pdfFilePath);

    console.log(`Note créée avec succès: ${note.id}`);

    // Réponse
    res.status(201).json({
      ok: true,
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
      patient_created: !patient_id // Indique si un nouveau patient a été créé
    });

  } catch (error) {
    console.error('Erreur lors du traitement de l\'upload:', error);

    // Nettoyage en cas d'erreur
    if (audioFilePath) {
      deleteTemporaryFile(audioFilePath);
    }
    if (pdfFilePath) {
      deleteTemporaryFile(pdfFilePath);
    }

    res.status(500).json({
      error: 'Erreur lors du traitement de l\'upload',
      message: error.message
    });
  }
});

module.exports = router;

