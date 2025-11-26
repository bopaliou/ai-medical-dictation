# 🎯 Flux "Nouvelle Dictée" - Documentation Complète

## 📱 Vue d'ensemble

Le flux "Nouvelle Dictée" permet à l'utilisateur de créer une nouvelle note médicale en choisissant ou créant un patient, puis en enregistrant une dictée vocale.

## 🔄 Flux Utilisateur

```
Dashboard
  ↓
Clic sur "NOUVELLE DICTÉE"
  ↓
Modal de sélection patient (3 options)
  ├─→ Rechercher patient existant
  ├─→ Créer nouveau patient
  └─→ Continuer sans patient
  ↓
Écran d'enregistrement
  ↓
Upload audio + patient_id
  ↓
Backend traite (transcription → structuration → PDF)
  ↓
Retour Dashboard avec note créée
```

## 🎨 Design Premium iOS 17

### Caractéristiques visuelles

- **Couleurs** :
  - Bleu médical : `#006CFF`
  - Fond : `#FAFAFA` (blanc crème)
  - Texte principal : `#1A1A1A`
  - Texte secondaire : `#8E8E93`

- **Typographie** :
  - Titres : 28px, font-weight 700
  - Sous-titres : 15px, font-weight 400
  - Corps : 16px, font-weight 400-600

- **Ombres** :
  - Cards : shadowOpacity 0.06-0.08
  - Boutons : shadowOpacity 0.3 (bleu)
  - Élévation : 2-6 selon l'importance

- **Bordures** :
  - Radius : 14-16px pour les cards
  - Radius : 10-12px pour les inputs
  - Border width : 1-1.5px

## 📋 Composants

### 1. PatientSelectionModal

**Fichier** : `components/PatientSelectionModal.tsx`

**Fonctionnalités** :
- Modal plein écran avec animation slide-up
- 2 onglets : Rechercher / Nouveau
- Recherche avec autocomplete (debounce 300ms)
- Formulaire de création avec validation
- Option "Continuer sans patient"

**Props** :
```typescript
interface PatientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: PatientSelectionResult) => void;
}
```

**Résultat** :
```typescript
interface PatientSelectionResult {
  patientId: string | null;
  patientData: CreatePatientData | null;
  skip: boolean;
}
```

### 2. Écran Record

**Fichier** : `app/record.tsx`

**Fonctionnalités** :
- Affiche les informations du patient sélectionné
- Bouton d'enregistrement avec animation de pulsation
- Gère l'upload avec patient_id ou patientData
- Feedback visuel pendant le traitement

**Paramètres de route** :
- `patientId` : ID du patient sélectionné
- `patientData` : Données JSON du nouveau patient (si création)
- `skip` : "true" si l'utilisateur a choisi de continuer sans patient

## 🔌 API Backend

### GET /api/patients?query=

**Description** : Recherche de patients avec autocomplete

**Paramètres** :
- `query` (query string, optionnel) : Terme de recherche

**Réponse** :
```json
{
  "ok": true,
  "patients": [
    {
      "id": "uuid",
      "full_name": "Jean Dupont",
      "age": "45",
      "gender": "M",
      "room_number": "205",
      "unit": "Cardiologie"
    }
  ]
}
```

### POST /api/patients

**Description** : Création d'un nouveau patient

**Body** :
```json
{
  "full_name": "Jean Dupont",
  "age": "45",
  "gender": "M",
  "room_number": "205",
  "unit": "Cardiologie"
}
```

**Réponse** :
```json
{
  "ok": true,
  "patient": {
    "id": "uuid",
    "full_name": "Jean Dupont",
    ...
  }
}
```

### POST /api/upload/audio

**Description** : Upload audio avec gestion du patient

**FormData** :
- `audio` : Fichier audio (multipart)
- `patient_id` (optionnel) : ID du patient existant
- `patient[full_name]` (optionnel) : Nom du nouveau patient
- `patient[age]` (optionnel) : Âge
- `patient[gender]` (optionnel) : Genre
- `patient[room_number]` (optionnel) : Numéro de chambre
- `patient[unit]` (optionnel) : Unité/Service

