-- ============================================
-- Politiques RLS SÉCURISÉES pour Supabase Storage
-- ============================================
-- Les PDFs sont accessibles uniquement par :
-- 1. L'utilisateur qui a généré le PDF (created_by)
-- 2. Les utilisateurs avec le rôle 'admin' (top user)
-- ============================================

-- ============================================
-- FONCTION HELPER : Vérifier l'accès à un PDF
-- ============================================
-- Cette fonction vérifie si l'utilisateur actuel peut accéder à un PDF
-- en vérifiant la table 'notes' pour trouver le created_by

CREATE OR REPLACE FUNCTION storage.check_pdf_access(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  note_created_by UUID;
  current_user_id UUID;
  user_role TEXT;
  file_name_only TEXT;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel depuis auth.uid()
  current_user_id := auth.uid();
  
  -- Si pas d'utilisateur authentifié, refuser l'accès
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Récupérer le rôle de l'utilisateur depuis la table profiles
  SELECT role INTO user_role
  FROM profiles
  WHERE id = current_user_id;
  
  -- Si l'utilisateur est admin, autoriser l'accès à tous les PDFs
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Extraire le nom du fichier depuis le path complet
  -- Format du path dans storage: pdfs/{patient_id}/{timestamp}-note.pdf
  -- Format du pdf_url stocké: https://...supabase.co/storage/v1/object/public/medical-notes-pdf/pdfs/{patient_id}/{timestamp}-note.pdf
  -- On extrait juste le nom du fichier (dernière partie après le dernier /)
  file_name_only := substring(file_path from '[^/]+$');
  
  -- Chercher la note correspondante via le pdf_url
  -- Le pdf_url contient le path complet, on cherche où il contient le nom du fichier
  SELECT created_by INTO note_created_by
  FROM notes
  WHERE pdf_url LIKE '%' || file_name_only || '%'
     OR pdf_url LIKE '%' || file_path || '%'
  LIMIT 1;
  
  -- Si aucune note trouvée, refuser l'accès
  IF note_created_by IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si l'utilisateur actuel est le créateur de la note
  RETURN note_created_by = current_user_id;
END;
$$;

-- ============================================
-- BUCKET: medical-notes-pdf
-- ============================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can read their own PDFs or admin can read all" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs or admin can delete all" ON storage.objects;

-- Politique pour la lecture : uniquement le créateur ou un admin
CREATE POLICY "Users can read their own PDFs or admin can read all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-notes-pdf' 
  AND storage.check_pdf_access(name)
);

-- Politique pour l'upload : tous les utilisateurs authentifiés peuvent uploader
-- (la vérification de propriété se fera lors de la lecture)
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-notes-pdf'
);

-- Politique pour la suppression : uniquement le créateur ou un admin
CREATE POLICY "Users can delete their own PDFs or admin can delete all"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-notes-pdf' 
  AND storage.check_pdf_access(name)
);

-- ============================================
-- BUCKET: audio-recordings
-- ============================================
-- Les fichiers audio restent privés (uniquement utilisateur authentifié qui les a créés)

DROP POLICY IF EXISTS "Users can read their own audio or admin can read all" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio or admin can delete all" ON storage.objects;

-- Fonction similaire pour les fichiers audio
CREATE OR REPLACE FUNCTION storage.check_audio_access(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  note_created_by UUID;
  current_user_id UUID;
  user_role TEXT;
  file_name_only TEXT;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role
  FROM profiles
  WHERE id = current_user_id;
  
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Extraire le nom du fichier depuis le path complet
  file_name_only := substring(file_path from '[^/]+$');
  
  -- Chercher la note correspondante via l'audio_url
  SELECT created_by INTO note_created_by
  FROM notes
  WHERE audio_url LIKE '%' || file_name_only || '%'
     OR audio_url LIKE '%' || file_path || '%'
  LIMIT 1;
  
  IF note_created_by IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN note_created_by = current_user_id;
END;
$$;

-- Politique pour la lecture des fichiers audio
CREATE POLICY "Users can read their own audio or admin can read all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND storage.check_audio_access(name)
);

-- Politique pour l'upload des fichiers audio
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings'
);

-- Politique pour la suppression des fichiers audio
CREATE POLICY "Users can delete their own audio or admin can delete all"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND storage.check_audio_access(name)
);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que les politiques sont créées :
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
--
-- Pour tester la fonction :
-- SELECT storage.check_pdf_access('pdfs/patient-id/1234567890-note.pdf');

