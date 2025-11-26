-- Migration pour créer les buckets de stockage Supabase
-- Buckets: audio-recordings (privé) et medical-notes-pdf (privé)

-- Créer le bucket audio-recordings (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-recordings',
  'audio-recordings',
  false, -- Privé
  104857600, -- 100 MB
  ARRAY['audio/wav', 'audio/mpeg', 'audio/m4a', 'audio/flac', 'audio/ogg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Créer le bucket medical-notes-pdf (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-notes-pdf',
  'medical-notes-pdf',
  false, -- Privé
  10485760, -- 10 MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Commentaires
COMMENT ON TABLE storage.buckets IS 'Buckets de stockage pour l''application médicale: audio-recordings (privé) et medical-notes-pdf (privé)';

