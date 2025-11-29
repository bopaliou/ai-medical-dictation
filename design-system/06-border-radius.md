# Système de Rayons de Bordure KadduCare

## Vue d'ensemble

Le système de border radius KadduCare utilise des rayons arrondis élégants pour créer un design moderne, doux et professionnel.

## Principe

Les rayons de bordure KadduCare :
- **Élégants** : Arrondis doux et harmonieux
- **Modernes** : Design contemporain
- **Cohérents** : Système hiérarchisé
- **Professionnels** : Adaptés au contexte médical

## Échelle de Rayons

### Échelle Standard

```
xs:   6px   - Rayon très petit
sm:   8px   - Rayon petit
md:   12px  - Rayon moyen
lg:   16px  - Rayon large
xl:   20px  - Rayon très large
xxl:  24px  - Rayon extra large
xxxl: 32px  - Rayon triple large
full: 9999px - Cercle parfait
```

### Rayons Spécifiques

```
card:    20px  - Rayon pour les cartes
button:  16px  - Rayon pour les boutons
input:   12px  - Rayon pour les inputs
badge:   12px  - Rayon pour les badges
```

## Usage par Composant

### Cartes

#### Carte Standard

```
Border Radius: 20px (card)
```

**Usage** :
- Cartes de statistiques
- Cartes de rapports
- Cartes de patients
- Cartes d'information

#### Carte Compacte

```
Border Radius: 16px (lg)
```

**Usage** :
- Petites cartes
- Cartes en liste
- Cartes compactes

### Boutons

#### Bouton Standard

```
Border Radius: 16px (button)
```

**Usage** :
- Boutons principaux
- Boutons secondaires
- Boutons d'action

#### Bouton Petit

```
Border Radius: 12px (md)
```

**Usage** :
- Petits boutons
- Boutons inline
- Boutons compacts

#### Bouton Circulaire

```
Border Radius: 9999px (full)
```

**Usage** :
- Floating Action Button (FAB)
- Boutons iconiques
- Avatars

### Inputs

#### Input Standard

```
Border Radius: 12px (input)
```

**Usage** :
- Champs de texte
- Champs de recherche
- Textareas

#### Input Compact

```
Border Radius: 8px (sm)
```

**Usage** :
- Inputs compacts
- Inputs inline

### Badges

#### Badge Standard

```
Border Radius: 12px (badge)
```

**Usage** :
- Badges de statut
- Badges d'information
- Tags

#### Badge Rond

```
Border Radius: 9999px (full)
```

**Usage** :
- Badges de notification
- Compteurs
- Indicateurs

### Modals

#### Modal Standard

```
Border Radius: 24px (xxl) en haut
Border Radius: 0px en bas (si bottom sheet)
```

**Usage** :
- Modals standard
- Bottom sheets
- Popups

### Images

#### Image Standard

```
Border Radius: 12px (md)
```

**Usage** :
- Images dans les cartes
- Avatars
- Thumbnails

#### Image Rond

```
Border Radius: 9999px (full)
```

**Usage** :
- Avatars circulaires
- Icônes circulaires

## Hiérarchie Visuelle

### Niveau 1 : Petits Rayons (xs, sm)

Éléments discrets et compacts.

### Niveau 2 : Rayons Moyens (md, input, badge)

Éléments standards et fonctionnels.

### Niveau 3 : Rayons Larges (lg, button)

Éléments importants et interactifs.

### Niveau 4 : Rayons Très Larges (xl, card, xxl)

Éléments principaux et conteneurs.

### Niveau 5 : Rayons Maximum (xxxl, full)

Éléments spéciaux et circulaires.

## Exemples Visuels

### Carte Standard

```
┌─────────────────────┐
│                     │ ← Border Radius: 20px (card)
│   Contenu           │
│                     │
└─────────────────────┘
```

### Bouton Principal

```
┌──────────────┐
│   Action     │ ← Border Radius: 16px (button)
└──────────────┘
```

### Floating Action Button

```
     ┌───┐
     │ + │ ← Border Radius: 9999px (full - cercle)
     └───┘
```

### Input

```
┌─────────────────────┐
│  Texte saisi...     │ ← Border Radius: 12px (input)
└─────────────────────┘
```

### Badge

```
┌──────┐
│ Info │ ← Border Radius: 12px (badge)
└──────┘
```

## Règles d'Or

### 1. Cohérence

Respecter les rayons spécifiques pour chaque type de composant.

### 2. Hiérarchie

Plus l'élément est important, plus le rayon peut être grand.

### 3. Contexte

Adapter le rayon au contexte :
- **Éléments interactifs** : Rayons moyens à larges
- **Conteneurs** : Rayons larges
- **Éléments discrets** : Rayons petits

### 4. Harmonie

Maintenir une harmonie visuelle entre les rayons d'éléments liés.

## Accessibilité

Les rayons de bordure ne doivent pas :
- Créer de confusion visuelle
- Masquer du contenu
- Rendre les éléments difficiles à identifier

## Performance

Les rayons de bordure sont généralement bien performants sur mobile, mais éviter les rayons très complexes sur de nombreux éléments simultanément.

## Mode Sombre

En mode sombre, les rayons restent identiques pour maintenir la cohérence visuelle.

## Ressources

- **Fichier de définition** : `mobile/mobile-app/constants/design.ts`

---

*Pour toute question sur les rayons de bordure, consulter l'équipe design.*

