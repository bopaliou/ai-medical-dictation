# Typographie KadduCare

## Vue d'ensemble

Le système typographique KadduCare utilise une hiérarchie claire et professionnelle pour garantir une excellente lisibilité dans un contexte médical.

## Police Principale

### Recommandation

**Inter** ou **Police système** (San Francisco sur iOS, Roboto sur Android)

La police système est recommandée pour :
- Meilleure intégration native
- Performance optimale
- Cohérence avec le système d'exploitation
- Support automatique des langues

### Fallback

Si Inter n'est pas disponible, utiliser la police système par défaut :
- **iOS** : San Francisco (SF Pro)
- **Android** : Roboto
- **Web** : -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

## Hiérarchie Typographique

### Titres Principaux

#### H1 - Titre Principal

```
Font Size: 32px
Font Weight: 700 (Bold)
Line Height: 40px
Letter Spacing: -0.8px
```

**Usage** :
- Titres d'écran principaux
- Titres de sections importantes
- Headers de modals

**Exemple** : "KadduCare" dans le header

#### H2 - Titre Secondaire

```
Font Size: 28px
Font Weight: 700 (Bold)
Line Height: 36px
Letter Spacing: -0.5px
```

**Usage** :
- Sous-titres de sections
- Titres de cartes importantes
- Headers de formulaires

#### H3 - Titre Tertiaire

```
Font Size: 24px
Font Weight: 600 (Semi-Bold)
Line Height: 32px
Letter Spacing: -0.3px
```

**Usage** :
- Titres de sous-sections
- Titres de cartes
- Headers de listes

#### H4 - Titre Quaternaire

```
Font Size: 20px
Font Weight: 600 (Semi-Bold)
Line Height: 28px
Letter Spacing: -0.2px
```

**Usage** :
- Titres de petits éléments
- Labels de groupes
- Headers compacts

### Sous-titres

#### Subtitle

```
Font Size: 18px
Font Weight: 500 (Medium)
Line Height: 26px
Letter Spacing: -0.1px
```

**Usage** :
- Sous-titres de sections
- Descriptions importantes
- Textes d'introduction

#### Subtitle Small

```
Font Size: 16px
Font Weight: 500 (Medium)
Line Height: 24px
Letter Spacing: 0px
```

**Usage** :
- Sous-titres compacts
- Descriptions secondaires

### Corps de Texte

#### Body

```
Font Size: 16px
Font Weight: 400 (Regular)
Line Height: 24px
Letter Spacing: 0px
```

**Usage** :
- Paragraphes principaux
- Contenu de cartes
- Textes descriptifs

#### Body Small

```
Font Size: 15px
Font Weight: 400 (Regular)
Line Height: 22px
Letter Spacing: 0px
```

**Usage** :
- Textes secondaires
- Descriptions courtes
- Métadonnées

#### Body Tiny

```
Font Size: 14px
Font Weight: 400 (Regular)
Line Height: 20px
Letter Spacing: 0.1px
```

**Usage** :
- Textes très compacts
- Informations discrètes

### Labels et Boutons

#### Label

```
Font Size: 14px
Font Weight: 600 (Semi-Bold)
Line Height: 20px
Letter Spacing: 0.1px
```

**Usage** :
- Labels de champs
- Textes de boutons
- Étiquettes

#### Label Small

```
Font Size: 13px
Font Weight: 500 (Medium)
Line Height: 18px
Letter Spacing: 0.1px
```

**Usage** :
- Labels compacts
- Textes de petits boutons

### Captions et Métadonnées

#### Caption

```
Font Size: 12px
Font Weight: 400 (Regular)
Line Height: 16px
Letter Spacing: 0.2px
```

**Usage** :
- Captions d'images
- Métadonnées
- Textes d'aide

#### Caption Small

```
Font Size: 11px
Font Weight: 400 (Regular)
Line Height: 14px
Letter Spacing: 0.2px
```

**Usage** :
- Captions très petits
- Timestamps
- Informations minimales

### Chiffres et Statistiques

#### Number

```
Font Size: 28px
Font Weight: 700 (Bold)
Line Height: 34px
Letter Spacing: -0.5px
```

**Usage** :
- Statistiques
- Chiffres importants
- Compteurs

#### Number Large

```
Font Size: 36px
Font Weight: 800 (Extra-Bold)
Line Height: 44px
Letter Spacing: -0.8px
```

**Usage** :
- Statistiques principales
- Chiffres très importants
- Headlines numériques

## Principes d'Utilisation

### Hiérarchie

1. **H1** : Un seul par écran, titre principal
2. **H2** : Sections principales
3. **H3** : Sous-sections
4. **H4** : Éléments mineurs
5. **Body** : Contenu principal
6. **Caption** : Métadonnées et informations secondaires

### Espacement

- **Entre titre et sous-titre** : 4px (Spacing.xs)
- **Entre titre et paragraphe** : 12px (Spacing.md)
- **Entre paragraphes** : 16px (Spacing.lg)

### Longueur de Ligne

Pour une lisibilité optimale :
- **Mobile** : 280-320px (environ 50-60 caractères)
- **Tablette** : 400-500px (environ 65-75 caractères)

### Contraste

Tous les textes doivent respecter :
- **WCAG AA** : 4.5:1 minimum pour le texte normal
- **WCAG AAA** : 7:1 minimum pour le texte important

## Exemples d'Utilisation

### Header d'Écran

```
H1: "KadduCare" (36px, 800 weight)
Subtitle: "Votre assistant médical" (16px, 400 weight)
```

### Carte de Statistique

```
H3: "Total des rapports" (24px, 600 weight)
Number Large: "42" (36px, 800 weight)
Caption: "Cette semaine" (12px, 400 weight)
```

### Formulaire

```
H4: "Informations patient" (20px, 600 weight)
Label: "Nom complet" (14px, 600 weight)
Body: Valeur du champ (16px, 400 weight)
```

### Liste d'Éléments

```
H3: "Rapports récents" (24px, 600 weight)
Body: Nom du rapport (16px, 400 weight)
Body Small: Date (15px, 400 weight)
Caption: Statut (12px, 400 weight)
```

## Accessibilité

### Tailles Minimales

- **Texte principal** : 16px minimum
- **Texte secondaire** : 14px minimum
- **Captions** : 12px minimum (avec contraste élevé)

### Poids de Police

- **Texte important** : 600-700 (Semi-Bold à Bold)
- **Texte normal** : 400 (Regular)
- **Texte discret** : 400 (Regular) avec opacité réduite

### Support des Langues

La police système supporte automatiquement :
- Français
- Anglais
- Langues africaines (selon le système)
- Caractères spéciaux médicaux

## Ressources

- **Fichier de définition** : `mobile/mobile-app/constants/design.ts`
- **JSON** : `design-system/typography.json`

---

*Pour toute question sur la typographie, consulter l'équipe design.*

