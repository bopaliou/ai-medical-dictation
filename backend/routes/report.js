/**
 * Route pour la génération/régénération de PDF
 * POST /api/report/generate
 * Régénère un PDF avec des données SOAPIE éditées
 */

const express = require('express');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const { generatePDF } = require('../services/pdfGenerator');
const { uploadPDF, getNoteById, updateNote, deleteNote, deleteReportAndFiles, getReportsByUser, getPatientById, deletePDFFromStorage, createSignedUrlForPDF } = require('../services/supabase');

// Helper pour calculer l'âge depuis une date de naissance
function calculateAge(dob) {
  if (!dob) return null;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} ans`;
  } catch (error) {
    return null;
  }
}

const router = express.Router();

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Récupère la liste des rapports de l'utilisateur connecté
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, final, trash]
 *         description: Filtrer par statut (optionnel)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre maximum de résultats
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset pour la pagination
 *     responses:
 *       200:
 *         description: Liste des rapports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       patient_id:
 *                         type: string
 *                         format: uuid
 *                       pdf_url:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       recorded_at:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [draft, final, trash]
 *                       patient:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           gender:
 *                             type: string
 *                           dob:
 *                             type: string
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
// IMPORTANT: Cette route doit être définie AVANT les routes paramétrées (/:id)
router.get('/', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    console.log(`📋 GET /api/reports - Récupération des rapports pour l'utilisateur: ${userId}`);
    console.log(`   Query params:`, { status, limit, offset });

    const options = {
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : 0,
    };

    const reports = await getReportsByUser(userId, options);

    console.log(`✅ ${reports.length} rapports récupérés`);

    res.status(200).json({
      ok: true,
      reports,
      count: reports.length,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des rapports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/:id/signed-url
 * Régénère l'URL publique pour le PDF d'un rapport
 * IMPORTANT: Cette route doit être définie AVANT /:id pour éviter les conflits de routing
 * Note: Les buckets sont maintenant publics, cette route génère une URL publique
 */
router.get('/:id/signed-url', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🔗 GET /api/reports/${id}/signed-url - Régénération de l'URL signée par l'utilisateur: ${userId}`);

    // Récupérer la note
    const note = await getNoteById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Rapport non trouvé',
        message: `Le rapport avec l'ID ${id} n'existe pas`
      });
    }

    // Vérifier les permissions
    if (note.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à accéder à ce rapport'
      });
    }

    if (!note.pdf_url) {
      return res.status(404).json({
        error: 'PDF non trouvé',
        message: 'Ce rapport n\'a pas de PDF associé'
      });
    }

    // Extraire le path depuis l'URL existante (peut être signée ou publique)
    // Format signée: https://project.supabase.co/storage/v1/object/sign/bucket-name/path/to/file.pdf?token=...
    // Format publique: https://project.supabase.co/storage/v1/object/public/bucket-name/path/to/file.pdf
    let filePath = null;
    try {
      const urlObj = new URL(note.pdf_url);
      // Le path est dans le chemin après le nom du bucket
      // Format: /storage/v1/object/[sign|public]/bucket-name/path/to/file.pdf
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/);
      if (pathMatch) {
        filePath = decodeURIComponent(pathMatch[1]);
        console.log(`📋 Path extrait depuis l'URL: ${filePath}`);
      } else {
        // Format alternatif: essayer d'extraire directement après le bucket
        const pathMatch2 = urlObj.pathname.match(/\/storage\/v1\/object\/[^/]+\/[^/]+\/(.+)$/);
        if (pathMatch2) {
          filePath = decodeURIComponent(pathMatch2[1]);
          console.log(`📋 Path extrait (format alternatif): ${filePath}`);
        } else {
          console.warn(`⚠️ Impossible d'extraire le path depuis l'URL: ${note.pdf_url}`);
        }
      }
    } catch (urlError) {
      console.error('❌ Erreur lors de l\'extraction du path depuis l\'URL:', urlError);
    }

    if (!filePath) {
      // Si on ne peut pas extraire le path, retourner l'URL existante
      console.warn('⚠️ Impossible d\'extraire le path, retour de l\'URL existante');
      return res.status(200).json({
        ok: true,
        signed_url: note.pdf_url
      });
    }

    console.log(`📋 Path extrait: ${filePath}`);

    // Générer une nouvelle URL publique
    const signedUrl = await createSignedUrlForPDF(filePath, 31536000); // Note: buckets publics, retourne URL publique

    console.log(`✅ URL publique régénérée avec succès pour le rapport: ${id}`);

    res.status(200).json({
      ok: true,
      signed_url: signedUrl
    });

  } catch (error) {
    console.error('❌ Erreur lors de la régénération de l\'URL signée:', error);
    res.status(500).json({
      error: 'Erreur lors de la régénération de l\'URL signée',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Récupère les détails d'un rapport spécifique
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du rapport à récupérer
 *     responses:
 *       200:
 *         description: Détails du rapport
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 report:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     patient_id:
 *                       type: string
 *                     pdf_url:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [draft, final, trash]
 *                     patient:
 *                       type: object
 *                     structured_json:
 *                       type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`📋 GET /api/reports/${id} - Récupération des détails du rapport par l'utilisateur: ${userId}`);

    // Récupérer la note avec les informations du patient
    const note = await getNoteById(id);
    if (!note) {
      console.error(`❌ Note non trouvée avec l'ID: ${id}`);
      return res.status(404).json({
        error: 'Rapport non trouvé',
        message: `Le rapport avec l'ID ${id} n'existe pas`
      });
    }

    console.log(`✅ Note trouvée:`, {
      id: note.id,
      created_by: note.created_by,
      pdf_url: note.pdf_url ? 'présent' : 'absent',
      status: note.status || 'null',
      patient_id: note.patient_id || 'null'
    });

    // Vérifier que l'utilisateur est le créateur ou un admin
    if (note.created_by !== userId && req.user.role !== 'admin') {
      console.warn(`⚠️ Accès refusé - Utilisateur: ${userId}, Créateur: ${note.created_by}, Rôle: ${req.user.role}`);
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à consulter ce rapport'
      });
    }

    // Vérifier que la note a un PDF (c'est un rapport généré)
    if (!note.pdf_url) {
      console.warn(`⚠️ Note sans PDF - ID: ${id}`);
      return res.status(404).json({
        error: 'Rapport non trouvé',
        message: 'Cette note n\'a pas de PDF associé (rapport non généré)'
      });
    }

    // Récupérer les informations du patient si patient_id existe
    let patient = null;
    if (note.patient_id) {
      try {
        patient = await getPatientById(note.patient_id);
      } catch (error) {
        console.warn(`⚠️ Erreur lors de la récupération du patient ${note.patient_id}:`, error.message);
        // Continuer sans les informations du patient
      }
    }

    // Extraire les informations du patient depuis structured_json si disponible
    const structuredJson = note.structured_json || {};
    const patientFromJson = structuredJson.patient || {};

    // Fusionner les données patient : DB > structured_json
    const patientData = patient ? {
      id: patient.id,
      full_name: patient.full_name || patientFromJson.full_name || 'Patient Inconnu',
      age: patientFromJson.age || (patient.dob ? calculateAge(patient.dob) : null),
      gender: patient.gender || patientFromJson.gender || null,
      room_number: patientFromJson.room_number || null,
      unit: patientFromJson.unit || null,
    } : {
      id: note.patient_id || null,
      full_name: patientFromJson.full_name || 'Patient Inconnu',
      age: patientFromJson.age || null,
      gender: patientFromJson.gender || null,
      room_number: patientFromJson.room_number || null,
      unit: patientFromJson.unit || null,
    };

    // Formater la réponse
    const report = {
      id: note.id,
      patient_id: note.patient_id,
      pdf_url: note.pdf_url,
      created_at: note.created_at,
      recorded_at: note.recorded_at,
      status: note.status || 'final',
      patient: patientData,
      soapie: structuredJson.soapie || {
        S: '',
        O: {
          vitals: {},
          exam: '',
          labs: '',
          medications: []
        },
        A: '',
        I: [],
        E: '',
        P: ''
      },
      transcription: note.transcription_text || ''
    };

    console.log(`✅ Détails du rapport récupérés avec succès: ${id}`);

    res.status(200).json({
      ok: true,
      report
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des détails du rapport:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des détails du rapport',
      message: error.message
    });
  }
});


