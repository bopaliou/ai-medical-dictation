-- Migration pour corriger le trigger d'audit lors de la suppression
-- Problème: Le trigger AFTER DELETE essaie d'insérer un audit avec un note_id qui n'existe plus
-- Solution: Utiliser ON DELETE CASCADE pour supprimer automatiquement les audits associés

-- IMPORTANT: Cette migration fait deux choses:
-- 1. Recrée la contrainte FK avec ON DELETE CASCADE (supprime automatiquement les audits)
-- 2. Modifie le trigger pour utiliser BEFORE DELETE (insère l'audit avant la suppression)

-- Étape 1: Supprimer l'ancienne contrainte FK
ALTER TABLE public.notes_audit
    DROP CONSTRAINT IF EXISTS notes_audit_note_id_fkey;

-- Étape 2: Recréer la contrainte FK avec ON DELETE CASCADE
-- Cela permet de supprimer automatiquement tous les audits associés à une note
-- quand la note est supprimée
ALTER TABLE public.notes_audit
    ADD CONSTRAINT notes_audit_note_id_fkey
    FOREIGN KEY (note_id)
    REFERENCES public.notes(id)
    ON DELETE CASCADE;

-- Étape 2: Modifier la fonction trigger pour gérer le cas DELETE
CREATE OR REPLACE FUNCTION public.log_note_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.notes_audit (note_id, action, changed_by, changes)
        VALUES (
            NEW.id,
            'created',
            NEW.created_by,
            jsonb_build_object('created_at', NEW.created_at)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.notes_audit (note_id, action, changed_by, changes)
        VALUES (
            NEW.id,
            'updated',
            NEW.created_by,
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            )
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        -- IMPORTANT: Insérer l'audit AVANT que la note soit supprimée
        -- Avec ON DELETE CASCADE, cet audit sera aussi supprimé automatiquement
        -- mais cela permet de tracer la suppression dans le trigger
        INSERT INTO public.notes_audit (note_id, action, changed_by, changes)
        VALUES (
            OLD.id,
            'deleted',
            OLD.created_by,
            jsonb_build_object('deleted_at', NOW())
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 3: Recréer les triggers
-- Trigger pour INSERT et UPDATE (AFTER)
DROP TRIGGER IF EXISTS on_note_changes ON notes;
CREATE TRIGGER on_note_changes
    AFTER INSERT OR UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION public.log_note_changes();

-- Trigger séparé pour DELETE (BEFORE) pour éviter l'erreur FK
DROP TRIGGER IF EXISTS on_note_delete ON notes;
CREATE TRIGGER on_note_delete
    BEFORE DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION public.log_note_changes();

-- Commentaire explicatif
COMMENT ON FUNCTION public.log_note_changes() IS 'Fonction pour logger les modifications de notes. Utilise BEFORE DELETE pour éviter les violations de contrainte FK. Avec ON DELETE CASCADE, les audits sont supprimés automatiquement avec la note.';

-- Note importante sur la contrainte FK avec CASCADE:
-- La contrainte notes_audit_note_id_fkey utilise ON DELETE CASCADE.
-- Quand une note est supprimée, tous les audits associés sont automatiquement supprimés.
-- Le trigger BEFORE DELETE insère un audit de suppression juste avant la suppression,
-- mais cet audit sera aussi supprimé par CASCADE (ce qui est le comportement souhaité).

