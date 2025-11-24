/**
 * Routes d'authentification
 * POST /api/auth/login - Connexion et obtention du token JWT
 * POST /api/auth/signup - Inscription d'un nouvel utilisateur
 * GET /api/auth/me - Récupération du profil utilisateur actuel
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Client Supabase pour l'authentification (utilise ANON_KEY)
// Selon la documentation Supabase: https://supabase.com/docs/guides/auth
// Pour l'authentification côté serveur, on utilise ANON_KEY pour signInWithPassword
// Note: Les nouvelles clés API (sb_publishable_...) sont supportées depuis supabase-js v2.40+
// Si vous avez des erreurs "Invalid API key", utilisez les Legacy API Keys au format JWT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion et obtention du token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nurse@hospital.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Token JWT à utiliser pour les requêtes authentifiées
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe requis' 
      });
    }

    // Vérification que le client Supabase est correctement configuré
    console.log('Tentative de connexion pour:', email);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY présente:', !!process.env.SUPABASE_ANON_KEY);
    console.log('Client Supabase initialisé:', !!supabase);

    // Connexion avec Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('=== ERREUR SUPABASE AUTH ===');
      console.error('Type d\'erreur:', error.name);
      console.error('Message:', error.message);
      console.error('Status:', error.status);
      console.error('Code d\'erreur Supabase:', error.code);
      console.error('Erreur complète:', JSON.stringify(error, null, 2));
      console.error('================================');
      
      // Messages d'erreur plus spécifiques
      if (error.message && error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Erreur de configuration Supabase',
          message: 'La clé API Supabase est invalide. Vérifiez SUPABASE_ANON_KEY dans .env'
        });
      }
      
      // Erreur spécifique pour compte non confirmé
      if (error.message && (error.message.includes('Email not confirmed') || error.message.includes('signup_disabled'))) {
        return res.status(401).json({ 
          error: 'Compte non confirmé',
          message: 'Votre compte n\'a pas été confirmé. Vérifiez votre email ou créez un nouveau compte.',
          hint: 'Si l\'email de confirmation n\'arrive pas, utilisez /api/auth/signup pour créer un compte'
        });
      }
      
      if (error.message && error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ 
          error: 'Identifiants invalides',
          message: 'Email ou mot de passe incorrect. Si vous n\'avez pas de compte, utilisez /api/auth/signup pour vous inscrire.',
          hint: 'Vérifiez que : 1) Le compte existe, 2) Le mot de passe est correct, 3) Le compte est confirmé (vérifiez votre email)'
        });
      }
      
      return res.status(401).json({ 
        error: 'Erreur d\'authentification',
        message: error.message || 'Identifiants invalides',
        errorCode: error.status
      });
    }

    if (!data.session) {
      // Si pas de session mais pas d'erreur, c'est probablement un problème de confirmation d'email
      return res.status(401).json({ 
        error: 'Session non créée',
        message: 'Impossible de créer une session. Vérifiez que :',
        hints: [
          '1. Votre compte est confirmé (vérifiez votre email)',
          '2. L\'email de confirmation n\'est pas expiré',
          '3. Vous pouvez réessayer de vous inscrire avec /api/auth/signup'
        ]
      });
    }

    // Récupération du token JWT depuis la session
    const token = data.session.access_token;

    res.json({
      ok: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la connexion',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [nurse, admin, auditor]
 *                 default: nurse
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/signup', async (req, res) => {
  try {
    // Vérification de la configuration Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Configuration Supabase manquante:', {
        hasUrl: !!process.env.SUPABASE_URL,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY
      });
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        message: 'SUPABASE_URL et SUPABASE_ANON_KEY doivent être configurés dans .env'
      });
    }

    const { email, password, full_name, role = 'nurse' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Email, mot de passe et nom complet requis' 
      });
    }

    // Vérifier que le client Supabase est correctement configuré
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Client Supabase non initialisé',
        message: 'Le client Supabase n\'a pas été correctement initialisé'
      });
    }

    console.log('Tentative d\'inscription pour:', email);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    
    // Vérification du format de la clé API
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (anonKey) {
      console.log('SUPABASE_ANON_KEY longueur:', anonKey.length);
      console.log('SUPABASE_ANON_KEY commence par:', anonKey.substring(0, 30));
      
      // Avertissement si la clé semble être au mauvais format
      if (anonKey.startsWith('sb_publishable_') || anonKey.startsWith('sb_secret_')) {
        console.warn('⚠️  ATTENTION: La clé semble être une Secret Key, pas une Publishable Key.');
        console.warn('⚠️  Dans Supabase Dashboard > Settings > API, utilisez la "Publishable key" (pas les Secret keys)');
      }
      
      if (!anonKey.startsWith('eyJ') && !anonKey.startsWith('sb_publishable_')) {
        console.warn('⚠️  Format de clé API non standard. Format attendu: eyJ... (JWT) ou sb_publishable_...');
      }
    }

    // Vérification avant l'inscription
    console.log('=== TENTATIVE D\'INSCRIPTION ===');
    console.log('Email:', email);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY présente:', !!process.env.SUPABASE_ANON_KEY);
    console.log('Client Supabase initialisé:', !!supabase);
    console.log('===============================');

    // Inscription avec Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role
        },
        emailRedirectTo: undefined // Pas de redirection pour une API
      }
    });

    console.log('=== RÉSULTAT DE L\'INSCRIPTION ===');
    console.log('Data:', data ? {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        email_confirmed: !!data.user.email_confirmed_at,
        created_at: data.user.created_at
      } : null,
      session: data.session ? 'Session créée' : 'Pas de session'
    } : 'Pas de data');
    console.log('Error:', error ? {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      fullError: JSON.stringify(error, null, 2)
    } : 'Pas d\'erreur');
    console.log('===================================');

    if (error) {
      console.error('❌ ERREUR SUPABASE AUTH LORS DE L\'INSCRIPTION ❌');
      console.error('Erreur complète:', JSON.stringify(error, null, 2));
      
      // Messages d'erreur plus spécifiques
      if (error.message && (error.message.includes('API key') || error.message.includes('Invalid API key'))) {
        return res.status(500).json({ 
          error: 'Erreur de configuration Supabase',
          message: 'La clé API Supabase est invalide. Vérifiez SUPABASE_ANON_KEY dans .env. Format attendu: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        });
      }
      
      if (error.message && error.message.includes('User already registered')) {
        return res.status(400).json({ 
          error: 'Utilisateur déjà enregistré',
          message: 'Un compte avec cet email existe déjà'
        });
      }
      
      return res.status(400).json({ 
        error: 'Erreur lors de l\'inscription',
        message: error.message || 'Une erreur est survenue lors de l\'inscription'
      });
    }

    // Création du profil dans la table profiles
    if (data.user) {
      console.log('✅ Utilisateur créé dans Supabase Auth:', data.user.id);
      
      // Vérifier que SERVICE_ROLE_KEY est configurée
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante pour créer le profil');
        return res.status(500).json({
          error: 'Configuration incomplète',
          message: 'SUPABASE_SERVICE_ROLE_KEY est requise pour créer le profil utilisateur'
        });
      }

      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      console.log('Création du profil dans la table profiles...');
      // Le schéma profiles n'a pas de colonne email (seulement: id, full_name, role, service, created_at)
      const profileDataToInsert = {
        id: data.user.id,
        full_name,
        role
        // Note: email n'est pas dans le schéma profiles, l'email est dans auth.users
      };
      
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileDataToInsert)
        .select();

      if (profileError) {
        console.error('❌ Erreur lors de la création du profil:', profileError);
        console.error('Détails:', JSON.stringify(profileError, null, 2));
        
        // Ne pas bloquer l'inscription si le profil existe déjà
        if (profileError.message && profileError.message.includes('duplicate key')) {
          console.warn('⚠️  Le profil existe déjà, ce n\'est pas grave');
        } else {
          console.warn('⚠️  Profil non créé, mais l\'utilisateur a été créé dans Auth');
          console.warn('⚠️  Vous pouvez créer le profil manuellement dans Supabase Dashboard');
        }
      } else {
        console.log('✅ Profil créé avec succès:', profileData);
      }
    } else {
      console.warn('⚠️  Pas d\'utilisateur créé (data.user est null)');
    }

    // Vérifier si l'email doit être confirmé
    const emailConfirmed = data.user?.email_confirmed_at !== null;
    const needsConfirmation = !emailConfirmed;

    // Si pas de session, le compte nécessite une confirmation d'email
    if (!data.session && needsConfirmation) {
      console.warn('⚠️  Compte créé mais non confirmé. Confirmez l\'email pour pouvoir vous connecter.');
      console.warn('⚠️  Solution: Désactivez la confirmation email dans Supabase Dashboard > Authentication > Providers > Email');
    }

    res.status(201).json({
      ok: true,
      message: needsConfirmation 
        ? 'Utilisateur créé avec succès. Vérifiez votre email pour confirmer votre compte OU désactivez la confirmation email dans Supabase Dashboard.'
        : 'Utilisateur créé avec succès. Vous pouvez maintenant vous connecter.',
      needsEmailConfirmation: needsConfirmation,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed: emailConfirmed
      },
      session: data.session ? 'Session créée - vous pouvez vous connecter' : 'Aucune session - confirmez votre email d\'abord',
      hint: needsConfirmation 
        ? 'Pour désactiver la confirmation email: Supabase Dashboard > Authentication > Providers > Email > Disable "Confirm email"'
        : undefined
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'inscription',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupère le profil de l'utilisateur authentifié
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Récupération du profil complet depuis la base de données
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        error: 'Profil utilisateur introuvable' 
      });
    }

    res.json({
      ok: true,
      user: {
        ...profile,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du profil',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /api/auth/signup-and-login:
 *   post:
 *     summary: Crée un compte et se connecte automatiquement (contourne la confirmation email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [nurse, admin, auditor]
 *                 default: nurse
 *     responses:
 *       200:
 *         description: Compte créé et connecté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/signup-and-login', async (req, res) => {
  try {
    const { email, password, full_name, role = 'nurse' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ 
        error: 'Email, mot de passe et nom complet requis' 
      });
    }

    // Vérifier que SERVICE_ROLE_KEY est configurée
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        error: 'Configuration incomplète',
        message: 'SUPABASE_SERVICE_ROLE_KEY est requise pour créer et confirmer automatiquement le compte'
      });
    }

    console.log('=== CRÉATION ET CONNEXION AUTOMATIQUE ===');
    console.log('Email:', email);

    // Utiliser SERVICE_ROLE_KEY pour créer et confirmer directement le compte
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId;
    
    if (existingUser) {
      console.log('Utilisateur existe déjà:', existingUser.id);
      userId = existingUser.id;
      
      // Confirmer l'email s'il n'est pas confirmé
      if (!existingUser.email_confirmed_at) {
        console.log('Confirmation de l\'email...');
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true
        });
      }
    } else {
      // 1. Créer l'utilisateur avec le service role (bypass la confirmation email)
      console.log('Étape 1: Création de l\'utilisateur...');
      const { data: signupData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmer automatiquement l'email
        user_metadata: {
          full_name,
          role
        }
      });

      if (signupError) {
        console.error('Erreur lors de la création:', signupError);
        return res.status(400).json({
          error: 'Erreur lors de la création',
          message: signupError.message
        });
      }

      if (!signupData.user) {
        return res.status(400).json({
          error: 'Utilisateur non créé',
          message: 'Impossible de créer l\'utilisateur'
        });
      }

      userId = signupData.user.id;
      console.log('✅ Utilisateur créé:', userId);
    }

    // 2. Créer le profil dans la table profiles
    console.log('Étape 2: Création du profil...');
    await createProfileIfNeeded(userId, full_name, role, supabaseAdmin);

    // 3. Se connecter avec le client normal pour obtenir un token
    console.log('Étape 3: Connexion pour obtenir le token...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError || !loginData.session) {
      console.error('Erreur lors de la connexion:', loginError);
      return res.status(401).json({
        error: 'Erreur de connexion',
        message: loginError?.message || 'Impossible de créer une session. Vérifiez le mot de passe.',
        hint: 'L\'utilisateur a été créé mais la connexion a échoué. Utilisez /api/auth/login pour vous connecter.'
      });
    }

    console.log('✅ Connexion réussie');

    res.json({
      ok: true,
      token: loginData.session.access_token,
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        full_name,
        role,
        email_confirmed: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création/connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la création/connexion',
      message: error.message
    });
  }
});

/**
 * Helper pour créer le profil dans la table profiles
 */
async function createProfileIfNeeded(userId, fullName, role, supabaseAdmin) {
  try {
    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      console.log('Profil existe déjà');
      return;
    }

    // Créer le profil
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role
      })
      .select();

    if (profileError) {
      if (profileError.message && profileError.message.includes('duplicate key')) {
        console.log('Profil existe déjà (duplicate key)');
      } else {
        console.error('Erreur lors de la création du profil:', profileError);
      }
    } else {
      console.log('✅ Profil créé avec succès');
    }
  } catch (error) {
    console.error('Erreur dans createProfileIfNeeded:', error);
  }
}

module.exports = router;
