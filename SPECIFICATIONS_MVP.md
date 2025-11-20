# SPECIFICATIONS TECHNIQUES — MVP MINI-DME VOCAL
# (Document optimisé pour Cursor, Agents et génération automatique de code)

## 1. VISION
Construire un MVP d’application mobile permettant aux infirmiers d’enregistrer une note vocale après un soin et de générer automatiquement :
- transcription texte (Whisper)
- note structurée JSON (GPT)
- PDF standardisé
- stockage dans Supabase
- historique patient
- fonctionnement hors-ligne + synchronisation automatique

Objectif : réduire ≥ 50 % du temps de documentation infirmière.

---

## 2. ARCHITECTURE GLOBALE (Cursor doit générer ces composants)

### Mobile App (React Native + Expo)
- Enregistrement audio (.m4a)
- Queue locale (AsyncStorage / SQLite)
- Service de synchronisation (réseau → upload)
- UI patients / notes / enregistrement

### Backend (Node.js + Express)
- Endpoint POST /upload-audio
- Appel Whisper (API ou local)
- Appel GPT (structuration JSON)
- Génération PDF
- Upload vers Supabase Storage
- Insert dans table notes (Supabase)

### Base de données (Supabase)
- profiles
- patients
- notes
- notes_audit

### IA
- Whisper pour transcription
- GPT-4.1 / GPT-4o-mini pour structuration JSON

---

## 3. MODELES IA — SPECIFICITES

### Whisper
- Input: audio .m4a
- Output: texte brut

### Structuration JSON (GPT)
Prompt système (à intégrer dans backend) :

"SYSTEM:
Tu es un assistant clinique spécialisé dans la documentation infirmière. Je te donne une transcription brute. Ta tâche:

1. Extraire : vitals (température, tension, pouls, respiration, glycémie).
2. Extraire : medications {name, dose, route}.
3. Extraire : care (actions infirmières).
4. Extraire : observations.
5. Extraire : flags (fièvre, douleur…).

Réponds STRICTEMENT en JSON valide. N’invente rien."

Format JSON attendu :

{
  "vitals": {...},
  "care": [...],
  "medications": [...],
  "observations": "...",
  "flags": [...]
}

---

## 4. FLUX COMPLET (POUR CURSOR AGENTS)

1. Mobile → Enregistre audio
2. Stocke localement si offline
3. SyncService → POST /upload-audio
4. Backend :
   - multipart parse
   - Whisper transcription
   - GPT structuration JSON
   - Génération PDF
   - Upload audio/pdf → Supabase Storage
   - Insert → table notes
   - Return JSON note
5. Mobile → affiche note + PDF

---

## 5. ENDPOINTS A GENERER

### POST /upload-audio
Entrée :
- multipart/form-data
  - audio (file)
  - patient_id
  - user_id
  - recorded_at

Sortie JSON :
{
  "ok": true,
  "note": {
    "id": "...",
    "patient_id": "...",
    "created_by": "...",
    "transcription_text": "...",
    "structured_json": {...},
    "pdf_url": "..."
  }
}

Pipeline backend :
- multer (upload temp)
- transcription via Whisper
- structuration via GPT
- PDF generator (pdfkit)
- Upload audio/pdf vers Supabase Storage
- Insert DB (notes)
- Delete fichier temporaire

### GET /notes/:patient_id
Retourne l’historique des notes.

### POST /patients
Créer patient.

### GET /patients/:id
Voir profil + notes.

---

## 6. BASE DE DONNEES — SUPABASE SQL

Table profiles :
id uuid primary key references auth.users on delete cascade,
full_name text,
role text,
service text,
created_at timestamptz default now()

css
Copier le code

Table patients :
id uuid primary key default gen_random_uuid(),
full_name text,
gender text,
dob date,
created_at timestamptz default now()

css
Copier le code

Table notes :
id uuid primary key default gen_random_uuid(),
patient_id uuid references patients(id),
created_by uuid references profiles(id),
created_at timestamptz default now(),
recorded_at timestamptz,
transcription_text text,
structured_json jsonb,
pdf_url text,
audio_url text,
synced boolean default true

yaml
Copier le code

---

## 7. MOBILE — MODULES A GENERER POUR CURSOR

### Module 1 — RecordButton
Fonctions :
- startRecording()
- stopRecording()
- saveLocalNote(fileUri, patientId, userId)
- triggerSync()

### Module 2 — SyncService
Fonctions :
- detect network change
- load pending notes
- upload pending notes (POST /upload-audio)
- remove successful entries

### Module 3 — Screens
- HomeScreen (liste des patients)
- PatientScreen (liste des notes)
- RecordScreen (enregistrer + envoyer)
- NoteDetailScreen (PDF + texte)

---

## 8. OFFLINE-FIRST — SPECIFICATIONS
Stockage local :
{
  "id": "local-uuid",
  "patient_id": "...",
  "file_uri": "/path/to/file",
  "status": "pending",
  "created_at": "..."
}

Offline rules :
- Si offline → enregistrement dans queue
- SyncService doit réessayer jusqu’à succès
- Après sync success → suppression entrée locale

---

## 9. PDF — SPECIFICATIONS
PDF doit contenir :
- entête patient
- transcription brute
- JSON structuré
- date/heure
Format A4, taille < 150 kB.
Lib recommandée : pdfkit.

---

## 10. SECURITE
- Toutes les API protégées par JWT Supabase.
- Buckets Storage → PRIVATE.
- Communication HTTPS.
- Pas de stockage de voix sur OpenAI.
- Supprimer fichier temporaire immédiatement.

