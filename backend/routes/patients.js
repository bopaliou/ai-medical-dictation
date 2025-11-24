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
  getNotesByPatient
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
    const { full_name, gender, dob } = req.body;

    // Validation
    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ error: 'Le nom du patient est requis' });
    }

    // Création du patient
    const patientData = {
      full_name: full_name.trim(),
      gender: gender || null,
      dob: dob || null
    };

    const patient = await createPatient(patientData);

    res.status(201).json({
      ok: true,
      patient
    });
  } catch (error) {
    console.error('Erreur lors de la création du patient:', error);
    res.status(500).json({ error: 'Erreur lors de la création du patient', message: error.message });
  }
});

module.exports = router;

