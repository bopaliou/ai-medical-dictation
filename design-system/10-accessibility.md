# Accessibilité KadduCare

## Vue d'ensemble

L'accessibilité est une priorité pour KadduCare. Tous les composants et interfaces doivent être accessibles à tous les utilisateurs, y compris ceux utilisant des technologies d'assistance.

## Standards

### WCAG 2.1

KadduCare respecte les standards **WCAG 2.1 niveau AA** minimum, avec un objectif de niveau AAA pour les éléments critiques.

## Contraste des Couleurs

### Texte Normal

**Minimum** : 4.5:1 (WCAG AA)  
**Recommandé** : 7:1 (WCAG AAA)

### Texte Large

**Minimum** : 3:1 (WCAG AA)  
**Recommandé** : 4.5:1 (WCAG AAA)

### Combinaisons Approuvées

#### Mode Clair

- **Texte Principal (#1B1B1D) sur Fond (#F5F5F7)** : ✅ 16.5:1 (AAA)
- **Texte Principal sur Fond Card (#FFFFFF)** : ✅ 16.5:1 (AAA)
- **Texte Secondaire (#4A4A4A) sur Fond Card** : ✅ 7.1:1 (AAA)
- **Primary (#0A84FF) sur Blanc** : ✅ 4.5:1 (AA)

#### Mode Sombre

- **Texte Principal (#F2F2F3) sur Fond (#0D0D0F)** : ✅ 16.5:1 (AAA)
- **Texte Principal sur Fond Card (#161618)** : ✅ 16.5:1 (AAA)

## Tailles de Texte

### Minimum

- **Texte principal** : 16px minimum
- **Texte secondaire** : 14px minimum
- **Captions** : 12px minimum (avec contraste élevé)

### Recommandations

- **Body** : 16px (optimal pour la lisibilité)
- **Labels** : 14px minimum
- **Boutons** : 14px minimum avec poids 600

## Touch Targets

### Taille Minimum

**44x44px** (iOS et Android standard)

### Éléments Interactifs

Tous les éléments interactifs doivent respecter cette taille :
- Boutons
- Icônes cliquables
- Liens
- Inputs
- Checkboxes
- Radio buttons

### Espacement

**Minimum 8px** entre les touch targets pour éviter les erreurs de tap.

## Navigation au Clavier

### Ordre de Tab

L'ordre de navigation doit être logique et prévisible :
1. Header
2. Contenu principal
3. Actions
4. Footer/Tab bar

### Focus Visible

Tous les éléments focusables doivent avoir un indicateur de focus visible :
- **Couleur** : #0A84FF (Primary)
- **Style** : Border 2px ou outline
- **Contraste** : Minimum 3:1

## Screen Readers

### Labels

Tous les éléments interactifs doivent avoir des labels accessibles :

```javascript
<TouchableOpacity
  accessibilityLabel="Nouvelle dictée"
  accessibilityRole="button"
  accessibilityHint="Démarrer une nouvelle dictée médicale"
>
```

### Rôles

Utiliser les rôles appropriés :
- `button` : Boutons
- `link` : Liens
- `text` : Textes
- `image` : Images
- `header` : Headers
- `list` : Listes

### États

Annoncer les changements d'état :
- États de chargement
- Erreurs
- Succès
- Changements de contenu

## Images

### Alt Text

Toutes les images doivent avoir un texte alternatif descriptif :

```javascript
<Image
  source={...}
  accessibilityLabel="Logo KadduCare"
  accessibilityRole="image"
/>
```

### Images Décoratives

Les images purement décoratives doivent être marquées comme telles :

```javascript
<Image
  accessibilityElementsHidden={true}
  importantForAccessibility="no"
/>
```

## Formulaires

### Labels

Tous les champs de formulaire doivent avoir des labels :
- **Visible** : Label visible au-dessus ou à côté
- **Accessible** : `accessibilityLabel` pour les screen readers

### Erreurs

Les erreurs de formulaire doivent être :
- **Visibles** : Couleur d'erreur (#FF3B30)
- **Annoncées** : Accessibles aux screen readers
- **Claires** : Message d'erreur explicite

### Validation

La validation doit être :
- **Temps réel** : Feedback immédiat
- **Claire** : Message compréhensible
- **Accessible** : Annoncé aux screen readers

## Animations

### Réduction du Mouvement

Respecter la préférence `prefers-reduced-motion` :

```javascript
import { useColorScheme } from 'react-native';

// Réduire les animations si nécessaire
const reducedMotion = // Vérifier la préférence système
```

### Animations Subtiles

Les animations doivent être :
- **Subtiles** : Ne pas distraire
- **Optionnelles** : Pouvoir être désactivées
- **Non essentielles** : L'information doit être accessible sans animation

## Couleurs et États

### Ne Pas Utiliser Seulement la Couleur

Ne pas utiliser uniquement la couleur pour communiquer l'information :
- ✅ Utiliser couleur + icône
- ✅ Utiliser couleur + texte
- ❌ Utiliser seulement la couleur

### États Visuels

Tous les états doivent être visibles :
- **Hover** : Changement visible
- **Focus** : Indicateur de focus
- **Active** : État actif clair
- **Disabled** : État désactivé visible

## Checklist d'Accessibilité

### Contraste

- [ ] Tous les textes respectent 4.5:1 minimum
- [ ] Textes importants respectent 7:1
- [ ] Éléments interactifs ont un contraste suffisant

### Tailles

- [ ] Texte principal : 16px minimum
- [ ] Touch targets : 44x44px minimum
- [ ] Espacement entre éléments : 8px minimum

### Navigation

- [ ] Ordre de tab logique
- [ ] Focus visible sur tous les éléments
- [ ] Navigation au clavier fonctionnelle

### Screen Readers

- [ ] Tous les éléments ont des labels
- [ ] Rôles appropriés définis
- [ ] États annoncés
- [ ] Images ont des alt text

### Formulaires

- [ ] Labels visibles et accessibles
- [ ] Erreurs claires et annoncées
- [ ] Validation accessible

### Animations

- [ ] Animations subtiles
- [ ] Réduction du mouvement respectée
- [ ] Information accessible sans animation

## Ressources

- **WCAG 2.1** : https://www.w3.org/WAI/WCAG21/quickref/
- **React Native Accessibility** : https://reactnative.dev/docs/accessibility
- **iOS Accessibility** : https://developer.apple.com/accessibility/
- **Android Accessibility** : https://developer.android.com/guide/topics/ui/accessibility

## Tests

### Outils de Test

- **iOS** : VoiceOver
- **Android** : TalkBack
- **Contraste** : WebAIM Contrast Checker
- **Navigation** : Test au clavier

### Tests Recommandés

1. **Test avec Screen Reader** : Naviguer l'app avec VoiceOver/TalkBack
2. **Test de Contraste** : Vérifier tous les textes
3. **Test au Clavier** : Navigation complète au clavier
4. **Test de Touch Targets** : Vérifier toutes les tailles

---

*Pour toute question sur l'accessibilité, consulter l'équipe design.*

