/**
 * Middleware d'authentification JWT Supabase
 * Valide les tokens JWT émis par Supabase Auth
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Client Supabase pour vérification des tokens
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware pour vérifier l'authentification JWT
 * Extrait le token depuis l'en-tête Authorization
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraction du token depuis l'en-tête
    const authHeader = req.headers.authorization;
    
    // Logs pour déboguer
    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'MANQUANT');
    console.log('Headers reçus:', Object.keys(req.headers));
    
    if (!authHeader) {
      console.log('❌ Aucun en-tête Authorization trouvé');
      return res.status(401).json({ error: 'Token manquant ou invalide', hint: 'Ajoutez l\'en-tête Authorization: Bearer <token>' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Format incorrect. Attendu: "Bearer <token>", reçu:', authHeader.substring(0, 20));
      return res.status(401).json({ 
        error: 'Token manquant ou invalide',
        hint: 'Le format doit être: Authorization: Bearer <token>',
        received: authHeader.substring(0, 30) + '...'
      });
    }

    const token = authHeader.substring(7); // Enlève "Bearer "
    console.log('Token extrait (premiers 30 caractères):', token.substring(0, 30) + '...');

    // Vérification du token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Erreur de vérification du token:', error?.message || 'User non trouvé');
      return res.status(401).json({ 
        error: 'Token invalide ou expiré',
        message: error?.message || 'Impossible de vérifier le token',
        hint: 'Vérifiez que le token est valide et n\'a pas expiré. Reconnectez-vous si nécessaire.'
      });
    }
    
    console.log('✅ Token valide pour utilisateur:', user.email);
    console.log('==============================');

    // Ajout des informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
      user_metadata: user.user_metadata // Garder aussi user_metadata pour le middleware authorize
    };

    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(401).json({ error: 'Erreur d\'authentification' });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {string[]} allowedRoles - Liste des rôles autorisés
 */
const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentification requise' });
      }

      // Client Supabase avec SERVICE_ROLE_KEY pour créer le profil si nécessaire
      const { createClient } = require('@supabase/supabase-js');
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Récupération du profil utilisateur depuis la base de données
      let { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('id', req.user.id)
        .single();

      // Si le profil n'existe pas (code PGRST116 = "No rows returned"), essayer de le créer
      if (error || !profile) {
        // Vérifier si c'est bien une erreur "profil non trouvé" (code PGRST116)
        const isNotFoundError = error?.code === 'PGRST116' || error?.message?.includes('No rows') || !profile;
        
        if (isNotFoundError) {
          console.log('Profil introuvable, tentative de création depuis les métadonnées...');
          
          // Récupérer les métadonnées depuis req.user (qui contient user_metadata du token)
          const fullName = req.user.full_name || req.user.user_metadata?.full_name || 'Utilisateur';
          const role = req.user.role || req.user.user_metadata?.role || 'nurse';

          // Créer le profil
          const { data: newProfile, error: createError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: req.user.id,
              full_name: fullName,
              role: role
            })
            .select('role, full_name')
            .single();

          if (createError || !newProfile) {
            // Si c'est une erreur de clé dupliquée, le profil existe peut-être maintenant
            if (createError?.code === '23505' || createError?.message?.includes('duplicate key')) {
              // Réessayer de récupérer le profil
              const { data: retryProfile } = await supabaseAdmin
                .from('profiles')
                .select('role, full_name')
                .eq('id', req.user.id)
                .single();
              
              if (retryProfile) {
                profile = retryProfile;
                console.log('✅ Profil trouvé après tentative de création (duplicate key)');
              } else {
                console.error('Erreur lors de la création du profil:', createError);
                return res.status(403).json({ 
                  error: 'Profil utilisateur introuvable',
                  message: 'Impossible de créer le profil. Contactez un administrateur.',
                  hint: 'Le profil doit être créé dans la table profiles avec id, full_name et role'
                });
              }
            } else {
              console.error('Erreur lors de la création du profil:', createError);
              return res.status(403).json({ 
                error: 'Profil utilisateur introuvable',
                message: 'Impossible de créer le profil. Contactez un administrateur.',
                hint: 'Le profil doit être créé dans la table profiles avec id, full_name et role'
              });
            }
          } else {
            profile = newProfile;
            console.log('✅ Profil créé automatiquement:', profile);
          }
        } else {
          // Autre type d'erreur (connexion, permissions, etc.)
          console.error('Erreur lors de la récupération du profil:', error);
          return res.status(403).json({ 
            error: 'Profil utilisateur introuvable',
            message: error?.message || 'Erreur lors de la vérification du profil'
          });
        }
      }

      const userRole = profile.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}` 
        });
      }

      req.user.role = userRole;
      req.user.full_name = profile.full_name;
      next();
    } catch (error) {
      console.error('Erreur d\'autorisation:', error);
      return res.status(500).json({ error: 'Erreur lors de la vérification des permissions' });
    }
  };
};

/**
 * Helper pour vérifier si l'utilisateur est propriétaire de la ressource
 * @param {string} resourceUserId - ID de l'utilisateur propriétaire de la ressource
 * @param {string} currentUserId - ID de l'utilisateur actuel
 * @param {string} userRole - Rôle de l'utilisateur actuel
 */
const isOwnerOrAdmin = (resourceUserId, currentUserId, userRole) => {
  return resourceUserId === currentUserId || userRole === 'admin';
};

module.exports = {
  authenticate,
  authorize,
  isOwnerOrAdmin
};

