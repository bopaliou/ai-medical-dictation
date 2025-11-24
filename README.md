# AI Medical Dictation - MVP

API backend de dictée médicale pour infirmiers permettant de traiter des enregistrements audio et de générer automatiquement des transcriptions, des données structurées et des PDFs standardisés.

## Architecture

- **Backend**: Node.js + Express avec transcription Whisper.cpp local et structuration Gemini 2.5 Flash
- **Base de données**: Supabase (PostgreSQL avec RLS)
- **Stockage**: Supabase Storage pour les fichiers audio et PDF

## Fonctionnalités

- Transcription automatique via Whisper.cpp local (WSL)
- Structuration JSON via Gemini 2.5 Flash (extraction de vitals, médicaments, soins, observations, flags)
- Génération PDF standardisée (< 150 KB) au format SOAPIE
- Gestion des patients et notes
- Authentification JWT Supabase
- RLS (Row Level Security) pour la sécurité des données

## Prérequis

- Node.js >= 18.0.0
- npm ou yarn
- Compte Supabase
- Clé API Google Gemini (obtenez-la sur [Google AI Studio](https://makersuite.google.com/app/apikey))
- Whisper.cpp installé dans WSL (Ubuntu)
- Compte GitHub (pour MCP)

## Installation

### 1. Clonez le dépôt

```bash
git clone https://github.com/bopaliou/ai-medical-dictation.git
cd ai-medical-dictation
```

### 2. Configuration de la base de données Supabase

1. Créez un projet Supabase sur [supabase.com](https://supabase.com)
2. Exécutez le schéma SQL dans le SQL Editor de Supabase :

```bash
cat supabase/schema.sql
```

Copiez et exécutez le contenu dans le SQL Editor de Supabase.

3. Créez les buckets de stockage :
   - `audio-recordings` (privé)
   - `medical-notes-pdf` (privé)

### 3. Configuration Backend

```bash
cd backend
npm install
cp ../.env.example .env
```

Modifiez le fichier `.env` avec vos clés API :

```env
BACKEND_PORT=3000
BACKEND_URL=http://localhost:3000

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET_AUDIO=audio-recordings
SUPABASE_STORAGE_BUCKET_PDFS=medical-notes-pdf

GEMINI_API_KEY=your_gemini_api_key

JWT_SECRET=your_jwt_secret
```

## Démarrage

### Backend

```bash
cd backend
npm run dev
# ou
npm start
```

Le serveur démarre sur `http://localhost:3000`

La documentation API Swagger est disponible sur `http://localhost:3000/api-docs`

## Structure du projet

```
ai_medical_dictation/
├── backend/                    # API Node.js + Express
│   ├── server/
│   │   └── index.js           # Serveur Express principal
│   ├── routes/                 # Routes API
│   │   ├── upload.js          # POST /api/upload/audio
│   │   ├── auth.js            # POST /api/auth/login, /api/auth/signup
│   │   ├── patients.js        # GET/POST /api/patients
│   │   └── notes.js           # GET /api/notes/:patient_id
│   ├── services/              # Services métier
│   │   ├── transcriptionLocal.js  # Transcription Whisper.cpp local
│   │   ├── structuring.js     # Structuration Gemini 2.5 Flash
│   │   ├── pdfGenerator.js    # Génération PDF SOAPIE
│   │   └── supabase.js        # Client Supabase
│   ├── middleware/
│   │   └── auth.js            # Authentification JWT
│   └── tests/                 # Tests Jest
│
├── supabase/
│   └── schema.sql             # Schéma SQL Supabase
│
└── README.md                  # Ce fichier
```

## Endpoints API

### POST /api/upload/audio
Upload un fichier audio et génère automatiquement la transcription, structuration et PDF.

**Body (multipart/form-data)**:
- `audio`: Fichier audio (.m4a)
- `patient_id`: ID du patient (UUID)
- `user_id`: ID de l'utilisateur (UUID)
- `recorded_at`: Date d'enregistrement (ISO string)

**Réponse**:
```json
{
  "ok": true,
  "note": {
    "id": "...",
    "patient_id": "...",
    "transcription_text": "...",
    "structured_json": {...},
    "pdf_url": "...",
    "audio_url": "..."
  }
}
```

### GET /api/patients
Récupère tous les patients (authentification requise).

### GET /api/patients/:id
Récupère un patient avec ses notes.

### POST /api/patients
Crée un nouveau patient.

**Body**:
```json
{
  "full_name": "Jean Dupont",
  "gender": "M",
  "dob": "1990-01-01"
}
```

### GET /api/notes/:patient_id
Récupère toutes les notes d'un patient.

## Tests

### Backend

```bash
cd backend
npm test
```

## Déploiement

### Backend

Le backend peut être déployé sur :
- Heroku
- Railway
- Vercel (serverless)
- AWS/DigitalOcean

Assurez-vous de configurer les variables d'environnement sur votre plateforme.

**Note**: Pour la transcription locale avec Whisper.cpp, vous devez déployer sur un serveur avec WSL ou Linux.

## Sécurité

- Toutes les API sont protégées par JWT Supabase
- RLS (Row Level Security) activé sur toutes les tables
- Buckets de stockage configurés en privé
- Communication HTTPS uniquement
- Pas de stockage de clés API dans le code

## Rôles utilisateurs

- **admin**: Accès complet à toutes les fonctionnalités
- **nurse**: Peut créer des notes et voir ses patients
- **auditor**: Accès en lecture seule


## Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## Licence

MIT

## Auteur

Développé pour réduire le temps de documentation infirmière de ≥ 50%.

