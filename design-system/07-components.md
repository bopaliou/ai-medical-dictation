# Composants UI KadduCare

## Vue d'ensemble

Les composants UI KadduCare sont conçus pour être cohérents, accessibles et adaptés au contexte médical. Chaque composant suit les principes du Design System.

## Boutons

### Bouton Principal (Primary)

Bouton d'action principal, utilisé pour les actions les plus importantes.

**Spécifications** :
- **Background** : #0A84FF (Primary)
- **Text Color** : #FFFFFF (Blanc)
- **Border Radius** : 16px (button)
- **Padding** : 12px vertical, 16px horizontal
- **Font** : Label (14px, 600 weight)
- **Shadow** : button shadow
- **Height** : 48px minimum

**États** :
- **Default** : Background primary, ombre button
- **Pressed** : Opacité 0.8, scale 0.98
- **Disabled** : Opacité 0.4, pas d'interaction

**Usage** :
- Actions principales
- Soumission de formulaires
- Actions critiques

### Bouton Secondaire (Secondary)

Bouton pour les actions secondaires.

**Spécifications** :
- **Background** : Transparent
- **Text Color** : #0A84FF (Primary)
- **Border** : 1px solid #0A84FF
- **Border Radius** : 16px (button)
- **Padding** : 12px vertical, 16px horizontal
- **Font** : Label (14px, 600 weight)
- **Height** : 48px minimum

