/**
 * Script pour supprimer toutes les données de Supabase SAUF les profils
 * 
 * Usage: node scripts/clear-all-data.js
 * 
 * ATTENTION: Cette opération est irréversible !
 * Supprime: patients, notes, notes_audit, fichiers audio et PDFs
 * Conserve: profiles (utilisateurs)
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

// Noms des buckets
const BUCKET_AUDIO = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio-recordings';
const BUCKET_PDFS = process.env.SUPABASE_STORAGE_BUCKET_PDFS || 'medical-notes-pdf';

async function clearAllData() {
  try {
    console.log('🗑️  Nettoyage de toutes les données (sauf profils)...\n');

    // Compter les données existantes
    const { count: patientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const { count: notesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });

    const { count: auditCount } = await supabase
      .from('notes_audit')
      .select('*', { count: 'exact', head: true });

    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log('📊 État actuel de la base de données:');
    console.log(`   • Profils (conservés): ${profilesCount || 0}`);
    console.log(`   • Patients (à supprimer): ${patientsCount || 0}`);
    console.log(`   • Notes (à supprimer): ${notesCount || 0}`);
    console.log(`   • Logs d'audit (à supprimer): ${auditCount || 0}\n`);

    if (patientsCount === 0 && notesCount === 0 && auditCount === 0) {
      console.log('✅ La base de données est déjà vide (sauf profils).');
      return;
    }

    // Demander confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('⚠️  Êtes-vous sûr de vouloir supprimer TOUTES les données (patients, notes, audit, fichiers) ? (oui/non): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée.');
      return;
    }

    console.log('\n🔄 Début du nettoyage...\n');

    // 0. Désactiver temporairement le trigger pour éviter les erreurs de clé étrangère
    console.log('0️⃣  Désactivation temporaire du trigger on_note_changes...');
    try {
      // Essayer de désactiver le trigger via SQL
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE notes DISABLE TRIGGER on_note_changes;'
      });
      if (triggerError) {
        console.warn('   ⚠️  Impossible de désactiver le trigger (peut-être pas de fonction RPC):', triggerError.message);
        console.log('   💡 Continuons sans désactiver le trigger...');
      } else {
        console.log('   ✅ Trigger désactivé');
      }
    } catch (error) {
      console.warn('   ⚠️  Erreur lors de la désactivation du trigger:', error.message);
      console.log('   💡 Continuons sans désactiver le trigger...');
    }

    // 1. Supprimer les logs d'audit existants (avant de supprimer les notes)
    console.log('1️⃣  Suppression des logs d\'audit existants...');
    const { error: auditError1 } = await supabase
      .from('notes_audit')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition toujours vraie

    if (auditError1) {
      console.error('   ⚠️  Erreur lors de la suppression des logs d\'audit:', auditError1.message);
    } else {
      console.log('   ✅ Logs d\'audit existants supprimés');
    }

    // 2. Supprimer les notes une par une pour éviter les problèmes de trigger
    console.log('2️⃣  Suppression des notes...');
    try {
      // Récupérer toutes les notes d'abord
      const { data: allNotes, error: fetchError } = await supabase
        .from('notes')
        .select('id');

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération des notes: ${fetchError.message}`);
      }

      if (allNotes && allNotes.length > 0) {
        // Supprimer les notes une par une
        for (const note of allNotes) {
          const { error: deleteError } = await supabase
            .from('notes')
            .delete()
            .eq('id', note.id);

          if (deleteError) {
            console.warn(`   ⚠️  Erreur lors de la suppression de la note ${note.id}:`, deleteError.message);
          }
        }
        console.log(`   ✅ ${allNotes.length} note(s) supprimée(s)`);
      } else {
        console.log('   ✅ Aucune note à supprimer');
      }
    } catch (error) {
      console.error('   ⚠️  Erreur lors de la suppression des notes:', error.message);
    }

    // 3. Supprimer les nouveaux logs d'audit créés par le trigger lors de la suppression des notes
    console.log('3️⃣  Suppression des nouveaux logs d\'audit créés par le trigger...');
    const { error: auditError2 } = await supabase
      .from('notes_audit')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (auditError2) {
      console.error('   ⚠️  Erreur lors de la suppression des nouveaux logs:', auditError2.message);
    } else {
      console.log('   ✅ Nouveaux logs d\'audit supprimés');
    }

    // Réactiver le trigger
    console.log('⚙️  Réactivation du trigger on_note_changes...');
    try {
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE notes ENABLE TRIGGER on_note_changes;'
      });
      if (triggerError) {
        console.warn('   ⚠️  Impossible de réactiver le trigger:', triggerError.message);
      } else {
        console.log('   ✅ Trigger réactivé');
      }
    } catch (error) {
      console.warn('   ⚠️  Erreur lors de la réactivation du trigger:', error.message);
    }

    // 4. Supprimer les patients
    console.log('4️⃣  Suppression des patients...');
    const { error: patientsError } = await supabase
      .from('patients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (patientsError) {
      console.error('   ⚠️  Erreur lors de la suppression des patients:', patientsError.message);
    } else {
      console.log('   ✅ Patients supprimés');
    }

    // 5. Nettoyer le storage (fichiers audio)
    console.log('5️⃣  Nettoyage du storage audio...');
    try {
      const { data: audioFiles, error: listAudioError } = await supabase.storage
        .from(BUCKET_AUDIO)
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listAudioError) {
        console.error('   ⚠️  Erreur lors de la liste des fichiers audio:', listAudioError.message);
      } else if (audioFiles && audioFiles.length > 0) {
        const filesToDelete = audioFiles.map(file => file.name);
        const { error: deleteAudioError } = await supabase.storage
          .from(BUCKET_AUDIO)
          .remove(filesToDelete);

        if (deleteAudioError) {
          console.error('   ⚠️  Erreur lors de la suppression des fichiers audio:', deleteAudioError.message);
        } else {
          console.log(`   ✅ ${filesToDelete.length} fichier(s) audio supprimé(s)`);
        }
      } else {
        console.log('   ✅ Aucun fichier audio à supprimer');
      }
    } catch (error) {
      console.error('   ⚠️  Erreur lors du nettoyage audio:', error.message);
    }

    // 6. Nettoyer le storage (fichiers PDF)
    console.log('6️⃣  Nettoyage du storage PDF...');
    try {
      // Lister tous les dossiers et fichiers dans le bucket PDF
      const { data: pdfFolders, error: listPdfFoldersError } = await supabase.storage
        .from(BUCKET_PDFS)
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (listPdfFoldersError) {
        console.error('   ⚠️  Erreur lors de la liste des dossiers PDF:', listPdfFoldersError.message);
      } else if (pdfFolders && pdfFolders.length > 0) {
        // Supprimer tous les fichiers PDF (récursif)
        const filesToDelete = [];
        
        for (const item of pdfFolders) {
          if (item.id) {
            // C'est un fichier
            filesToDelete.push(item.name);
          } else {
            // C'est un dossier, lister les fichiers dedans
            const { data: folderFiles } = await supabase.storage
              .from(BUCKET_PDFS)
              .list(item.name, { limit: 1000 });
            
            if (folderFiles) {
              folderFiles.forEach(file => {
                filesToDelete.push(`${item.name}/${file.name}`);
              });
            }
          }
        }

        if (filesToDelete.length > 0) {
          const { error: deletePdfError } = await supabase.storage
            .from(BUCKET_PDFS)
            .remove(filesToDelete);

          if (deletePdfError) {
            console.error('   ⚠️  Erreur lors de la suppression des fichiers PDF:', deletePdfError.message);
          } else {
            console.log(`   ✅ ${filesToDelete.length} fichier(s) PDF supprimé(s)`);
          }
        } else {
          console.log('   ✅ Aucun fichier PDF à supprimer');
        }
      } else {
        console.log('   ✅ Aucun fichier PDF à supprimer');
      }
    } catch (error) {
      console.error('   ⚠️  Erreur lors du nettoyage PDF:', error.message);
    }

    // Vérifier le résultat final
    console.log('\n📊 Vérification finale...\n');

    const { count: finalPatientsCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const { count: finalNotesCount } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true });

    const { count: finalAuditCount } = await supabase
      .from('notes_audit')
      .select('*', { count: 'exact', head: true });

    const { count: finalProfilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log('📊 État final de la base de données:');
    console.log(`   • Profils (conservés): ${finalProfilesCount || 0}`);
    console.log(`   • Patients: ${finalPatientsCount || 0}`);
    console.log(`   • Notes: ${finalNotesCount || 0}`);
    console.log(`   • Logs d'audit: ${finalAuditCount || 0}\n`);

    if (finalPatientsCount === 0 && finalNotesCount === 0 && finalAuditCount === 0) {
      console.log('✅ Nettoyage terminé avec succès !');
      console.log('✅ Toutes les données ont été supprimées (sauf profils).');
    } else {
      console.log('⚠️  Certaines données n\'ont pas pu être supprimées.');
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
clearAllData()
  .then(() => {
    console.log('\n✨ Script terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

