# 🎤 Modèles Whisper disponibles

## 📋 Modèles Whisper.cpp (format GGML)

Whisper.cpp utilise des modèles au format GGML (quantifiés). Voici les modèles disponibles :

### Modèles disponibles (par taille et qualité)

| Modèle | Taille | Qualité | Vitesse | RAM requise | Usage recommandé |
|--------|--------|---------|---------|-------------|------------------|
| **tiny** | ~75 MB | ⭐⭐ | ⚡⚡⚡⚡⚡ | ~1 GB | Tests rapides, développement |
| **base** | ~142 MB | ⭐⭐⭐ | ⚡⚡⚡⚡ | ~1 GB | **Actuel** - Bon équilibre |
| **small** | ~466 MB | ⭐⭐⭐⭐ | ⚡⚡⚡ | ~2 GB | Production, meilleure qualité |
| **medium** | ~1.5 GB | ⭐⭐⭐⭐⭐ | ⚡⚡ | ~5 GB | Haute qualité, audio complexe |
| **large** | ~3.1 GB | ⭐⭐⭐⭐⭐ | ⚡ | ~10 GB | Qualité maximale |

### Modèle actuellement configuré

**Modèle actuel :** `ggml-base.bin`
- **Chemin :** `${WSL_HOME}/whisper.cpp/models/ggml-base.bin`
- **Variable d'environnement :** `WHISPER_MODEL_PATH`

## 🔧 Configuration

### Modifier le modèle utilisé

#### Option 1 : Variable d'environnement (recommandé)

Ajoutez dans votre fichier `.env` :

```bash
# Modèle Whisper à utiliser
WHISPER_MODEL_PATH=/home/bopaliou/whisper.cpp/models/ggml-small.bin
```

#### Option 2 : Modifier le code

Dans `backend/services/transcriptionLocal.js`, ligne 237 :

```javascript
let whisperModelPath = process.env.WHISPER_MODEL_PATH || `${wslHome}/whisper.cpp/models/ggml-base.bin`;
```

Changez `ggml-base.bin` par le modèle souhaité :
- `ggml-tiny.bin` - Plus rapide, moins précis
- `ggml-base.bin` - **Actuel** - Bon équilibre
- `ggml-small.bin` - Meilleure qualité
- `ggml-medium.bin` - Haute qualité
- `ggml-large.bin` - Qualité maximale

## 📥 Téléchargement des modèles

### Méthode 1 : Script de téléchargement (recommandé)

Dans WSL, naviguez vers le dossier whisper.cpp :

```bash
cd ~/whisper.cpp
./models/download-ggml-model.sh base    # Pour base
./models/download-ggml-model.sh small  # Pour small
./models/download-ggml-model.sh medium # Pour medium
./models/download-ggml-model.sh large  # Pour large
./models/download-ggml-model.sh tiny   # Pour tiny
```

### Méthode 2 : Téléchargement manuel

Les modèles sont disponibles sur Hugging Face :
- **Tiny :** https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
- **Base :** https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
- **Small :** https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
- **Medium :** https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
- **Large :** https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin

Téléchargez dans : `~/whisper.cpp/models/`

## 🎯 Recommandations par cas d'usage

### Développement / Tests
- **Modèle :** `tiny` ou `base`
- **Raison :** Rapide, suffisant pour les tests

### Production (qualité standard)
- **Modèle :** `base` (actuel) ou `small`
- **Raison :** Bon équilibre qualité/vitesse

### Production (haute qualité)
- **Modèle :** `small` ou `medium`
- **Raison :** Meilleure précision pour la transcription médicale

### Production (qualité maximale)
- **Modèle :** `large`
- **Raison :** Meilleure précision, mais plus lent et gourmand en RAM

## 📊 Comparaison des performances

### Temps de transcription (approximatif)

Pour un fichier audio de 1 minute :

| Modèle | Temps CPU | Temps GPU |
|--------|-----------|-----------|
| tiny | ~5-10s | ~1-2s |
| base | ~15-20s | ~2-3s |
| small | ~30-40s | ~5-8s |
| medium | ~60-90s | ~10-15s |
| large | ~120-180s | ~20-30s |

### Précision (WER - Word Error Rate)

| Modèle | WER (approximatif) |
|--------|-------------------|
| tiny | ~15-20% |
| base | ~10-15% |
| small | ~8-12% |
| medium | ~6-10% |
| large | ~5-8% |

## 🔍 Vérifier le modèle installé

Dans WSL :

```bash
ls -lh ~/whisper.cpp/models/
```

Vous devriez voir les fichiers `.bin` des modèles téléchargés.

## ⚙️ Configuration actuelle

**Fichier de configuration :** `backend/services/transcriptionLocal.js`

**Ligne 237 :**
```javascript
let whisperModelPath = process.env.WHISPER_MODEL_PATH || `${wslHome}/whisper.cpp/models/ggml-base.bin`;
```

**Modèle par défaut :** `ggml-base.bin`

**Chemin par défaut :** `${WSL_HOME}/whisper.cpp/models/ggml-base.bin`

## 💡 Astuce

Pour tester différents modèles sans modifier le code, utilisez la variable d'environnement `WHISPER_MODEL_PATH` dans votre `.env` :

```bash
# Pour utiliser small au lieu de base
WHISPER_MODEL_PATH=/home/bopaliou/whisper.cpp/models/ggml-small.bin
```

Puis redémarrez le serveur backend.

---

**Document généré automatiquement**