---

## 11. ROLES & ACCES
- admin : accès à tout.
- nurse : accès à ses notes + patients + create note.
- auditor : lecture seule.

---

## 12. LIVRABLES ATTENDUS (POUR AGENTS CURSOR)

### Backend
- server/index.js
- routes/upload.js
- services/transcription.js
- services/structuring.js
- services/pdfGenerator.js
- tests jest

### Mobile
- App.js
- navigation/
- screens/
- components/RecordButton.js
- services/syncService.js

### Infra
- supabase_schema.sql
- .env.example

---

## 13. CRITERES D’ACCEPTATION

### Fonctionnels
- enregistrement audio fonctionne
- transcription < 8s
- structuration JSON correcte
- PDF généré sans erreur
- offline sync garanti
- historique patient accessible

### Techniques
- code PR propre
- tests unitaires backend OK
- backend démarre sans erreur
- mobile build Expo OK

---

## 14. ROADMAP MVP (6 SEMAINES)
- S1 : backend + supabase
- S2 : transcription + structuration
- S3 : PDF + historique patient
- S4 : offline sync
- S5 : QA + sécurité
- S6 : déploiement + pilote

---

## 15. INSTRUCTIONS SPECIALES A CURSOR

### Quand Cursor génère du code :
- utiliser Node.js + Express
- utiliser Supabase JS client
- respecter le prompt système fourni
- structuration JSON → jamais inventer données
- inclure try/catch partout
- produire code en modules séparés
- créer tests unitaires backend
- commenter fonctions clés

### Quand un Agent intervient :
- créer PR séparées
- ne jamais supprimer du code existant
- ajouter un message clair dans commit
- ne jamais pousser de clés API dans repo

FIN DU DOCUMENT
🎯 Ton document est prêt à être intégré dans Cursor.
Tu peux maintenant :

✔ Copier-coller ce fichier dans ton repo (SPECIFICATIONS_MVP.md)
✔ Le donner tel quel à un Cursor Cloud Agent
✔ Le coller dans Cursor Editor pour générer immédiatement :
le backend

les endpoints

le mobile

la synchronisation offline

les tests

le PDF

toute l’architecture

📌 Souhaites-tu maintenant :
La version PDF du document ?

La version prête pour l’API Cursor (payload JSON Agent) ?

Un Agent complet qui génère tout le backend automatiquement ?

Un Agent complet pour l’app mobile React Native ?

Les deux agents complets (backend + mobile) ?

Que choisis-tu ?





Vous avez dit :
creer le document markdown


Value Proposition v1.1 a dit :
Specifications Mvp
Copier

Modifier

Télécharger
SPECIFICATIONS TECHNIQUES — MVP MINI-DME VOCAL
1. VISION
Construire un MVP d’application mobile permettant aux infirmiers d’enregistrer une note vocale après un soin et de générer automatiquement :

transcription texte (Whisper)

note structurée JSON (GPT)

PDF standardisé

stockage dans Supabase

historique patient

fonctionnement hors-ligne + synchronisation automatique

Objectif : réduire ≥ 50 % du temps de documentation infirmière.

2. ARCHITECTURE GLOBALE
Mobile App (React Native + Expo)
Enregistrement audio (.m4a)

Queue locale (AsyncStorage / SQLite)

Service de synchronisation

UI : patients / notes / enregistrement

Backend (Node.js + Express)
POST /upload-audio

Appel Whisper

Appel GPT

Génération PDF

Upload Supabase Storage

Insert dans table notes

Base de données (Supabase)
profiles

patients

notes

notes_audit

IA
Whisper pour transcription

GPT pour structuration JSON

3. MODELES IA
Whisper
Input: .m4a

Output: texte brut

Structuration JSON (GPT)
Format JSON attendu :

{
  "vitals": {},
  "care": [],
  "medications": [],
  "observations": "",
  "flags": []
}
4. FLUX COMPLET
Enregistrement audio

Stockage local si offline

SyncService → POST /upload-audio

Backend → transcription → structuration → PDF → stockage

Mobile → affichage

5. ENDPOINTS
POST /upload-audio
multipart/form-data

audio, patient_id, user_id, recorded_at

Retour JSON

GET /notes/:patient_id
Liste notes.

POST /patients
Créer patient.

GET /patients/:id
Voir patient + notes.

6. SUPABASE SQL
Tables : profiles, patients, notes.

7. MOBILE — MODULES
RecordButton

SyncService

HomeScreen

PatientScreen

RecordScreen

NoteDetailScreen

8. OFFLINE-FIRST
Queue locale JSON

Sync automatique sur réseau

9. PDF
PDF A4 < 150 KB avec pdfkit

10. SECURITE
JWT Supabase

Buckets privés

HTTPS

11. ROLES
admin

nurse

auditor

12. LIVRABLES (POUR CURSOR)
Backend
index.js

routes/upload.js

services/transcription.js

services/structuring.js

services/pdfGenerator.js

tests

Mobile
App.js

screens/

components/RecordButton.js

services/syncService.js

Infra
supabase_schema.sql

.env.example

13. CRITERES D’ACCEPTATION
Transcription < 8s

Structuration correcte

PDF valide

Offline sync OK

14. ROADMAP MVP
S1 : backend + supabase

S2 : transcription + structuration

S3 : PDF + historique

S4 : offline sync

S5 : QA + sécurité

S6 : pilote

15. INSTRUCTIONS POUR CURSOR
Générer code modulaire

Toujours utiliser try/catch

Pas de clés dans repo

Créer PR séparée