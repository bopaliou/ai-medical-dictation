-- Script pour supprimer toutes les données de la table patients
-- ATTENTION: Cette opération est irréversible !

-- Supprimer toutes les notes associées aux patients (à cause de la contrainte CASCADE)
-- Puis supprimer tous les patients

-- Option 1: Supprimer uniquement les patients (les notes seront supprimées automatiquement via CASCADE)
DELETE FROM patients;

-- Option 2: Si vous voulez aussi supprimer les notes manuellement avant:
-- DELETE FROM notes;
-- DELETE FROM patients;

-- Vérifier que la table est vide
SELECT COUNT(*) as remaining_patients FROM patients;

-- Réinitialiser la séquence si vous utilisez des IDs auto-incrémentés
-- (Non applicable ici car on utilise UUID, mais au cas où)
-- ALTER SEQUENCE patients_id_seq RESTART WITH 1;

