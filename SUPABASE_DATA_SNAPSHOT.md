# 📊 Snapshot des données Supabase
**Date de capture :** 21 novembre 2025

---

## 📋 Résumé des tables

| Table | Nombre d'enregistrements | RLS activé |
|-------|-------------------------|------------|
| `profiles` | **1** | ✅ Oui |
| `patients` | **15** | ✅ Oui |
| `notes` | **12** | ✅ Oui |
| `notes_audit` | **0** | ✅ Oui |

---

## 👤 Table `profiles` (1 enregistrement)

### Profil utilisateur

| ID | Nom complet | Rôle | Service | Créé le |
|----|-------------|------|---------|---------|
| `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | Aliou Bop | `nurse` | `null` | 2025-11-21 10:20:03 |

---

## 🏥 Table `patients` (15 enregistrements)

### Liste des patients

| ID | Nom complet | Genre | Date de naissance | Créé le |
|----|-------------|-------|-------------------|---------|
| `4c9d233b-4166-4ab5-b9bc-3e4662328b5c` | Jean Dupont | M | 1990-01-01 | 2025-11-21 10:29:41 |
| `256f6ad1-a51a-49e7-bf88-f7e4fc2b9bd6` | Abdo Unbay | `null` | `null` | 2025-11-21 12:56:38 |
| `dd1ec03e-431d-4756-a175-efe33d857282` | Abdo Umbay | `null` | `null` | 2025-11-21 13:02:34 |
| `f4859def-6bb8-45e5-abc4-d84ce14fceae` | Abdo Humby | `null` | `null` | 2025-11-21 13:04:30 |
| `db3bb19a-f23a-4483-8cd2-8e133e262dc3` | Abdo Humbay | `null` | `null` | 2025-11-21 13:37:37 |
| `51ddbf65-6907-4d1a-baf3-3e2e8ff65083` | Abdo Embaï | `null` | `null` | 2025-11-21 13:47:49 |
| `d021ee5d-76c3-444f-ab12-2df5576217a7` | Mamadou Sarr | homme | 1973-01-01 | 2025-11-21 14:15:57 |
| `fd88789d-8b98-4e36-bef6-e93ad588782c` | Mama Doussard | homme | 1973-01-01 | 2025-11-21 15:01:21 |
| `98eb9268-f33f-4ecb-a8fb-1606fadd206a` | Mama Doussard | Homme | 1973-01-01 | 2025-11-21 15:06:15 |
| `83802d3f-26ff-4e07-9a30-1c8e0d84d91f` | Mamadoussard | homme | 1973-01-01 | 2025-11-21 19:19:37 |
| *(5 autres patients non listés dans les 10 premiers résultats)* | | | | |

### Observations
- **Doublons potentiels** : Plusieurs variantes de "Mama Doussard" / "Mamadoussard" (3 entrées)
- **Données incomplètes** : Plusieurs patients "Abdo" sans genre ni date de naissance
- **Format de genre incohérent** : Mélange de "M", "homme", "Homme"

---

## 📝 Table `notes` (12 enregistrements)

### Résumé des notes

| ID | Patient ID | Créé par | Date création | Transcription | PDF URL | Audio URL |
|----|------------|----------|---------------|---------------|---------|-----------|
| `0b599bf2-9e83-4246-babb-2a7d40024a3b` | `4c9d233b-4166-4ab5-b9bc-3e4662328b5c` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 10:57:50 | *(Texte en wolof)* | ✅ | ✅ |
| `18d0ddc5-919a-49e2-a4fd-4fb5f7b4d0ea` | `4c9d233b-4166-4ab5-b9bc-3e4662328b5c` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 11:10:20 | "Monsieur Diallo, AVC hier..." | ✅ | ✅ |
| `f4b9e165-c111-4aaa-bb0f-9ba3c231dfd7` | `f4859def-6bb8-45e5-abc4-d84ce14fceae` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 13:04:32 | "Patient Abdo Humby, chambre 7..." | ✅ | ✅ |
| `8a4ae92b-c148-465a-8f26-c8b2e6b7c992` | `db3bb19a-f23a-4483-8cd2-8e133e262dc3` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 13:37:38 | "Patient Abdo Humbay, chambre 7..." | ✅ | ✅ |
| `ac734cae-c565-4082-8321-2a2bd9504dbe` | `51ddbf65-6907-4d1a-baf3-3e2e8ff65083` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 13:47:51 | "Patient Abdo Embaï, chambre 7..." | ✅ | ✅ |
| `105643ef-34f6-4b37-ae63-10ccfe2cd1d6` | `d021ee5d-76c3-444f-ab12-2df5576217a7` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 14:16:00 | "Patient Mamadou Sarr, homme de 52 ans..." | ✅ | ✅ |
| `aa050334-68c5-455d-8669-55c0251bd369` | `fd88789d-8b98-4e36-bef6-e93ad588782c` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 15:01:25 | "Patient, Mama Doussard, homme de 52 ans..." | ✅ | ✅ |
| `42af145c-b660-4398-a872-c6d051ed2f41` | `98eb9268-f33f-4ecb-a8fb-1606fadd206a` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 15:06:20 | "Patient Mama Doussard, homme de 52 ans..." | ✅ | ✅ |
| `2d7527f4-7ba4-4776-a487-321b28ef5bb7` | `1cb9bade-98a8-4142-b760-5062245e416f` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 18:41:23 | "Patients Mamadoussard, homme de 52 ans..." | ✅ | ✅ |
| `a5b29d87-31db-4fb2-9b34-ea83c5dd4b14` | `83802d3f-26ff-4e07-9a30-1c8e0d84d91f` | `d753d1d5-87ba-4f7d-bab3-e5359676e69e` | 2025-11-21 19:19:40 | "Patients Mamadoussard, homme de 52 ans..." | ✅ | ✅ |
| *(2 autres notes non listées)* | | | | | | |

### Détails des notes

#### Note 1 : Jean Dupont
- **Transcription** : Texte en wolof (passage biblique)
- **Structured JSON** : Format ancien (`care`, `flags`, `vitals`, `medications`, `observations`)
- **PDF** : `pdfs/4c9d233b-4166-4ab5-b9bc-3e4662328b5c/1763722669874-note.pdf`
- **Audio** : `audio/4c9d233b-4166-4ab5-b9bc-3e4662328b5c/1763722667551-audio-*.mp3`

#### Note 2 : Jean Dupont (Diallo)
- **Transcription** : "Monsieur Diallo, AVC hier. TA 14/9, poul 95..."
- **Structured JSON** : Format ancien avec données structurées
- **PDF** : `pdfs/4c9d233b-4166-4ab5-b9bc-3e4662328b5c/1763723419547-note.pdf`
- **Audio** : `audio/4c9d233b-4166-4ab5-b9bc-3e4662328b5c/1763723418224-audio-*.mp3`

#### Note 3-5 : Patients "Abdo"
- **Patients** : Abdo Humby, Abdo Humbay, Abdo Embaï
- **Format** : Structured JSON avec format mixte (ancien + nouveau)
- **Toutes ont** : PDF et Audio générés

#### Note 6-10 : Patients "Mamadou Sarr" / "Mama Doussard"
- **Patients** : Mamadou Sarr, Mama Doussard (variantes)
- **Format** : Structured JSON avec format mixte
- **Dernière note (a5b29d87)** : Format SOAPIE complet et structuré ✅
  - **S** : Subjective (rapports patient)
  - **O** : Objective (signes vitaux, examens, médicaments)
  - **A** : Assessment (analyse)
  - **I** : Intervention (actes posés)
  - **E** : Evaluation (réponse patient)
  - **P** : Plan (surveillance)

### Observations
- **Toutes les notes** ont des PDF et Audio générés ✅
- **Format de structured_json** : Évolution du format ancien vers le format SOAPIE
- **Dernière note** : Format SOAPIE complet et bien structuré
- **Toutes les notes** sont synchronisées (`synced: true`)

---

## 📊 Table `notes_audit` (0 enregistrements)

Aucun enregistrement d'audit pour le moment.

---

## 🔍 Analyse et recommandations

### ✅ Points positifs
1. **RLS activé** sur toutes les tables
2. **Toutes les notes** ont des PDF et Audio générés
3. **Format SOAPIE** implémenté dans la dernière note
4. **Relations** correctement définies (foreign keys)

### ⚠️ Points d'attention
1. **Doublons de patients** : Plusieurs variantes de "Mama Doussard" / "Mamadoussard"
2. **Données incomplètes** : Plusieurs patients sans genre ni date de naissance
3. **Format de genre incohérent** : Mélange de "M", "homme", "Homme"
4. **Format structured_json** : Mélange d'ancien et nouveau format (normal pendant la transition)

### 💡 Recommandations
1. **Nettoyer les doublons** de patients
2. **Standardiser le format de genre** (M/F/Autre/Non précisé)
3. **Migrer les anciennes notes** vers le format SOAPIE si nécessaire
4. **Remplir les données manquantes** pour les patients existants

---

**Document généré automatiquement via MCP Supabase**

