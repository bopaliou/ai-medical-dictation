/**
 * Script pour supprimer toutes les données de la table patients depuis Supabase
 * 
 * Usage: node scripts/clear-patients.js
 * 
 * ATTENTION: Cette opération est irréversible !
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

async function clearPatients() {
  try {
    console.log('🗑️  Suppression de toutes les données de la table patients...\n');

    // Compter d'abord le nombre de patients
    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Nombre de patients à supprimer: ${patientCount || 0}`);

    if (patientCount === 0) {
      console.log('✅ La table patients est déjà vide.');
      return;
    }

    // Compter les notes associées (seront supprimées via CASCADE)
    const { count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Nombre de notes associées (seront supprimées): ${notesCount || 0}\n`);

    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('⚠️  Êtes-vous sûr de vouloir supprimer TOUS les patients ? (oui/non): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée.');
      return;
    }

    // Supprimer tous les patients
    // Les notes seront supprimées automatiquement via CASCADE
    const { error } = await supabase
      .from('patients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition toujours vraie pour tout supprimer

    if (error) {
      throw error;
    }

    // Vérifier que la suppression a réussi
    const { count: remainingCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    console.log('\n✅ Suppression terminée !');
    console.log(`📊 Patients restants: ${remainingCount || 0}`);
    
    if (remainingCount === 0) {
      console.log('✅ La table patients est maintenant vide.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
clearPatients()
  .then(() => {
    console.log('\n✨ Script terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

