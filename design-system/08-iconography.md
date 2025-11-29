# Iconographie KadduCare

## Vue d'ensemble

L'iconographie KadduCare utilise Ionicons comme bibliothèque principale, garantissant une cohérence visuelle et une large gamme d'icônes adaptées au contexte médical.

## Bibliothèque d'Icônes

### Ionicons

**Bibliothèque** : @expo/vector-icons (Ionicons)

Ionicons offre :
- Plus de 1000 icônes
- Style cohérent et moderne
- Support iOS et Android
- Optimisé pour mobile

## Tailles Standard

### Petite (Small)

```
Size: 16px
```

**Usage** :
- Icônes dans les badges
- Icônes discrètes
- Icônes dans les labels

### Standard (Medium)

```
Size: 20-24px
```

**Usage** :
- Icônes dans les boutons
- Icônes dans les headers
- Icônes dans les cartes

### Grande (Large)

```
Size: 28-32px
```

**Usage** :
- Icônes principales
- Icônes dans les FAB
- Icônes d'action importantes

### Très Grande (Extra Large)

```
Size: 48px+
```

**Usage** :
- Icônes d'illustration
- Icônes de statut importantes
- Icônes décoratives

## Couleurs

### Icônes Principales

**Couleur** : #0A84FF (Primary)

**Usage** :
- Icônes d'action principales
- Icônes de navigation active
- Icônes importantes

### Icônes Secondaires

**Couleur** : #8E8E93 (Text Muted)

**Usage** :
- Icônes discrètes
- Icônes de navigation inactive
- Icônes d'information

### Icônes de Statut

**Couleurs** :
- **Success** : #34C759 (Success)
- **Error** : #FF3B30 (Error)
- **Warning** : #FF9500 (Warning)
- **Info** : #0A84FF (Primary)

**Usage** :
- Badges de statut
- Indicateurs
- Alertes

### Icônes sur Fond Coloré

**Couleur** : #FFFFFF (Blanc)

**Usage** :
- Icônes dans les boutons colorés
- Icônes dans les FAB
- Icônes sur fonds colorés

## Icônes par Contexte

### Navigation

- **Home** : `home`
- **Rapports** : `document-text`
- **Patients** : `people`
- **Profil** : `person`

### Actions

- **Nouvelle dictée** : `mic`
- **Enregistrer** : `save`
- **Partager** : `share`
- **Supprimer** : `trash`
- **Éditer** : `create`
- **Valider** : `checkmark-circle`

### Statuts

- **Finalisé** : `checkmark-circle` (vert)
- **Brouillon** : `document-text` (orange)
- **Corbeille** : `trash` (rouge)

### Médical

- **Patient** : `person`
- **Médecin** : `medical`
- **Rapport** : `document-text`
- **Statistiques** : `stats-chart`
- **Calendrier** : `calendar`

### Interface

- **Recherche** : `search`
- **Filtre** : `filter`
- **Paramètres** : `settings`
- **Retour** : `arrow-back`
- **Fermer** : `close`

## Règles d'Utilisation

### ✅ Bonnes Pratiques

- Utiliser des icônes cohérentes pour des actions similaires
- Respecter les tailles standard
- Utiliser les couleurs appropriées au contexte
- Maintenir un espacement suffisant autour des icônes
- Utiliser des icônes reconnaissables et intuitives

### ❌ À Éviter

- Ne pas mélanger différents styles d'icônes
- Ne pas utiliser des icônes trop petites (< 16px)
- Ne pas utiliser des couleurs qui nuisent à la lisibilité
- Ne pas surcharger l'interface avec trop d'icônes
- Ne pas utiliser des icônes ambiguës

## Espacement

### Icône + Texte

```
[Icon] [Gap: 8px] Text
```

### Icône + Icône

```
[Icon] [Gap: 12px] [Icon]
```

### Icône dans Bouton

```
Padding autour de l'icône: 12px minimum
```

## Touch Targets

Toutes les icônes interactives doivent avoir un **touch target minimum de 44x44px** (iOS/Android standard).

Si l'icône est plus petite, ajouter du padding pour atteindre 44x44px.

## Accessibilité

### Labels

Toutes les icônes interactives doivent avoir :
- **accessibilityLabel** : Description textuelle
- **accessibilityRole** : Rôle approprié (button, image, etc.)
- **accessibilityHint** : Indication d'action (optionnel)

### Contraste

Les icônes doivent respecter un contraste minimum de **3:1** avec leur fond.

## Animation

### Icônes Interactives

Les icônes dans les boutons peuvent avoir une légère animation :
- **Scale** : 0.95 → 1.0 au press
- **Opacity** : 1.0 → 0.7 au press

### Icônes de Statut

Les icônes de statut peuvent avoir une animation subtile :
- **Fade in** : Pour l'apparition
- **Pulse** : Pour les notifications (optionnel)

## Mode Sombre

En mode sombre :
- **Icônes principales** : Couleur adaptée (plus claire)
- **Icônes secondaires** : Opacité ajustée
- **Icônes sur fond** : Couleur inversée si nécessaire

## Ressources

- **Bibliothèque** : @expo/vector-icons
- **Documentation** : https://ionic.io/ionicons
- **Composants** : `mobile/mobile-app/components/`

---

*Pour toute question sur l'iconographie, consulter l'équipe design.*

