# Système d'Ombres KadduCare

## Vue d'ensemble

Le système d'ombres KadduCare utilise des ombres douces et subtiles pour créer de la profondeur et de l'élégance, tout en restant discret et professionnel.

## Principe

Les ombres KadduCare sont :
- **Douces** : Opacité faible pour un effet subtil
- **Subtiles** : Ne distraient pas de l'information
- **Premium** : Créent une sensation de qualité
- **Cohérentes** : Système hiérarchisé et prévisible

## Niveaux d'Ombres

### Small (sm)

Ombres très légères pour les éléments légèrement élevés.

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 2
}
```

**Usage** :
- Petits éléments interactifs
- Badges
- Labels élevés

### Medium (md)

Ombres moyennes pour les éléments modérément élevés.

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 4
}
```

**Usage** :
- Cartes standard
- Boutons
- Inputs élevés

### Large (lg)

Ombres importantes pour les éléments significativement élevés.

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 6
}
```

**Usage** :
- Modals
- Dropdowns
- Éléments flottants

### Extra Large (xl)

Ombres très importantes pour les éléments très élevés.

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 8
}
```

**Usage** :
- Modals importantes
- Overlays
- Éléments très élevés

### Floating

Ombres spéciales pour les éléments flottants (FAB, tooltips).

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 12
}
```

**Usage** :
- Floating Action Button (FAB)
- Tooltips
- Éléments flottants permanents

## Ombres Spécifiques

### Card Shadow

Ombre optimisée pour les cartes.

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 4
}
```

**Usage** :
- Cartes de statistiques
- Cartes de rapports
- Cartes de patients

### Button Shadow

Ombre avec couleur primaire pour les boutons.

```javascript
{
  shadowColor: '#0A84FF',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 6
}
```

**Usage** :
- Boutons principaux
- Boutons d'action
- CTA (Call to Action)

## Hiérarchie Visuelle

### Niveau 0 : Pas d'ombre

Éléments au niveau du fond.

### Niveau 1 : Small (sm)

Éléments légèrement élevés.

### Niveau 2 : Medium (md)

Éléments modérément élevés (cartes standard).

### Niveau 3 : Large (lg)

Éléments significativement élevés (modals).

### Niveau 4 : Extra Large (xl)

Éléments très élevés (overlays).

### Niveau 5 : Floating

Éléments flottants permanents (FAB).

## Usage par Composant

### Cartes

```
Card Standard: card shadow (md)
Card Élevée: lg
Card Interactive: md (hover: lg)
```

### Boutons

```
Bouton Standard: md
Bouton Principal: button shadow
Bouton Flottant: floating
```

### Modals

```
Modal Standard: lg
Modal Importante: xl
Modal Overlay: xl avec overlay background
```

### Inputs

```
Input Standard: pas d'ombre
Input Focus: sm
Input Élevé: md
```

### Badges

```
Badge Standard: sm
Badge Élevé: md
```

## Exemples Visuels

### Carte Standard

```
┌─────────────────┐
│                 │ ← Ombre: md (card shadow)
│   Contenu       │
│                 │
└─────────────────┘
```

### Bouton Principal

```
┌──────────┐
│  Action  │ ← Ombre: button shadow (couleur primaire)
└──────────┘
```

### Floating Action Button

```
     ┌───┐
     │ + │ ← Ombre: floating (très élevée)
     └───┘
```

## Règles d'Or

### 1. Modération

Ne pas abuser des ombres. Utiliser avec parcimonie pour créer de la hiérarchie.

### 2. Cohérence

Respecter la hiérarchie des ombres. Ne pas mélanger les niveaux de manière incohérente.

### 3. Contexte

Adapter l'ombre au contexte :
- **Fond clair** : Ombres standard
- **Fond sombre** : Ombres plus subtiles ou absentes

### 4. Performance

Sur mobile, utiliser `elevation` (Android) pour de meilleures performances.

## Mode Sombre

En mode sombre, les ombres sont généralement :
- **Plus subtiles** : Opacité réduite
- **Parfois absentes** : Pour un look plus plat
- **Couleurs adaptées** : Utiliser des couleurs plus claires pour les ombres

## Accessibilité

Les ombres ne doivent pas :
- Créer de confusion visuelle
- Masquer du contenu important
- Distraire de l'information principale

## Ressources

- **Fichier de définition** : `mobile/mobile-app/constants/design.ts`

---

*Pour toute question sur les ombres, consulter l'équipe design.*