/**
 * @swagger
 * /api/report/generate:
 *   post:
 *     summary: Génère ou régénère un PDF avec des données SOAPIE éditées
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - structured_json
 *             properties:
 *               note_id:
 *                 type: string
 *                 description: ID de la note existante (optionnel, pour régénération)
 *               patient_id:
 *                 type: string
 *                 description: ID du patient
 *               structured_json:
 *                 type: object
 *                 description: Données SOAPIE structurées
 *               transcription:
 *                 type: string
 *                 description: Texte de transcription (optionnel)
 *     responses:
 *       200:
 *         description: PDF généré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 pdf_url:
 *                   type: string
 *                 note_id:
 *                   type: string
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { note_id, patient_id: patientIdParam, structured_json, transcription } = req.body;
    const userId = req.user.id;

    if (!structured_json) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'structured_json est requis'
      });
    }

    console.log('📄 Génération PDF avec données éditées...');
    console.log('Note ID:', note_id);
    console.log('Patient ID (param):', patientIdParam || '(non fourni)');
    console.log('Structured JSON patient:', structured_json?.patient ? 'présent' : 'absent');
    
    // Validation: Si patientIdParam est une chaîne vide, le traiter comme undefined
    const patientIdParamClean = (patientIdParam && patientIdParam.trim()) ? patientIdParam.trim() : null;
    if (patientIdParam && !patientIdParamClean) {
      console.warn('⚠️ Patient ID fourni est une chaîne vide, sera récupéré depuis la note si note_id existe');
    }

    // Récupérer les informations du patient si note_id existe
    let patient = null;
    let note = null;
    // Nettoyer patientIdParam: si c'est une chaîne vide, utiliser null
    let patient_id = (patientIdParam && patientIdParam.trim()) ? patientIdParam.trim() : null;
    
    if (note_id) {
      console.log('📋 Récupération de la note existante...');
      try {
        note = await getNoteById(note_id);
        if (!note) {
          console.error('❌ Note non trouvée:', note_id);
          return res.status(404).json({
            error: 'Note non trouvée',
            message: `La note avec l'ID ${note_id} n'existe pas`
          });
        }

        console.log('✅ Note trouvée:', {
          id: note.id,
          patient_id: note.patient_id,
          has_structured_json: !!note.structured_json,
          has_patient_in_json: !!(note.structured_json?.patient)
        });

        // Vérifier que l'utilisateur est le créateur de la note
        if (note.created_by !== userId) {
          console.error('❌ Accès refusé - utilisateur:', userId, 'créateur:', note.created_by);
          return res.status(403).json({
            error: 'Accès refusé',
            message: 'Vous n\'êtes pas autorisé à modifier cette note'
          });
        }

        // Utiliser le patient_id de la note si disponible
        if (note.patient_id) {
          patient_id = note.patient_id;
          console.log('✅ Patient ID récupéré depuis la note:', patient_id);
        } else {
          console.warn('⚠️ Note sans patient_id, utilisation du paramètre ou extraction depuis structured_json');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de la note:', error);
        return res.status(500).json({
          error: 'Erreur lors de la récupération de la note',
          message: error.message
        });
      }
    }

    // Récupérer les informations du patient
    console.log('🔍 Récupération des informations du patient...');
    console.log('   patient_id fourni:', patient_id || 'non fourni');
    console.log('   structured_json.patient:', structured_json.patient ? {
      full_name: structured_json.patient.full_name || '(vide)',
      age: structured_json.patient.age || '(vide)',
      gender: structured_json.patient.gender || '(vide)'
    } : 'absent');
    
    // Priorité 1: Récupérer depuis la base de données si patient_id est disponible
    let patientFromDB = null;
    if (patient_id) {
      try {
        patientFromDB = await getPatientById(patient_id);
        if (patientFromDB) {
          console.log('✅ Patient trouvé en base de données:', {
            id: patientFromDB.id,
            full_name: patientFromDB.full_name || '(vide)',
            age: patientFromDB.age || '(vide)',
            gender: patientFromDB.gender || '(vide)'
          });
        } else {
          console.warn('⚠️ Patient non trouvé en base de données avec ID:', patient_id);
        }
      } catch (dbError) {
        console.error('❌ Erreur lors de la récupération du patient depuis la DB:', dbError.message);
        // Continuer avec structured_json.patient comme fallback
      }
    }
    
    // FONCTION CRITIQUE : Utiliser UNIQUEMENT les données du formulaire (structured_json.patient)
    // Ces données représentent la dernière version modifiée par l'utilisateur
    // Ne JAMAIS compléter avec la DB si les données du formulaire sont présentes
    patient = {};
    
    // Fonction helper pour vérifier si une valeur est valide (non vide)
    const isValidValue = (value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (typeof value === 'string' && value.trim().toLowerCase() === 'non spécifié') return false;
      if (typeof value === 'string' && value.trim().toLowerCase() === 'non mentionné') return false;
      return true;
    };
    
    // PRIORITÉ ABSOLUE 1: Utiliser les données du formulaire (structured_json.patient)
    // Ces données sont la source de vérité car elles représentent les modifications de l'utilisateur
    if (structured_json && structured_json.patient) {
      // Copier TOUTES les valeurs de structured_json.patient, même si vides
      // Car une valeur vide peut être intentionnelle (l'utilisateur a vidé le champ)
      for (const key in structured_json.patient) {
        const value = structured_json.patient[key];
        // Accepter toutes les valeurs, même vides, car elles viennent du formulaire
        patient[key] = typeof value === 'string' ? value.trim() : (value || '');
        console.log(`   ✅ ${key} depuis formulaire: "${patient[key]}"`);
      }
      console.log('   ✅ Base: Patient initialisé depuis données du formulaire (source de vérité)');
    }
    
    // PRIORITÉ 2: Compléter UNIQUEMENT les champs ABSENTS (pas dans structured_json.patient)
    // Ne JAMAIS écraser une valeur du formulaire, même si elle est vide
    if (patientFromDB && structured_json && structured_json.patient) {
      // Vérifier quels champs sont ABSENTS de structured_json.patient (pas juste vides)
      const fieldsInForm = Object.keys(structured_json.patient);
      
      // Pour full_name : utiliser DB seulement si le champ n'existe PAS dans le formulaire
      if (!fieldsInForm.includes('full_name') && isValidValue(patientFromDB.full_name)) {
        patient.full_name = patientFromDB.full_name;
        console.log(`   ✅ full_name complété depuis DB (absent du formulaire): "${patient.full_name}"`);
      }
      
      // Pour age : utiliser DB.dob seulement si le champ n'existe PAS dans le formulaire
      if (!fieldsInForm.includes('age') && patientFromDB.dob) {
        const ageFromDB = calculateAge(patientFromDB.dob);
        if (ageFromDB) {
          patient.age = ageFromDB;
          console.log(`   ✅ age complété depuis DB.dob (absent du formulaire): "${patient.age}"`);
        }
      }
      
      // Pour les autres champs : compléter seulement si ABSENTS du formulaire
      ['gender', 'room_number', 'unit'].forEach(key => {
        if (!fieldsInForm.includes(key) && isValidValue(patientFromDB[key])) {
          patient[key] = patientFromDB[key];
          console.log(`   ✅ ${key} complété depuis DB (absent du formulaire): "${patient[key]}"`);
        }
      });
      
      console.log('   Complément: Données DB utilisées UNIQUEMENT pour les champs absents du formulaire');
    } else if (patientFromDB && (!structured_json || !structured_json.patient)) {
      // Si structured_json.patient n'existe pas du tout, utiliser la DB comme fallback
      console.log('   ⚠️ structured_json.patient absent, utilisation de la DB comme fallback');
      patient = {
        full_name: patientFromDB.full_name || 'Patient Inconnu',
        age: patientFromDB.dob ? calculateAge(patientFromDB.dob) : '',
        gender: patientFromDB.gender || '',
        room_number: patientFromDB.room_number || '',
        unit: patientFromDB.unit || ''
      };
    }
    
    // Fallback final : utiliser note.structured_json.patient seulement si aucune autre source
    if ((!patient || Object.keys(patient).length === 0) && note && note.structured_json?.patient) {
      patient = { ...note.structured_json.patient };
      console.log('   Fallback: Utilisation de note.structured_json.patient');
    }
    
    console.log('   📋 Résultat final patient après fusion:', {
      full_name: patient?.full_name || '(vide)',
      age: patient?.age || '(vide)',
      gender: patient?.gender || '(vide)',
      room_number: patient?.room_number || '(vide)',
      unit: patient?.unit || '(vide)',
      source: patientFromDB ? 'DB + Audio' : 'Audio uniquement'
    });

    // Validation finale : si toujours pas de patient avec full_name, utiliser "Patient Inconnu"
    // On ne bloque plus la requête car pdfGenerator.js peut gérer le cas "Patient Inconnu"
    if (!patient || !patient.full_name || !patient.full_name.trim()) {
      console.warn('⚠️ Patient sans full_name détecté, utilisation de "Patient Inconnu" pour la génération PDF');
      console.warn('   patient_exists:', !!patient);
      console.warn('   has_full_name:', !!(patient?.full_name));
      console.warn('   patient_id:', patient_id);
      console.warn('   patient_data:', patient);
      
      // Créer un patient minimal avec "Patient Inconnu" pour permettre la génération PDF
      patient = {
        full_name: 'Patient Inconnu',
        ...(patient || {}), // Conserver les autres champs si disponibles
      };
      console.log('✅ Patient "Patient Inconnu" créé pour la génération PDF');
    }

    console.log('✅ Patient validé:', {
      full_name: patient.full_name,
      age: patient.age || 'non spécifié',
      gender: patient.gender || 'non spécifié',
      patient_id: patient_id || 'non spécifié'
    });

    // Récupération des informations de l'infirmière
    const nurseInfo = {
      full_name: req.user.full_name || req.user.user_metadata?.full_name || 'Infirmière',
      service: req.user.service || req.user.user_metadata?.service || 'Service',
      role: req.user.role || req.user.user_metadata?.role || 'nurse'
    };

    let pdfFilePath = null;

    try {
      console.log('📄 Début de la génération PDF...');
      console.log('   📋 Patient final pour PDF:', JSON.stringify({
        full_name: patient?.full_name || '(vide)',
        age: patient?.age || '(vide)',
        gender: patient?.gender || '(vide)',
        room_number: patient?.room_number || '(vide)',
        unit: patient?.unit || '(vide)'
      }, null, 2));
      console.log('   📋 structured_json.patient (données audio):', JSON.stringify(structured_json.patient || {}, null, 2));
      console.log('   Patient ID:', patient_id || 'non spécifié');
      console.log('   User:', nurseInfo.full_name);
      
      // Générer le PDF
      console.log('   Étape 1/4: Création du document PDF...');
      try {
        pdfFilePath = await generatePDF({
          patient,
          transcriptionText: transcription || note?.transcription_text || '',
          structuredJson: structured_json,
          recordedAt: note?.recorded_at ? new Date(note.recorded_at) : new Date(),
          createdAt: new Date(),
          user: nurseInfo,
          noteId: note_id || note?.id || null,
          patientId: patient_id || patient?.id || note?.patient_id || null
        });
      } catch (pdfError) {
        console.error('❌ Erreur dans generatePDF:', pdfError);
        console.error('   Stack:', pdfError.stack);
        throw pdfError;
      }

      if (!pdfFilePath || !fs.existsSync(pdfFilePath)) {
        throw new Error('Le fichier PDF n\'a pas été créé correctement');
      }

      console.log(`   ✅ PDF créé: ${pdfFilePath}`);

      // Upload du PDF vers Supabase Storage
      console.log('   Étape 2/4: Upload vers Supabase Storage...');
      
      // Si on modifie un PDF existant, utiliser le même path pour le remplacer
      let pdfFileName = null;
      let shouldUpsert = false;
      
      if (note_id && note && note.pdf_url) {
        // Extraire le path depuis l'URL existante
        try {
          const urlObj = new URL(note.pdf_url);
          // Format: /storage/v1/object/public/bucket-name/path/to/file.pdf
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:sign|public)\/[^/]+\/(.+)$/);
          if (pathMatch) {
            pdfFileName = decodeURIComponent(pathMatch[1]);
            shouldUpsert = true; // Remplacer le fichier existant
            console.log(`   📋 Modification du PDF existant: ${pdfFileName}`);
          } else {
            // Format alternatif
            const pathMatch2 = urlObj.pathname.match(/\/storage\/v1\/object\/[^/]+\/[^/]+\/(.+)$/);
            if (pathMatch2) {
              pdfFileName = decodeURIComponent(pathMatch2[1]);
              shouldUpsert = true;
              console.log(`   📋 Modification du PDF existant (format alternatif): ${pdfFileName}`);
            }
          }
        } catch (urlError) {
          console.warn('   ⚠️  Erreur lors de l\'extraction du path, création d\'un nouveau PDF:', urlError.message);
        }
      }
      
      // Si on n'a pas pu extraire le path, créer un nouveau PDF
      if (!pdfFileName) {
        pdfFileName = `pdfs/${patient_id || 'unknown'}/${Date.now()}-note.pdf`;
        shouldUpsert = false; // Nouveau fichier
        console.log(`   📋 Création d'un nouveau PDF: ${pdfFileName}`);
      }
      
      const pdfUploadResult = await uploadPDF(pdfFilePath, pdfFileName, shouldUpsert);

      if (!pdfUploadResult || !pdfUploadResult.url) {
        throw new Error('L\'upload PDF a échoué : URL non retournée');
      }

      console.log(`   ✅ PDF uploadé: ${pdfUploadResult.url}`);

      // Mettre à jour la note si elle existe
      console.log('   Étape 3/4: Mise à jour de la note...');
      if (note_id && note) {
        await updateNote(note_id, {
          structured_json: structured_json,
          pdf_url: pdfUploadResult.url,
          transcription_text: transcription || note.transcription_text
        });
        console.log(`   ✅ Note mise à jour: ${note_id}`);
      }

      // Nettoyage du fichier temporaire
      console.log('   Étape 4/4: Nettoyage du fichier temporaire...');
      const { deleteTemporaryFile } = require('../services/supabase');
      try {
        deleteTemporaryFile(pdfFilePath);
        console.log('   ✅ Fichier temporaire supprimé');
      } catch (cleanupError) {
        console.warn('   ⚠️  Erreur lors du nettoyage:', cleanupError.message);
        // Ne pas faire échouer la requête si le nettoyage échoue
      }

      console.log(`✅ PDF généré avec succès: ${pdfUploadResult.url}`);

      res.status(200).json({
        ok: true,
        pdf_url: pdfUploadResult.url,
        note_id: note_id || null,
        message: 'PDF généré avec succès'
      });

    } catch (error) {
      console.error('❌ PDF ERROR:', error);
      console.error('   Stack:', error.stack);
      console.error('   Message:', error.message);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (pdfFilePath && fs.existsSync(pdfFilePath)) {
        try {
          const { deleteTemporaryFile } = require('../services/supabase');
          deleteTemporaryFile(pdfFilePath);
          console.log('   ✅ Fichier temporaire nettoyé après erreur');
        } catch (cleanupError) {
          console.warn('   ⚠️  Erreur lors du nettoyage après erreur:', cleanupError.message);
        }
      }

      res.status(500).json({
        error: 'PDF_GENERATION_FAILED',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du PDF',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Supprime un rapport (note)
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du rapport à supprimer
 *     responses:
 *       200:
 *         description: Rapport supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticate, authorize(['nurse', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validation de l'ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        ok: false,
        error: 'ID de rapport invalide'
      });
    }

    // Vérifier que la note existe et que l'utilisateur a les permissions
    const note = await getNoteById(id);
    if (!note) {
      return res.status(404).json({
        ok: false,
        error: 'Rapport non trouvé',
        message: `Le rapport avec l'ID ${id} n'existe pas`
      });
    }

    // Vérifier les permissions
    if (note.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à supprimer ce rapport'
      });
    }

    // Supprimer le rapport et tous ses fichiers de manière idempotente
    // Cette fonction est tolérante aux fichiers déjà supprimés et peut être appelée plusieurs fois
    const deleteResult = await deleteReportAndFiles(id);

    // Retourner la réponse de succès
    return res.status(200).json({
      ok: true,
      message: 'Rapport supprimé avec succès',
      deleted: deleteResult.deleted
    });

  } catch (error) {
    // Gérer les erreurs spécifiques
    if (error.message && error.message.includes('contrainte FK')) {
      return res.status(500).json({
        ok: false,
        error: 'Erreur de configuration',
        message: 'La migration SQL n\'a pas été appliquée. Veuillez contacter l\'administrateur.'
      });
    }

    if (error.message && error.message.includes('non trouvée')) {
      return res.status(404).json({
        ok: false,
        error: 'Rapport non trouvé',
        message: error.message
      });
    }

    // Erreur générique
    return res.status(500).json({
      ok: false,
      error: 'Erreur lors de la suppression du rapport',
      message: error.message || 'Une erreur inattendue s\'est produite'
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}:
 *   patch:
 *     summary: Met à jour le statut d'un rapport
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du rapport à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, final, trash]
 *                 description: Nouveau statut du rapport (draft=brouillon, final=finalisé, trash=corbeille)
 *     responses:
 *       200:
 *         description: Rapport mis à jour avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Rapport non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id', authenticate, authorize(['nurse', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le champ status est requis'
      });
    }

    // Valider le statut
    const validStatuses = ['draft', 'final', 'trash'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: `Le statut doit être l'un des suivants: ${validStatuses.join(', ')}`
      });
    }

    console.log(`📝 Mise à jour du statut du rapport: ${id} -> ${status} par l'utilisateur: ${userId}`);

    // Vérifier que la note existe
    const note = await getNoteById(id);
    if (!note) {
      return res.status(404).json({
        error: 'Rapport non trouvé',
        message: `Le rapport avec l'ID ${id} n'existe pas`
      });
    }

    // Vérifier que l'utilisateur est le créateur de la note
    if (note.created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous n\'êtes pas autorisé à modifier ce rapport'
      });
    }

    // Mettre à jour la note avec le nouveau statut
    // Note: Si la colonne status n'existe pas dans la table notes, on peut la stocker dans structured_json
    // Pour l'instant, on va essayer de mettre à jour directement
    let updatedNote;
    try {
      updatedNote = await updateNote(id, { status });
    } catch (error) {
      // Si la colonne status n'existe pas, on peut stocker dans structured_json
      if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn('⚠️ Colonne status non trouvée, stockage dans structured_json');
        const currentStructuredJson = note.structured_json || {};
        updatedNote = await updateNote(id, {
          structured_json: {
            ...currentStructuredJson,
            _status: status, // Préfixe _ pour éviter les conflits
          }
        });
      } else {
        throw error;
      }
    }

    console.log(`✅ Statut du rapport mis à jour avec succès: ${id} -> ${status}`);

    // Formater la réponse avec les informations complètes
    const response = {
      ok: true,
      message: 'Rapport mis à jour avec succès',
      report: {
        id: updatedNote.id,
        patient_id: updatedNote.patient_id,
        pdf_url: updatedNote.pdf_url,
        created_at: updatedNote.created_at,
        status: updatedNote.status || status,
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour du rapport',
      message: error.message
    });
  }
});

module.exports = router;

