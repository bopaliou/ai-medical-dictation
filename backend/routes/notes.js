/**
 * Routes pour la gestion des notes
 * GET /api/notes/recent - Récupère les notes récentes de l'utilisateur connecté
 * GET /api/notes/:patient_id - Récupère l'historique des notes d'un patient
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getNotesByPatient, getRecentNotesByUser } = require('../services/supabase');

const router = express.Router();

/**
 * @swagger
 * /api/notes/recent:
 *   get:
 *     summary: Récupère les notes récentes de l'utilisateur connecté
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de notes à retourner
 *     responses:
 *       200:
 *         description: Liste des notes récentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
// IMPORTANT: Cette route doit être définie AVANT /:patient_id pour éviter que "recent" soit traité comme un UUID
router.get('/recent', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    console.log('📋 Récupération des notes récentes pour l\'utilisateur:', userId);
    const notes = await getRecentNotesByUser(userId, limit);

    console.log(`✅ ${notes.length} notes récentes récupérées`);
    res.json({
      ok: true,
      notes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notes récentes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes récentes', message: error.message });
  }
});

/**
 * @swagger
 * /api/notes/{patient_id}:
 *   get:
 *     summary: Récupère l'historique des notes d'un patient
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du patient
 *     responses:
 *       200:
 *         description: Liste des notes du patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:patient_id', authenticate, authorize(['nurse', 'admin', 'auditor']), async (req, res) => {
  try {
    const { patient_id } = req.params;

    const notes = await getNotesByPatient(patient_id);

    res.json({
      ok: true,
      notes
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes', message: error.message });
  }
});

module.exports = router;

