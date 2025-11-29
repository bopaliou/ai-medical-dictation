# Système d'Espacement KadduCare

## Vue d'ensemble

Le système d'espacement KadduCare est basé sur une grille de **4px**, garantissant une cohérence visuelle et un design aéré et premium.

## Principe Fondamental

**Base** : Tous les espacements sont des multiples de 4px

Cela permet :
- Cohérence visuelle
- Alignement parfait
- Design aéré et premium
- Facilité de calcul et d'implémentation

## Échelle d'Espacement

### Échelle Standard

```
xs:   4px   (0.25rem)  - Espacement très petit
sm:   8px   (0.5rem)   - Espacement petit
md:   12px  (0.75rem)  - Espacement moyen
lg:   16px  (1rem)     - Espacement large
xl:   20px  (1.25rem)  - Espacement très large
xxl:  24px  (1.5rem)   - Espacement extra large
xxxl: 32px  (2rem)     - Espacement triple large
xxxxl: 40px (2.5rem)   - Espacement quadruple large
xxxxxl: 48px (3rem)     - Espacement quintuple large
```

### Espacements Spécifiques

```
section:        32px  - Espacement entre sections principales
sectionLarge:   48px  - Espacement entre grandes sections
cardPadding:    20px  - Padding interne des cartes
screenPadding:  24px  - Padding latéral des écrans
```

## Usage par Contexte

### Padding des Éléments

#### Cartes

```
Padding: 20px (cardPadding)
Border Radius: 20px
```

#### Boutons

```
Padding Horizontal: 16px (lg)
Padding Vertical: 12px (md)
```

#### Inputs

```
Padding Horizontal: 12px (md)
Padding Vertical: 12px (md)
```

### Marges entre Éléments

#### Entre Cartes

```
Margin Bottom: 16px (lg)
```

#### Entre Sections

```
Margin Bottom: 32px (section)
```

#### Entre Titre et Contenu

```
Margin Bottom: 12px (md)
```

### Espacement dans les Headers

#### Header Principal

```
Padding Top: Safe Area + 12px (md)
Padding Bottom: 16px (lg)
Padding Horizontal: 24px (screenPadding)
Gap entre logo et texte: 12px (md)
```

#### Header Compact

```
Padding Top: 12px (md)
Padding Bottom: 12px (md)
Padding Horizontal: 24px (screenPadding)
```

### Espacement dans les Listes

#### Entre Items de Liste

```
Margin Bottom: 12px (md)
```

#### Padding de Liste

```
Padding Horizontal: 24px (screenPadding)
Padding Vertical: 16px (lg)
```

### Espacement dans les Formulaires

#### Entre Champs

```
Margin Bottom: 20px (xl)
```

#### Groupe de Champs

```
Margin Bottom: 32px (section)
```

#### Labels

```
Margin Bottom: 8px (sm)
```

## Exemples Visuels

### Carte de Statistique

```
┌─────────────────────────────┐
│  [Padding: 20px]            │
│  ┌─────────────────────┐    │
│  │ Icon  [Gap: 12px]   │    │
│  │       Label         │    │
│  └─────────────────────┘    │
│  Value                      │
│  [Padding: 20px]            │
└─────────────────────────────┘
     ↓
[Margin Bottom: 16px]
```

### Section avec Titre

```
┌─────────────────────────────┐
│ [Screen Padding: 24px]      │
│                             │
│ Title                       │
│ [Margin Bottom: 12px]       │
│                             │
│ Content                     │
│                             │
│ [Screen Padding: 24px]      │
└─────────────────────────────┘
     ↓
[Section Margin: 32px]
```

### Header avec Logo

```
┌─────────────────────────────┐
│ [Safe Area + 12px]          │
│                             │
│ [Logo] [Gap: 12px] KadduCare│
│                             │
│ [Padding Bottom: 16px]      │
└─────────────────────────────┘
```

## Règles d'Or

### 1. Cohérence

Toujours utiliser les valeurs du système d'espacement. Ne pas inventer de nouvelles valeurs.

### 2. Hiérarchie

- **Petits éléments** : xs, sm
- **Éléments moyens** : md, lg
- **Sections** : xl, xxl, section
- **Grandes sections** : xxxl, sectionLarge

### 3. Aération

Privilégier un espacement généreux pour un design premium et aéré.

### 4. Groupement

Éléments liés : espacement petit (sm, md)  
Éléments séparés : espacement large (lg, xl)  
Sections différentes : espacement très large (section, sectionLarge)

## Accessibilité

### Touch Targets

Tous les éléments interactifs doivent avoir un espacement minimum de **44x44px** (touch target iOS/Android).

### Espacement pour Lisibilité

- **Entre lignes de texte** : Utiliser le line-height de la typographie
- **Entre paragraphes** : 16px (lg) minimum
- **Entre sections** : 32px (section) minimum

## Responsive

### Mobile

```
Screen Padding: 24px (screenPadding)
Card Padding: 20px (cardPadding)
Section Margin: 32px (section)
```

### Tablette

```
Screen Padding: 32px (xxxl)
Card Padding: 24px (xxl)
Section Margin: 48px (sectionLarge)
```

## Ressources

- **Fichier de définition** : `mobile/mobile-app/constants/design.ts`
- **JSON** : `design-system/spacing.json`

---

*Pour toute question sur l'espacement, consulter l'équipe design.*

