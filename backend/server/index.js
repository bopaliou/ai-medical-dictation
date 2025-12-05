/**
 * Serveur Express pour l'API de dictée médicale
 * Gère l'upload audio, transcription Whisper, structuration GPT, génération PDF
 */

// Charger les variables d'environnement depuis la racine du projet
// __dirname est backend/server/, donc .env à la racine est à ../../.env
const path = require('path');
const fs = require('fs');
const rootEnvPath = path.resolve(__dirname, '../../.env');
const backendEnvPath = path.resolve(__dirname, '../.env');

// Priorité : 1. Fichier à la racine, 2. Fichier dans backend/, 3. Répertoire courant
let envPath;
if (fs.existsSync(rootEnvPath)) {
  envPath = rootEnvPath;
  console.log('✅ Fichier .env chargé depuis la racine du projet:', envPath);
} else if (fs.existsSync(backendEnvPath)) {
  envPath = backendEnvPath;
  console.log('✅ Fichier .env chargé depuis backend/:', envPath);
} else {
  envPath = undefined;
  console.warn('⚠️  Aucun fichier .env trouvé. Tentative de chargement depuis le répertoire courant...');
}

require('dotenv').config({ path: envPath });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');

// Vérification des variables d'environnement requises
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars.join(', '));
  console.error('⚠️  Vérifiez votre fichier .env à la racine du projet ou dans le dossier backend/');
  console.error('⚠️  Le serveur démarrera mais certaines fonctionnalités ne fonctionneront pas.');
}

// Import des routes
const authRoutes = require('../routes/auth');
const uploadRoutes = require('../routes/upload');
const patientsRoutes = require('../routes/patients');
const notesRoutes = require('../routes/notes');
const reportRoutes = require('../routes/report');

// Configuration Express
const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactiver pour Swagger UI
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.MOBILE_APP_URL || '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use('/api/', limiter);

// Route pour récupérer le JSON OpenAPI (doit être avant Swagger UI)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Documentation Swagger/OpenAPI
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Medical Dictation API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    url: '/api-docs.json'
  }
};

// Servir les fichiers statiques de Swagger UI
// swaggerUi.serve est un tableau de middlewares pour servir les fichiers statiques
const swaggerUiMiddleware = swaggerUi.setup(swaggerSpec, swaggerUiOptions);
app.use('/api-docs', ...swaggerUi.serve, swaggerUiMiddleware);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Medical Dictation API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      docs: 'GET /api-docs',
      apiDocsJson: 'GET /api-docs.json',
      auth: {
        login: 'POST /api/auth/login (avec {email, password})',
        signup: 'POST /api/auth/signup (avec {email, password, full_name, role?})',
        signupAndLogin: 'POST /api/auth/signup-and-login (crée et connecte automatiquement, avec {email, password, full_name, role?})',
        me: 'GET /api/auth/me (requiert authentification)'
      },
      upload: 'POST /api/upload/audio',
      patients: 'GET /api/patients, GET /api/patients/:id, POST /api/patients, PATCH /api/patients/:id',
      notes: 'GET /api/notes/:patient_id'
    }
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifie l'état de santé du serveur
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/reports', reportRoutes); // Alias pour GET /api/reports, DELETE /api/reports/:id et PATCH /api/reports/:id

// Log des routes enregistrées (en développement)
if (process.env.NODE_ENV !== 'production') {
  console.log('\n📋 Routes API enregistrées:');
  console.log('   GET    /api/reports - Liste des rapports');
  console.log('   POST   /api/report/generate - Génération PDF');
  console.log('   DELETE /api/reports/:id - Suppression rapport');
  console.log('   PATCH  /api/reports/:id - Mise à jour statut');
  console.log('\n📋 Routes Patients enregistrées:');
  console.log('   GET    /api/patients - Liste des patients');
  console.log('   GET    /api/patients/:id - Détails d\'un patient');
  console.log('   POST   /api/patients - Créer un patient');
  console.log('   PATCH  /api/patients/:id - Mettre à jour un patient');
  console.log('   DELETE /api/patients/:id - Supprimer un patient\n');
  
  // Test de la route GET /api/reports (sans authentification pour le test)
  console.log('🔍 Test de la route GET /api/reports...');
  console.log('   URL complète: http://localhost:3000/api/reports');
  console.log('   Méthode: GET');
  console.log('   Authentification requise: Oui (Bearer token)\n');
}

// Route 404 - Doit être la dernière route définie
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    hint: req.method === 'GET' && req.path === '/api/auth/login' 
      ? 'Cette route utilise POST, pas GET. Utilisez POST /api/auth/login avec email et password dans le body.'
      : undefined,
    availableEndpoints: {
      health: 'GET /health',
      docs: 'GET /api-docs',
      apiDocsJson: 'GET /api-docs.json',
        auth: {
          login: 'POST /api/auth/login (avec {email, password})',
          signup: 'POST /api/auth/signup (avec {email, password, full_name, role?})',
          signupAndLogin: 'POST /api/auth/signup-and-login (crée et connecte automatiquement, avec {email, password, full_name, role?})',
          me: 'GET /api/auth/me (requiert authentification)'
        },
      upload: 'POST /api/upload/audio (requiert authentification)',
      patients: 'GET /api/patients, GET /api/patients/:id, POST /api/patients, PATCH /api/patients/:id, DELETE /api/patients/:id (requiert authentification)',
      notes: 'GET /api/notes/:patient_id (requiert authentification)'
    }
  });
});

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrage du serveur
// Écouter sur 0.0.0.0 pour permettre l'accès depuis d'autres appareils sur le réseau
const HOST = process.env.BACKEND_HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Serveur accessible sur:`);
  console.log(`   - http://localhost:${PORT}`);
  console.log(`   - http://127.0.0.1:${PORT}`);
  
  // Afficher toutes les IPs réseau disponibles
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const ips = [];
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(`   - http://${iface.address}:${PORT}`);
      }
    });
  });
  if (ips.length > 0) {
    console.log(`   IPs réseau disponibles:`);
    ips.forEach(ip => console.log(ip));
  }
  
  console.log(`📚 Documentation API disponible sur http://localhost:${PORT}/api-docs`);
});

module.exports = app;