**Réponse** :
```json
{
  "ok": true,
  "transcription": "...",
  "structured_json": {...},
  "pdf_url": "...",
  "note": {...},
  "patient_created": true,
  "patient": {...}
}
```

## 💾 Cache Local

### AsyncStorage

**Clés utilisées** :
- `patients_cache` : Liste des patients (JSON)
- `patients_cache_expiry` : Timestamp d'expiration
- `@auth_token` : Token d'authentification

**Durée du cache** : 5 minutes

**Stratégie** :
1. Charger depuis le cache (si valide)
2. Faire la requête API
3. Mettre à jour le cache

## 🎯 Cas d'usage

### Cas 1 : Patient existant sélectionné

1. Utilisateur clique "NOUVELLE DICTÉE"
2. Modal s'ouvre → Onglet "Rechercher"
3. Utilisateur tape un nom → Suggestions apparaissent
4. Utilisateur sélectionne un patient
5. Modal se ferme → Écran record avec `patientId`
6. Upload inclut `patient_id` dans FormData
7. Backend lie directement la note au patient

### Cas 2 : Nouveau patient créé

1. Utilisateur clique "NOUVELLE DICTÉE"
2. Modal s'ouvre → Onglet "Nouveau"
3. Utilisateur remplit le formulaire
4. Clic sur "Créer et continuer"
5. POST /api/patients → Patient créé
6. Modal se ferme → Écran record avec `patientId` du nouveau patient
7. Upload inclut `patient_id` dans FormData
8. Backend lie directement la note au patient

### Cas 3 : Continuer sans patient

1. Utilisateur clique "NOUVELLE DICTÉE"
2. Modal s'ouvre
3. Utilisateur clique "Continuer sans patient"
4. Modal se ferme → Écran record avec `skip: true`
5. Upload sans `patient_id` ni `patientData`
6. Backend :
   - Transcription audio
   - Structuration SOAPIE
   - Extraction des infos patient depuis l'audio
   - Création automatique du patient
   - Liaison de la note
7. Retour avec `patient_created: true`

## 🧪 Tests Manuels

### Test 1 : Patient existant
- [ ] Dashboard → "NOUVELLE DICTÉE"
- [ ] Rechercher un patient
- [ ] Sélectionner → Vérifier affichage dans record
- [ ] Upload → Vérifier que la note est liée

### Test 2 : Nouveau patient
- [ ] Dashboard → "NOUVELLE DICTÉE"
- [ ] Onglet "Nouveau"
- [ ] Remplir formulaire (nom requis)
- [ ] Créer → Vérifier création dans backend
- [ ] Upload → Vérifier liaison

### Test 3 : Sans patient
- [ ] Dashboard → "NOUVELLE DICTÉE"
- [ ] "Continuer sans patient"
- [ ] Upload → Vérifier création automatique du patient

### Test 4 : Cache
- [ ] Rechercher un patient
- [ ] Vérifier que la liste est mise en cache
- [ ] Rechercher à nouveau → Vérifier chargement depuis cache

## 🎨 Design System

### Couleurs Premium

```typescript
const Colors = {
  primary: '#006CFF',      // Bleu médical iOS
  background: '#FAFAFA',   // Fond crème
  card: '#FFFFFF',         // Cards blanches
  text: '#1A1A1A',         // Texte principal
  textSecondary: '#8E8E93', // Texte secondaire
  border: '#E5E5EA',       // Bordures
  success: '#34C759',       // Vert succès
  error: '#FF3B30',         // Rouge erreur
  warning: '#FF9500',       // Orange avertissement
};
```

### Espacements

- Padding cards : 16-24px
- Gap entre éléments : 8-12px
- Margin sections : 20-24px
- Border radius : 10-16px

### Animations

- Slide-up modal : 300ms spring
- Fade-in formulaire : 300ms
- Pulsation bouton record : loop 1s
- Transitions : 200-300ms

---

**Design inspiré d'iOS 17, adapté pour une application médicale professionnelle.**

