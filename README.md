# KadduCare - Application de Dictée Médicale

**KadduCare** est une application mobile de dictée médicale pour infirmiers permettant de traiter des enregistrements audio et de générer automatiquement des transcriptions, des données structurées et des PDFs standardisés.

## Architecture

- **Backend**: Node.js + Express avec transcription Whisper.cpp local et structuration Gemini 2.5 Flash
- **Mobile**: Application React Native avec Expo (iOS et Android)
- **Base de données**: Supabase (PostgreSQL avec RLS)
- **Stockage**: Supabase Storage pour les fichiers audio et PDF

## Fonctionnalités

- **Application mobile** : Interface intuitive pour enregistrer et gérer les dictées médicales
- **Transcription automatique** : Via Whisper.cpp local (WSL)
- **Structuration intelligente** : JSON via Gemini 2.5 Flash (extraction de vitals, médicaments, soins, observations, flags)
- **Génération PDF** : Standardisée (< 150 KB) au format SOAPIE
- **Gestion des patients** : Création, modification et consultation des dossiers patients
- **Authentification sécurisée** : JWT Supabase avec gestion de session
- **Sécurité** : RLS (Row Level Security) pour la protection des données

## Prérequis

### Backend
- Node.js >= 18.0.0
- npm ou yarn
- Compte Supabase
- Clé API Google Gemini (obtenez-la sur [Google AI Studio](https://makersuite.google.com/app/apikey))
- Whisper.cpp installé dans WSL (Ubuntu) - optionnel pour la transcription locale
- Compte GitHub (pour MCP) - optionnel

### Mobile
- Node.js >= 18.0.0
- Expo CLI (`npm install -g expo-cli`)
- Un appareil iOS/Android ou un émulateur/simulateur
- Expo Go (pour tester sur appareil physique)

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
npm install
npm run dev
# ou
npm start
```

Le serveur démarre sur `http://localhost:3000` et écoute sur toutes les interfaces réseau (`0.0.0.0`) pour permettre l'accès depuis votre appareil mobile.

La documentation API Swagger est disponible sur `http://localhost:3000/api-docs`

**Important** : Le backend affichera automatiquement toutes les adresses IP réseau disponibles au démarrage. Notez l'adresse IP de votre réseau local (ex: `192.168.1.12`) pour la configuration mobile.

### Application Mobile KadduCare

#### Configuration réseau

Avant de démarrer **KadduCare**, vous devez configurer l'adresse IP du backend :

1. **Trouvez l'IP de votre ordinateur** :
   - Windows : `ipconfig` (cherchez "Adresse IPv4" sous votre connexion WiFi)
   - Mac/Linux : `ifconfig` ou `ip addr`
   - Notez l'adresse IP de votre réseau local (ex: `192.168.1.12`)

2. **Configurez l'IP dans KadduCare** :
   - Ouvrez `mobile/mobile-app/app.json`
   - Modifiez la valeur de `expo.extra.API_BASE_URL` avec l'IP de votre ordinateur :
   ```json
   "extra": {
     "API_BASE_URL": "http://192.168.1.12:3000"
   }
   ```

3. **Autorisez le port 3000 dans le firewall** (Windows) :
   ```powershell
   # Exécutez en tant qu'administrateur
   .\backend\allow-port-3000.ps1
   ```

#### Démarrage de l'application

```bash
cd mobile/mobile-app
npm install
npx expo start -c
```

**KadduCare** démarre et affiche un QR code. Vous pouvez :
- Scanner le QR code avec Expo Go sur votre téléphone (iOS/Android)
- Appuyer sur `a` pour ouvrir sur un émulateur Android
- Appuyer sur `i` pour ouvrir sur un simulateur iOS
- Appuyer sur `w` pour ouvrir dans le navigateur web

**Note importante** : Pour que **KadduCare** fonctionne sur un appareil physique, votre téléphone et votre ordinateur doivent être sur le même réseau WiFi.

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
│   │   ├── notes.js           # GET /api/notes/:patient_id
│   │   └── report.js          # GET/POST /api/reports
│   ├── services/              # Services métier
│   │   ├── transcriptionLocal.js  # Transcription Whisper.cpp local
│   │   ├── structuring.js     # Structuration Gemini 2.5 Flash
│   │   ├── pdfGenerator.js    # Génération PDF SOAPIE
│   │   └── supabase.js        # Client Supabase
│   ├── middleware/
│   │   └── auth.js            # Authentification JWT
│   ├── scripts/               # Scripts utilitaires
│   │   └── allow-port-3000.ps1  # Configuration firewall Windows
│   └── tests/                 # Tests Jest
│
├── mobile/                    # Application mobile React Native
│   └── mobile-app/            # Application KadduCare (Expo)
│       ├── app/               # Écrans (Expo Router)
│       ├── components/        # Composants réutilisables
│       ├── services/          # Services API (patients, notes, auth, etc.)
│       ├── contexts/          # Contextes React (Auth, Theme)
│       ├── config/            # Configuration (API, etc.)
│       └── app.json           # Configuration Expo (IP backend)
│
├── supabase/
│   ├── schema.sql             # Schéma SQL Supabase
│   └── migrations/            # Migrations SQL
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

### Mobile

```bash
cd mobile/mobile-app
npm test
```

## Dépannage

### Problèmes de connexion réseau

Si **KadduCare** ne peut pas se connecter au backend :

1. **Vérifiez que le backend est démarré** :
   - Le backend doit afficher "🚀 Serveur démarré sur le port 3000"
   - Vérifiez que l'IP affichée correspond à celle dans `app.json`

2. **Vérifiez la configuration réseau** :
   - Votre téléphone et votre ordinateur doivent être sur le même réseau WiFi
   - L'adresse IP dans `app.json` doit correspondre à l'IP de votre ordinateur
   - Testez la connexion depuis votre téléphone : ouvrez `http://VOTRE_IP:3000/health` dans un navigateur

3. **Vérifiez le firewall** :
   - Windows : Exécutez `backend/allow-port-3000.ps1` en tant qu'administrateur
   - Mac : Autorisez Node.js dans les paramètres de sécurité
   - Linux : Vérifiez les règles iptables/firewalld

4. **Messages d'erreur améliorés** :
   - **KadduCare** affiche maintenant des messages d'erreur plus clairs et empathiques
   - Les erreurs réseau incluent des suggestions de dépannage
   - Les erreurs d'authentification indiquent clairement quand la session a expiré

### Messages d'erreur

**KadduCare** utilise des messages d'erreur humains et empathiques pour améliorer l'expérience utilisateur :
- Messages clairs et compréhensibles
- Suggestions de solutions pour les problèmes courants
- Indications précises sur les actions à entreprendre

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

## Support

Pour toute question ou problème avec **KadduCare** :
- Consultez les fichiers de diagnostic dans `mobile/mobile-app/` (DIAGNOSTIC_CONNEXION.md, etc.)
- Vérifiez les logs du backend pour les erreurs serveur
- Les messages d'erreur de **KadduCare** incluent des suggestions de résolution

