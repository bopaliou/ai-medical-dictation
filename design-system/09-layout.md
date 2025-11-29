# Système de Layout KadduCare

## Vue d'ensemble

Le système de layout KadduCare est conçu pour être mobile-first, responsive et adapté aux différentes tailles d'écran.

## Principe Mobile-First

Tous les layouts sont conçus d'abord pour mobile, puis adaptés pour les tablettes et écrans plus grands.

## Structure de Base

### Container Principal

```
┌─────────────────────────────┐
│ Safe Area Top               │
│ ┌─────────────────────────┐ │
│ │ Screen Padding: 24px    │ │
│ │                         │ │
│ │   Contenu               │ │
│ │                         │ │
│ │ Screen Padding: 24px    │ │
│ └─────────────────────────┘ │
│ Safe Area Bottom            │
└─────────────────────────────┘
```

### Padding d'Écran

**Mobile** :
- **Horizontal** : 24px (screenPadding)
- **Vertical** : Selon le contexte (header, content, footer)

**Tablette** :
- **Horizontal** : 32px (xxxl)
- **Vertical** : Selon le contexte

## Safe Area

### Zones de Sécurité

Les zones de sécurité (safe area) sont respectées pour :
- **Top** : Status bar et notch
- **Bottom** : Home indicator et tab bar

### Utilisation

```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();
// insets.top : Zone de sécurité supérieure
// insets.bottom : Zone de sécurité inférieure
```

## Grille

### Système de Colonnes (Mobile)

Sur mobile, la grille est simple :
- **1 colonne** : Contenu principal
- **2 colonnes** : Pour les statistiques (2x2 grid)

### Grille Statistiques

```
┌─────────────┬─────────────┐
│   Card 1    │   Card 2    │
│  (50% - 4px)│  (50% - 4px)│
├─────────────┼─────────────┤
│   Card 3    │   Card 4    │
│  (50% - 4px)│  (50% - 4px)│
└─────────────┴─────────────┘
```

**Gap** : 8px (sm) entre les cartes

### Grille Tablette

Sur tablette, possibilité d'utiliser :
- **2 colonnes** : Pour le contenu principal
- **3 colonnes** : Pour les statistiques

## Breakpoints

### Mobile

```
Width: < 768px
Padding: 24px (screenPadding)
Colonnes: 1 (principal), 2 (statistiques)
```

### Tablette

```
Width: >= 768px
Padding: 32px (xxxl)
Colonnes: 2 (principal), 3 (statistiques)
```

## Headers

### Header Principal

```
┌─────────────────────────────┐
│ Safe Area Top               │
│ ┌─────────────────────────┐ │
│ │ [Logo] KadduCare        │ │ ← Padding: 16px vertical, 24px horizontal
│ └─────────────────────────┘ │
│ Border Bottom: 1px           │
└─────────────────────────────┘
```

### Header Compact

```
┌─────────────────────────────┐
│ [Logo] Title        [Action]│ ← Padding: 12px vertical, 24px horizontal
└─────────────────────────────┘
```

## Contenu

### Section Standard

```
┌─────────────────────────────┐
│ Screen Padding: 24px        │
│                             │
│ Title (H2)                  │
│ [Margin Bottom: 12px]       │
│                             │
│ Content                      │
│                             │
│ Screen Padding: 24px         │
└─────────────────────────────┘
     ↓
[Section Margin: 32px]
```

### Liste

```
┌─────────────────────────────┐
│ Screen Padding: 24px        │
│                             │
│ Item 1                      │
│ [Margin Bottom: 12px]       │
│                             │
│ Item 2                      │
│ [Margin Bottom: 12px]       │
│                             │
│ Item 3                      │
│                             │
│ Screen Padding: 24px       │
└─────────────────────────────┘
```

## Tab Bar

### Position

```
┌─────────────────────────────┐
│                             │
│        Contenu              │
│                             │
├─────────────────────────────┤
│ Tab 1  Tab 2  Tab 3  Tab 4  │ ← Tab Bar
│ Safe Area Bottom            │
└─────────────────────────────┘
```

**Hauteur** : 56px + safe area bottom  
**Padding** : 8px vertical

## FAB (Floating Action Button)

### Position

```
┌─────────────────────────────┐
│                             │
│        Contenu              │
│                             │
│                    ┌───┐    │ ← FAB
│                    │ + │    │
│                    └───┘    │
├─────────────────────────────┤
│ Tab Bar                     │
└─────────────────────────────┘
```

**Position** : Bottom right  
**Margin** : 20px depuis les bords  
**Au-dessus de** : Tab bar + 16px

## Modals

### Modal Centrée

```
┌─────────────────────────────┐
│        Overlay (40% opacity)  │
│  ┌───────────────────────┐   │
│  │                       │   │
│  │      Modal            │   │
│  │                       │   │
│  └───────────────────────┘   │
└─────────────────────────────┘
```

**Max Width** : 90% de l'écran  
**Max Height** : 80% de l'écran  
**Centrage** : Vertical et horizontal

### Bottom Sheet

```
┌─────────────────────────────┐
│        Overlay (40% opacity)  │
│                             │
│  ┌───────────────────────┐   │
│  │                       │   │
│  │   Bottom Sheet        │   │
│  └───────────────────────┘   │
└─────────────────────────────┘
```

**Position** : Bottom  
**Border Radius** : 24px en haut

## Scroll Views

### Scroll View Standard

```
┌─────────────────────────────┐
│ Header (fixe)                │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Content (scrollable)     │ │
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Tab Bar (fixe)              │
└─────────────────────────────┘
```

**Content Padding** : 24px horizontal  
**Content Margin** : 16px entre sections

## Règles d'Or

### 1. Cohérence

Respecter les paddings et marges du système d'espacement.

### 2. Hiérarchie

Utiliser l'espacement pour créer une hiérarchie visuelle claire.

### 3. Respiration

Laisser suffisamment d'espace blanc pour un design aéré.

### 4. Safe Area

Toujours respecter les safe areas pour éviter les zones non accessibles.

## Accessibilité

### Touch Targets

Tous les éléments interactifs : **44x44px minimum**

### Espacement pour Navigation

Espacement suffisant entre les éléments interactifs pour éviter les erreurs de tap.

## Performance

### Optimisation

- Utiliser `FlatList` pour les longues listes
- Éviter les layouts complexes avec trop de niveaux
- Optimiser les re-renders avec `React.memo`

## Ressources

- **Safe Area** : react-native-safe-area-context
- **Layout Components** : React Native View, ScrollView, FlatList

---

*Pour toute question sur le layout, consulter l'équipe design.*

