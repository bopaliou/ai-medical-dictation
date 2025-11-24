-- Schéma Supabase pour MVP Medical Dictation
-- Tables: profiles, patients, notes, notes_audit
-- RLS (Row Level Security) activé pour toutes les tables

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles (utilisateurs de l'application)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'nurse', 'auditor')),
    service TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    gender TEXT,
    dob DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table notes
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_at TIMESTAMPTZ,
    transcription_text TEXT,
    structured_json JSONB,
    pdf_url TEXT,
    audio_url TEXT,
    synced BOOLEAN DEFAULT TRUE
);

-- Table notes_audit (historique des modifications)
CREATE TABLE IF NOT EXISTS notes_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    action TEXT CHECK (action IN ('created', 'updated', 'deleted')),
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notes_patient_id ON notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_audit_note_id ON notes_audit(note_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour profiles
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Les admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies pour patients
-- Les infirmiers et admins peuvent voir tous les patients
CREATE POLICY "Nurses and admins can view patients" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('nurse', 'admin')
        )
    );

-- Les auditors peuvent voir tous les patients (lecture seule)
CREATE POLICY "Auditors can view patients" ON patients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'auditor'
        )
    );

-- Les infirmiers et admins peuvent créer des patients
CREATE POLICY "Nurses and admins can create patients" ON patients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('nurse', 'admin')
        )
    );

-- Les admins peuvent mettre à jour les patients
CREATE POLICY "Admins can update patients" ON patients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies pour notes
-- Les infirmiers peuvent voir leurs propres notes et celles de leurs patients
CREATE POLICY "Nurses can view own notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'nurse' AND created_by = auth.uid()
        )
    );

-- Les infirmiers peuvent voir les notes de leurs patients
CREATE POLICY "Nurses can view patient notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'nurse'
        )
    );

-- Les admins peuvent voir toutes les notes
CREATE POLICY "Admins can view all notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les auditors peuvent voir toutes les notes (lecture seule)
CREATE POLICY "Auditors can view all notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'auditor'
        )
    );

-- Les infirmiers et admins peuvent créer des notes
CREATE POLICY "Nurses and admins can create notes" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('nurse', 'admin')
        ) AND created_by = auth.uid()
    );

-- Les admins peuvent mettre à jour toutes les notes
CREATE POLICY "Admins can update all notes" ON notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies pour notes_audit
-- Les admins peuvent voir tous les audits
CREATE POLICY "Admins can view all audit logs" ON notes_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les auditors peuvent voir tous les audits (lecture seule)
CREATE POLICY "Auditors can view all audit logs" ON notes_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'auditor'
        )
    );

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'nurse')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour logger les modifications dans notes_audit
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

-- Trigger pour logger automatiquement les modifications
DROP TRIGGER IF EXISTS on_note_changes ON notes;
CREATE TRIGGER on_note_changes
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION public.log_note_changes();

-- Commentaires sur les tables
COMMENT ON TABLE profiles IS 'Profils utilisateurs de l application (infirmiers, admins, auditors)';
COMMENT ON TABLE patients IS 'Patients suivis dans l application';
COMMENT ON TABLE notes IS 'Notes vocales transcrites et structurées';
COMMENT ON TABLE notes_audit IS 'Historique des modifications des notes pour audit';

