/**
 * Script pour créer les buckets Supabase Storage nécessaires
 * Usage: node scripts/setup-storage-buckets.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_AUDIO = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio-recordings';
const BUCKET_PDFS = process.env.SUPABASE_STORAGE_BUCKET_PDFS || 'medical-notes-pdf';

/**
 * Crée un bucket dans Supabase Storage s'il n'existe pas
 * @param {string} bucketName - Nom du bucket
 * @param {Object} options - Options du bucket (public, fileSizeLimit, etc.)
 * @returns {Promise<boolean>} - true si créé avec succès, false sinon
 */
async function createBucketIfNotExists(bucketName, options = {}) {
  try {
    // Vérifier si le bucket existe déjà
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Erreur lors de la liste des buckets: ${listError.message}`);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' existe déjà`);
      return true;
    }
    
    // Créer le bucket
    console.log(`📦 Création du bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: options.public !== false, // Par défaut public pour permettre l'accès aux fichiers
      fileSizeLimit: options.fileSizeLimit || 52428800, // 50 MB par défaut
      allowedMimeTypes: options.allowedMimeTypes || null, // Tous les types autorisés par défaut
    });
    
    if (error) {
      console.error(`❌ Erreur lors de la création du bucket '${bucketName}':`, error.message);
      return false;
    }
    
    console.log(`✅ Bucket '${bucketName}' créé avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la création du bucket '${bucketName}':`, error.message);
    return false;
  }
}

/**
 * Configure les politiques RLS pour un bucket
 * @param {string} bucketName - Nom du bucket
 * @returns {Promise<boolean>}
 */
async function setupBucketPolicies(bucketName) {
  try {
    console.log(`🔐 Configuration des politiques pour le bucket '${bucketName}'...`);
    
    // Note: Les politiques RLS sont généralement configurées via l'interface Supabase
    // ou via SQL. Ici, on vérifie juste que le bucket est public.
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error(`❌ Erreur lors de la vérification des buckets: ${error.message}`);
      return false;
    }
    
    const bucket = buckets.find(b => b.name === bucketName);
    if (bucket) {
      console.log(`   ✅ Bucket trouvé: ${bucket.name}`);
      console.log(`   📋 Public: ${bucket.public ? 'Oui' : 'Non'}`);
      console.log(`   📋 Taille max fichier: ${bucket.fileSizeLimit ? `${bucket.fileSizeLimit / 1024 / 1024} MB` : 'Illimitée'}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la configuration des politiques:`, error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function setupStorageBuckets() {
  try {
    console.log('🚀 Configuration des buckets Supabase Storage...\n');
    
    // Créer le bucket audio
    console.log('1️⃣  Configuration du bucket audio...');
    const audioCreated = await createBucketIfNotExists(BUCKET_AUDIO, {
      public: true,
      fileSizeLimit: 104857600, // 100 MB pour les fichiers audio
      allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/m4a', 'audio/flac', 'audio/ogg']
    });
    
    if (audioCreated) {
      await setupBucketPolicies(BUCKET_AUDIO);
    }
    console.log('');
    
    // Créer le bucket PDFs
    console.log('2️⃣  Configuration du bucket PDFs...');
    const pdfsCreated = await createBucketIfNotExists(BUCKET_PDFS, {
      public: true,
      fileSizeLimit: 10485760, // 10 MB pour les PDFs
      allowedMimeTypes: ['application/pdf']
    });
    
    if (pdfsCreated) {
      await setupBucketPolicies(BUCKET_PDFS);
    }
    console.log('');
    
    // Résumé
    console.log('📋 Résumé:');
    console.log(`   ✅ Bucket audio: ${audioCreated ? 'Configuré' : 'Erreur'}`);
    console.log(`   ✅ Bucket PDFs: ${pdfsCreated ? 'Configuré' : 'Erreur'}`);
    console.log('');
    
    if (audioCreated && pdfsCreated) {
      console.log('✅ Tous les buckets sont configurés avec succès !');
      console.log('');
      console.log('💡 Note: Si vous avez des problèmes d\'accès aux fichiers, vérifiez les politiques RLS dans Supabase:');
      console.log('   - Allez dans Storage > Policies');
      console.log('   - Assurez-vous que les buckets sont publics ou que les politiques permettent l\'accès');
    } else {
      console.error('❌ Certains buckets n\'ont pas pu être créés. Vérifiez les erreurs ci-dessus.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des buckets:', error);
    process.exit(1);
  }
}

// Exécuter le script
setupStorageBuckets();

