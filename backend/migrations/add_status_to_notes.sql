-- Migration: Ajouter la colonne status à la table notes
-- Permet de gérer les statuts: draft, final, trash

-- Ajouter la colonne status si elle n'existe pas
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'final', 'trash'));

-- Mettre à jour les notes existantes avec le statut 'final' par défaut
UPDATE notes 
SET status = 'final' 
WHERE status IS NULL;

-- Ajouter un index pour améliorer les performances des requêtes filtrées par statut
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);

-- Commentaire sur la colonne
COMMENT ON COLUMN notes.status IS 'Statut du rapport: draft (brouillon), final (rapport final), trash (corbeille)';

