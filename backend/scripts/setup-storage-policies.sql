-- ============================================
-- Politiques RLS pour Supabase Storage
-- ============================================
-- Ce script configure les politiques pour permettre l'accès public aux fichiers
-- dans les buckets 'audio-recordings' et 'medical-notes-pdf'
-- ============================================

-- ============================================
-- BUCKET: medical-notes-pdf
-- ============================================
-- Politique pour permettre la lecture publique des PDFs
-- Permet à tous les utilisateurs (y compris anonymes) de lire les fichiers PDF

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Public Access to PDFs" ON storage.objects;

-- Créer la politique pour la lecture publique des PDFs
CREATE POLICY "Public Access to PDFs"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'medical-notes-pdf' 
  AND (storage.foldername(name))[1] = 'pdfs'
);

-- Politique pour permettre l'upload de PDFs aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload PDFs" ON storage.objects;

CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-notes-pdf'
);

-- Politique pour permettre la suppression de PDFs aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can delete PDFs" ON storage.objects;

CREATE POLICY "Authenticated users can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-notes-pdf'
);

-- ============================================
-- BUCKET: audio-recordings
-- ============================================
-- Politique pour permettre la lecture des fichiers audio aux utilisateurs authentifiés uniquement
-- (Les fichiers audio sont privés, contrairement aux PDFs)

DROP POLICY IF EXISTS "Authenticated users can read audio" ON storage.objects;

CREATE POLICY "Authenticated users can read audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-recordings'
);

-- Politique pour permettre l'upload de fichiers audio aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;

CREATE POLICY "Authenticated users can upload audio"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings'
);

-- Politique pour permettre la suppression de fichiers audio aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can delete audio" ON storage.objects;

CREATE POLICY "Authenticated users can delete audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-recordings'
);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que les politiques sont créées, exécutez :
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

