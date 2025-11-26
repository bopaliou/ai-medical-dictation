-- Migration: Ajouter les champs age, room_number et unit à la table patients
-- Date: 2024-01-XX

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS room_number TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN patients.age IS 'Âge du patient (texte pour flexibilité)';
COMMENT ON COLUMN patients.room_number IS 'Numéro de chambre du patient';
COMMENT ON COLUMN patients.unit IS 'Unité/service du patient';

