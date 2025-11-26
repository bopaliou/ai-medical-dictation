/**
 * Routes pour la gestion des patients
 * GET /api/patients/:id - Récupérer un patient avec ses notes
 * POST /api/patients - Créer un nouveau patient
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getPatientById,
  createPatient,
  getAllPatients,
  getNotesByPatient,
  searchPatients
} = require('../services/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Récupère tous les patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const { query } = req.query;
    
    // Si un paramètre query est fourni, faire une recherche
    if (query) {
      const patients = await searchPatients(query, 20);
      return res.json({ ok: true, patients });
    }
    
    // Sinon, retourner tous les patients
    const patients = await getAllPatients();
    res.json({ ok: true, patients });
  } catch (error) {
    console.error('Erreur lors de la récupération des patients:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des patients', message: error.message });
  }
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Récupère un patient avec ses notes
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du patient
 *     responses:
 *       200:
 *         description: Patient avec ses notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 patient:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Patient'
 *                     - type: object
 *                       properties:
 *                         notes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Note'
 *       404:
 *         description: Patient non trouvé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupération du patient
    let patient;
    try {
      patient = await getPatientById(id);
    } catch (error) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Récupération des notes du patient
    const notes = await getNotesByPatient(id);

    res.json({
      ok: true,
      patient: {
        ...patient,
        notes
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du patient', message: error.message });
  }
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Crée un nouveau patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: Nom complet du patient
 *                 example: Jean Dupont
 *               gender:
 *                 type: string
 *                 description: Genre du patient
 *                 example: M
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: Date de naissance
 *                 example: 1990-01-01
 *     responses:
 *       201:
 *         description: Patient créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticate, authorize(['nurse', 'admin']), async (req, res) => {
  try {
    const { full_name, gender, dob, age, room_number, unit } = req.body;

    // Validation
    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ error: 'Le nom du patient est requis' });
    }

    // Création du patient
    const patientData = {
      full_name: full_name.trim(),
      gender: gender || null,
      dob: dob || null,
      age: age || null,
      room_number: room_number || null,
      unit: unit || null
    };

    // Vérifier si un patient similaire existe déjà (éviter les doublons)
    // Recherche par nom + room_number si fourni
    // Note: room_number peut ne pas exister dans la base, donc on vérifie d'abord
    if (room_number && room_number.trim()) {
      try {
        const existingPatients = await searchPatients(full_name.trim(), 10);
        // Chercher un doublon : même nom ET même room_number
        // IMPORTANT : on ne considère comme doublon QUE si :
        // 1. Le patient existant a le même nom (insensible à la casse)
        // 2. Le patient existant a un room_number (non vide, non null, non undefined)
        // 3. Le room_number du patient existant correspond exactement au room_number fourni
        // 
        // Un patient sans room_number n'est PAS un doublon (on peut avoir plusieurs patients 
        // avec le même nom dans des chambres différentes)
        const duplicate = existingPatients.find((p) => {
          // Étape 1: Vérifier que le nom correspond (insensible à la casse)
          if (!p.full_name) {
            return false; // Pas de nom = pas de match
          }
          const nameMatches = p.full_name.toLowerCase().trim() === full_name.trim().toLowerCase();
          if (!nameMatches) {
            return false; // Nom différent = pas de doublon
          }
          
          // Étape 2: Vérifier que le patient existant a un room_number valide
          // IMPORTANT: On vérifie explicitement que room_number existe et n'est pas vide
          // On ne doit JAMAIS matcher un patient sans room_number
          if (!p.room_number || typeof p.room_number !== 'string' || p.room_number.trim().length === 0) {
            return false; // Pas de room_number valide = pas de doublon
          }
          
          // Étape 3: Vérifier que les room_number correspondent exactement
          // À ce stade, on est sûr que p.room_number existe et est une string non vide
          const roomMatches = p.room_number.trim() === room_number.trim();
          
          // Doublon uniquement si les trois conditions sont remplies
          return nameMatches && roomMatches; // hasRoomNumber est déjà vérifié ci-dessus
        });
        
        if (duplicate) {
          // Vérification de sécurité supplémentaire : s'assurer que duplicate.room_number existe
          // (ne devrait jamais être nécessaire vu la logique ci-dessus, mais par sécurité)
          if (!duplicate.room_number) {
            console.error('❌ ERREUR: Doublon détecté mais room_number manquant - cela ne devrait jamais arriver');
            // Ne pas bloquer la création si cette erreur inattendue se produit
          } else {
            console.warn('⚠️ Doublon détecté:', {
              existing: {
                id: duplicate.id,
                full_name: duplicate.full_name,
                room_number: duplicate.room_number
              },
              new: {
                full_name: full_name.trim(),
                room_number: room_number.trim()
              }
            });
            return res.status(409).json({
              error: 'Un patient avec ce nom et ce numéro de chambre existe déjà',
              patient: duplicate
            });
          }
        }
      } catch (searchError) {
        // Si la recherche échoue (par exemple colonnes manquantes), on continue quand même
        console.warn('⚠️ Erreur lors de la vérification des doublons, continuation de la création:', searchError.message);
      }
    }

    console.log('📋 Données patient reçues:', JSON.stringify(patientData, null, 2));
    
    const patient = await createPatient(patientData);

    console.log('✅ Patient créé avec succès:', patient.id);
    res.status(201).json({
      ok: true,
      patient
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du patient:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur lors de la création du patient', 
      message: error.message || 'Une erreur inattendue est survenue'
    });
  }
});

module.exports = router;

