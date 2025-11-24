# Modèles Gemini Disponibles

Ce document liste les modèles Gemini disponibles et leur utilisation dans l'application.

## Modèle Actuellement Utilisé

### Gemini 2.5 Flash
- **Identifiant**: `gemini-2.5-flash`
- **Type**: Bon compromis performance/prix, multimodal
- **Utilisation**: 
  - Transcription audio (`backend/services/transcription.js`) - utilise Whisper.cpp local
  - Structuration JSON (`backend/services/structuring.js`)
- **Avantages**: 
  - Multimodal (texte, image, audio, vidéo)
  - Bon rapport performance/prix
  - Rapide et efficace
  - Disponible dans le free tier

## Autres Modèles Disponibles

### Gemini 2.5 Pro
- **Identifiant**: `gemini-2.5-pro`
- **Type**: Modèle de raisonnement avancé, multimodal
- **Utilisation recommandée**: Tâches complexes nécessitant un raisonnement approfondi
- **Avantages**: 
  - Meilleure qualité pour les tâches complexes
  - Raisonnement avancé
  - Multimodal (texte, image, audio, vidéo)

### Gemini 2.5 Flash
- **Identifiant**: `gemini-2.5-flash`
- **Type**: Bon compromis performance/prix, multimodal
- **Utilisation recommandée**: Tâches nécessitant un bon équilibre performance/prix
- **Avantages**: 
  - Multimodal (texte, image, audio, vidéo)
  - Bon rapport performance/prix
  - Rapide et efficace

### Gemini 2.5 Flash-Lite
- **Identifiant**: `gemini-2.5-flash-lite`
- **Type**: Variante plus légère/rapide pour grand volume/efficacité coût
- **Utilisation recommandée**: Grand volume de requêtes, optimisation des coûts
- **Avantages**: 
  - Plus rapide
  - Moins cher
  - Idéal pour le traitement en masse

### Gemini 2.0 Flash
- **Identifiant**: `gemini-2.0-flash`
- **Type**: Génération précédente du modèle "Flash", déjà multimodal
- **Note**: Version antérieure, toujours disponible mais moins performante que 2.5

### Gemini 2.0 Flash-Lite
- **Identifiant**: `gemini-2.0-flash-lite`
- **Type**: Version plus efficace coût/performance de la génération 2.0
- **Note**: Version antérieure, toujours disponible mais moins performante que 2.5

### Variantes Spécialisées

#### Gemini 2.5 Flash Image
- **Type**: Spécialisé pour image/texte
- **Utilisation**: Génération et traitement d'images

## Comment Changer de Modèle

Pour changer le modèle utilisé dans l'application, modifiez la variable `modelName` dans :

1. **Transcription** : `backend/services/transcription.js` (ligne 45)
2. **Structuration** : `backend/services/structuring.js` (ligne 327)

Note: Le modèle utilisé est actuellement `gemini-2.5-flash` (disponible dans le free tier).

Exemple :
```javascript
// Pour utiliser Gemini 2.5 Flash (actuel - free tier)
const modelName = 'gemini-2.5-flash';

// Pour utiliser Gemini 2.5 Pro
const modelName = 'gemini-2.5-pro';

// Pour utiliser Gemini 2.5 Flash
const modelName = 'gemini-2.5-flash';

// Pour utiliser Gemini 2.5 Flash-Lite
const modelName = 'gemini-2.5-flash-lite';
```

## Recommandations

- **Pour la production actuelle** : `gemini-2.5-flash` (bon équilibre, disponible dans free tier)
- **Pour des tâches complexes** : `gemini-2.5-pro` (meilleure qualité, nécessite un plan payant)
- **Pour le grand volume** : `gemini-2.5-flash-lite` (optimisation coût)
- **Pour un bon équilibre** : `gemini-2.5-flash` (performance/prix)

## Documentation Officielle

- [Documentation Gemini API](https://ai.google.dev/gemini-api/docs)
- [Modèles disponibles](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3 Pro](https://ai.google.dev/gemini-api/docs/gemini-3)
