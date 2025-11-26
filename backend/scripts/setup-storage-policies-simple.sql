-- ============================================
-- Politique SIMPLE pour accès public aux PDFs
-- ============================================
-- Utilisez cette version si vous voulez un accès 100% public au bucket PDF
-- ============================================

-- Politique pour permettre la lecture publique de TOUS les fichiers dans medical-notes-pdf
CREATE POLICY "Public Access to medical-notes-pdf"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'medical-notes-pdf');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload to medical-notes-pdf"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-notes-pdf');

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete from medical-notes-pdf"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medical-notes-pdf');