**États** :
- **Default** : Border primary, texte primary
- **Pressed** : Background primary light (#E8F1FF)
- **Disabled** : Opacité 0.4

**Usage** :
- Actions secondaires
- Alternatives aux actions principales

### Bouton Outline

Bouton avec contour uniquement.

**Spécifications** :
- **Background** : Transparent
- **Text Color** : #1B1B1D (Text)
- **Border** : 1px solid #E5E5EA (Border)
- **Border Radius** : 16px (button)
- **Padding** : 12px vertical, 16px horizontal

**Usage** :
- Actions tertiaires
- Actions discrètes

### Bouton Texte (Text)

Bouton sans background ni bordure.

**Spécifications** :
- **Background** : Transparent
- **Text Color** : #0A84FF (Primary)
- **Padding** : 8px vertical, 12px horizontal
- **Font** : Label (14px, 600 weight)

**Usage** :
- Actions discrètes
- Liens d'action
- Actions secondaires dans les headers

## Cartes

### Carte de Statistique

Carte pour afficher des statistiques et métriques.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border** : 1px solid #E5E5EA (Border Card)
- **Border Radius** : 20px (card)
- **Padding** : 20px (cardPadding)
- **Shadow** : card shadow
- **Min Height** : 100px

**Structure** :
```
┌─────────────────────────┐
│ [Icon]  Label           │
│                          │
│      Value               │
│                          │
└─────────────────────────┘
```

**Usage** :
- Statistiques sur le dashboard
- Métriques importantes
- Indicateurs clés

### Carte de Rapport

Carte pour afficher les informations d'un rapport.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border** : 1px solid #E5E5EA (Border Card)
- **Border Radius** : 20px (card)
- **Padding** : 20px (cardPadding)
- **Shadow** : card shadow
- **Margin Bottom** : 16px (lg)

**Structure** :
```
┌─────────────────────────┐
│ Patient Name            │
│ Date | Status Badge     │
│                          │
│ Preview text...          │
│                          │
│ [Actions]                │
└─────────────────────────┘
```

**Usage** :
- Liste de rapports
- Historique
- Rapports récents

### Carte de Patient

Carte pour afficher les informations d'un patient.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border** : 1px solid #E5E5EA (Border Card)
- **Border Radius** : 20px (card)
- **Padding** : 20px (cardPadding)
- **Shadow** : card shadow

**Usage** :
- Liste de patients
- Détails patient
- Recherche de patients

## Headers

### AppHeader

Header principal avec logo et titre KadduCare.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border Bottom** : 1px solid #E5E5EA (Border Card)
- **Padding** : 16px vertical, 24px horizontal
- **Logo Size** : 70px
- **Title** : H1 (36px, 800 weight)
- **Gap** : 12px entre logo et titre

**Structure** :
```
┌─────────────────────────────┐
│ [Logo] KadduCare            │
└─────────────────────────────┘
```

**Usage** :
- Tous les écrans principaux
- Headers de navigation

### ModernHeader

Header moderne avec bouton retour et actions.

**Spécifications** :
- **Background** : Gradient léger
- **Padding** : Safe Area + 12px top, 16px bottom
- **Back Button** : 44x44px touch target
- **Title** : H2 (28px, 700 weight)

**Usage** :
- Écrans de détail
- Modals
- Écrans secondaires

## Tabs (Tab Bar)

### Tab Bar

Barre de navigation inférieure.

**Spécifications** :
- **Background** : #FFFFFF (Mode clair) / #111114 (Mode sombre)
- **Height** : 56px + safe area
- **Border Top** : 1px solid #E5E5EA
- **Padding** : 8px vertical
- **Icon Size** : 26px
- **Label** : Caption (12px, 400 weight)

**États** :
- **Active** : #0A84FF (Primary), opacité 1
- **Inactive** : #8E8E93 (Text Muted), opacité 0.6-0.7

**Usage** :
- Navigation principale
- Accès rapide aux sections

## Floating Action Button (FAB)

Bouton d'action flottant pour l'action principale.

**Spécifications** :
- **Background** : #0A84FF (Primary)
- **Size** : 72x72px
- **Border Radius** : 9999px (full - cercle)
- **Icon** : 32px, blanc
- **Shadow** : floating shadow
- **Position** : Bottom right, au-dessus de la tab bar

**États** :
- **Default** : Scale 1, ombre floating
- **Pressed** : Scale 1.08 puis 1.0 (swell animation)
- **Hidden** : Sur onboarding, login, record actif

**Usage** :
- Action principale (Nouvelle dictée)
- Actions flottantes importantes

## Inputs

### Input Standard

Champ de saisie de texte.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border** : 1px solid #E5E5EA (Border)
- **Border Radius** : 12px (input)
- **Padding** : 12px (md)
- **Font** : Body (16px, 400 weight)
- **Height** : 48px minimum

**États** :
- **Default** : Border standard
- **Focus** : Border #0A84FF (Primary), ombre sm
- **Error** : Border #FF3B30 (Error)
- **Disabled** : Opacité 0.4, background #F5F5F7

**Usage** :
- Formulaires
- Recherche
- Saisie de données

### Search Input

Champ de recherche spécialisé.

**Spécifications** :
- **Background** : #FAFAFA (Background Secondary)
- **Border** : 1px solid #E5E5EA
- **Border Radius** : 12px (input)
- **Padding** : 12px (md)
- **Icon** : Search icon à gauche
- **Placeholder** : Body Small (15px, 400 weight)

**Usage** :
- Recherche de patients
- Recherche de rapports
- Filtres

## Badges

### Badge de Statut

Badge pour afficher le statut d'un élément.

**Spécifications** :
- **Border Radius** : 12px (badge)
- **Padding** : 6px vertical, 12px horizontal
- **Font** : Label Small (13px, 500 weight)
- **Height** : 24px minimum

**Variantes** :
- **Final** : Background #E8F5E9, Text #34C759
- **Draft** : Background #F5F5F7, Text #8E8E93
- **Trash** : Background #FFEBEE, Text #FF3B30

**Usage** :
- Statuts de rapports
- Indicateurs d'état
- Tags

## Modals

### Modal Standard

Modal pour afficher du contenu ou des actions.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border Radius** : 24px (xxl) en haut
- **Padding** : 24px (screenPadding)
- **Shadow** : xl shadow
- **Max Width** : 90% de l'écran
- **Max Height** : 80% de l'écran

**Structure** :
```
┌─────────────────────────┐
│ [Header avec titre]     │
│                          │
│ Contenu                  │
│                          │
│ [Actions]                │
└─────────────────────────┘
```

**Usage** :
- Sélection de patient
- Confirmations
- Formulaires modaux

### Bottom Sheet

Modal qui s'ouvre depuis le bas.

**Spécifications** :
- **Background** : #FFFFFF (Background Card)
- **Border Radius** : 24px (xxl) en haut
- **Padding** : 24px (screenPadding)
- **Shadow** : xl shadow
- **Animation** : Slide up depuis le bas

**Usage** :
- Actions rapides
- Options
- Sélections

## Liste d'Éléments

### Liste Standard

Liste d'éléments avec espacement cohérent.

**Spécifications** :
- **Padding Horizontal** : 24px (screenPadding)
- **Padding Vertical** : 16px (lg)
- **Item Spacing** : 12px (md)
- **Background** : #FFFFFF (Background Card)

**Usage** :
- Listes de rapports
- Listes de patients
- Historique

## Ressources

- **Composants React Native** : `mobile/mobile-app/components/`
- **Fichier de définition** : `mobile/mobile-app/constants/design.ts`

---

*Pour toute question sur les composants, consulter l'équipe design.*

