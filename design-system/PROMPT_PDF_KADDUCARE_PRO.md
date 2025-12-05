# Prompt : Styliser le PDF en Mode KadduCare Pro

## 🎯 Objectif

Transformer le PDF généré par KadduCare en un document médical **premium, professionnel et élégant** qui reflète l'identité de marque KadduCare et inspire confiance dans un contexte médical.

---

## 📐 Principes de Design Pro

### 1. **Identité Visuelle KadduCare**

- **Couleur principale** : Bleu KadduCare `#0A84FF` (confiance, professionnalisme médical)
- **Couleur secondaire** : Vert Santé `#34C759` (validation, statuts positifs)
- **Palette neutre** : Gris professionnels pour les textes et séparateurs
- **Blanc pur** : Fond principal pour la clarté et la lisibilité

### 2. **Hiérarchie Visuelle Premium**

- **Espacement généreux** : Marges et paddings aérés (minimum 40px sur les côtés)
- **Typographie hiérarchisée** : Tailles et poids de police clairement différenciés
- **Séparateurs élégants** : Lignes fines (0.5-1px) avec opacité réduite
- **Ombres subtiles** : Ombres douces pour la profondeur (shadowRadius: 2-4px, opacity: 0.1-0.15)

### 3. **Éléments de Design Pro**

- **Bordures arrondies** : Rayons de 4-8px pour les blocs d'information
- **Dégradés subtils** : Dégradés légers pour les backgrounds (bleu très clair → blanc)
- **Icônes minimalistes** : Style line, épaisseur 1.5-2px
- **Badges de statut** : Formes arrondies avec couleurs sémantiques

---

## 🎨 Spécifications Détaillées

### **Header (Bannière Bleue)**

```
- Hauteur : 60px (au lieu de 50px)
- Couleur : #0A84FF (Bleu KadduCare)
- Logo : 32px × 32px, centré verticalement, marge gauche 40px
- Texte "KadduCare" : 
  * Font: Helvetica-Bold
  * Size: 22px
  * Color: #FFFFFF
  * Letter-spacing: -0.5px
- Titre "Rapport Infirmier" :
  * Font: Helvetica
  * Size: 12px
  * Color: #FFFFFF
  * Opacity: 0.95
- Date/Heure :
  * Font: Helvetica
  * Size: 10px
  * Color: #FFFFFF
  * Opacity: 0.9
  * Align: Right, marge droite 40px
```

### **Bloc Informations Patient**

```
- Background : #F5F9FF (Bleu très clair KadduCare)
- Border : 1px solid #E5E5EA
- Border-radius : 8px
- Padding : 20px
- Margin-bottom : 30px
- Shadow : Subtile (offsetY: 2px, blur: 4px, opacity: 0.08)

Labels (NOM COMPLET, ÂGE, etc.) :
  * Font: Helvetica
  * Size: 9px
  * Color: #8E8E93
  * Letter-spacing: 0.5px
  * Text-transform: UPPERCASE
  * Margin-bottom: 4px

Valeurs :
  * Font: Helvetica-Bold (pour nom) / Helvetica (pour autres)
  * Size: 13px (nom) / 12px (autres)
  * Color: #1B1B1D
  * Line-height: 1.4
```

### **Sections SOAPIE**

#### **En-têtes de Section**

```
Format : "S – SUBJECTIF"
  * Font: Helvetica-Bold
  * Size: 12px
  * Color: #0A84FF (Bleu KadduCare)
  * Letter-spacing: 0.3px
  * Margin-bottom: 8px

Séparateur :
  * Line: 1px solid #E5E5EA
  * Opacity: 0.6
  * Margin-top: 10px
  * Margin-bottom: 16px
```

#### **Contenu des Sections**

```
Texte normal :
  * Font: Helvetica
  * Size: 10.5px
  * Color: #1B1B1D
  * Line-height: 1.6
  * Letter-spacing: 0.1px

Puces (•) :
  * Color: #0A84FF
  * Size: 8px
  * Margin-right: 8px
  * Vertical-align: middle

Listes :
  * Margin-left: 0px
  * Padding-left: 0px
  * Line-gap: 6px
```

### **Tableau Objectif (Signes Vitaux)**

```
En-têtes de colonnes :
  * Font: Helvetica-Bold
  * Size: 9px
  * Color: #4A4A4A
  * Letter-spacing: 0.5px
  * Text-transform: UPPERCASE
  * Padding-bottom: 8px

Ligne de séparation :
  * Line: 1px solid #E5E5EA
  * Opacity: 0.7

Valeurs :
  * Font: Helvetica
  * Size: 10px
  * Color: #1B1B1D
  * Align: Right (pour les valeurs numériques)
  * Line-height: 1.5

Lignes du tableau :
  * Padding: 8px 0
  * Border-bottom: 0.5px solid #F0F0F0 (très subtil)
```

### **Footer**

```
Ligne de séparation :
  * Line: 1px solid #E5E5EA
  * Opacity: 0.5
  * Margin-top: 40px
  * Margin-bottom: 12px

Texte :
  * Font: Helvetica
  * Size: 8px
  * Color: #8E8E93
  * Line-height: 1.4

Layout :
  * Gauche : "Document généré automatiquement - KadduCare"
  * Centre : "Page X sur Y"
  * Droite : "Infirmier(ère): [Nom]"
```

---

## 🎨 Palette de Couleurs KadduCare Pro

```javascript
const COLORS_PRO = {
  // Primaires
  primary: '#0A84FF',           // Bleu KadduCare
  primaryLight: '#E8F1FF',      // Bleu très clair (backgrounds)
  primaryDark: '#0051D5',       // Bleu foncé (accents)
  
  // Secondaires
  success: '#34C759',           // Vert santé
  successLight: '#E8F5E9',      // Vert très clair
  
  // Textes
  text: '#1B1B1D',              // Noir principal
  textSecondary: '#4A4A4A',     // Gris moyen
  textMuted: '#8E8E93',          // Gris clair
  textWhite: '#FFFFFF',          // Blanc
  
  // Backgrounds
  background: '#FFFFFF',         // Blanc pur
  backgroundTinted: '#F5F9FF',  // Bleu très léger
  backgroundAlt: '#FAFAFA',      // Gris très clair
  
  // Bordures
  border: '#E5E5EA',            // Bordure standard
  borderLight: '#F0F0F0',       // Bordure très légère
  borderSubtle: '#F5F5F5',      // Bordure subtile
  
  // Ombres
  shadowColor: '#000000',
  shadowOpacity: 0.08,          // Opacité très subtile
  shadowRadius: 4,               // Flou doux
};
```

---

## 📏 Système d'Espacement Pro

```javascript
const SPACING_PRO = {
  // Marges de page
  pageMargin: 40,                // Marges latérales
  pageMarginTop: 40,             // Marge supérieure
  pageMarginBottom: 50,           // Marge inférieure
  
  // Espacements entre sections
  sectionGap: 30,                // Espace entre sections SOAPIE
  blockPadding: 20,               // Padding interne des blocs
  elementGap: 16,                 // Espace entre éléments
  
  // Espacements de texte
  lineGap: 6,                    // Espace entre lignes de texte
  paragraphGap: 12,              // Espace entre paragraphes
  listItemGap: 8,                // Espace entre items de liste
};
```

---

## ✨ Détails Premium à Implémenter

### 1. **Ombres Subtiles**
- Appliquer des ombres très légères aux blocs d'information
- `shadowOffset: { x: 0, y: 2 }`
- `shadowRadius: 4`
- `shadowOpacity: 0.08`

### 2. **Bordures Arrondies**
- Tous les blocs avec `borderRadius: 8px`
- Badges avec `borderRadius: 12px`

### 3. **Dégradés Légers**
- Background du bloc patient : Dégradé de `#F5F9FF` vers `#FFFFFF`
- Header : Dégradé subtil de `#0A84FF` vers `#0051D5` (très léger)

### 4. **Typographie Affinée**
- Letter-spacing ajusté pour chaque niveau
- Line-height optimisé pour la lisibilité
- Font-weight différencié (Bold pour titres, Regular pour corps)

### 5. **Séparateurs Élégants**
- Lignes fines (0.5-1px) avec opacité réduite
- Couleur : `#E5E5EA` avec opacity 0.5-0.7

### 6. **Badges de Statut**
- Formes arrondies (borderRadius: 12px)
- Padding horizontal: 10px, vertical: 6px
- Couleurs sémantiques (vert pour finalisé, orange pour brouillon)

### 7. **Icônes Minimalistes**
- Style line, épaisseur 1.5-2px
- Couleur : `#0A84FF` pour les icônes principales
- Taille : 14-16px

---

## 🎯 Checklist d'Implémentation

- [ ] Header avec logo KadduCare et bannière bleue premium
- [ ] Bloc patient avec background teinté et ombre subtile
- [ ] Sections SOAPIE avec en-têtes colorés et séparateurs élégants
- [ ] Tableau objectif avec alignement et typographie optimisés
- [ ] Footer avec layout à 3 colonnes (gauche, centre, droite)
- [ ] Ombres subtiles sur tous les blocs
- [ ] Bordures arrondies (8px)
- [ ] Espacements généreux et aérés
- [ ] Typographie hiérarchisée avec letter-spacing ajusté
- [ ] Couleurs KadduCare cohérentes (#0A84FF, #34C759)
- [ ] Séparateurs fins avec opacité réduite
- [ ] Dégradés légers pour les backgrounds
- [ ] Badges de statut arrondis (si applicable)
- [ ] Validation de la lisibilité et du contraste

---

## 📝 Notes Techniques

### **Contraintes PDFKit**

- PDFKit ne supporte pas les dégradés natifs → Utiliser des rectangles avec couleurs différentes
- Les ombres doivent être simulées avec des rectangles semi-transparents
- Les border-radius sont supportés nativement
- Les fonts disponibles : Helvetica, Helvetica-Bold, Courier

### **Optimisations**

- Utiliser `bufferPages: true` pour gérer la pagination
- Implémenter `ensurePageSpace()` pour éviter les coupures
- Optimiser les images (logo) avec compression
- Utiliser des polices système pour la performance

---

## 🚀 Résultat Attendu

Un PDF médical **premium et professionnel** qui :

✅ Inspire confiance et crédibilité  
✅ Reflète l'identité de marque KadduCare  
✅ Offre une excellente lisibilité  
✅ Présente une hiérarchie visuelle claire  
✅ Utilise des espacements généreux et aérés  
✅ Intègre des détails visuels subtils et élégants  
✅ Respecte les standards médicaux de présentation  

---

## 💡 Exemple de Code Structure

```javascript
// Header Pro
function renderHeaderPro(doc, recordedAt, createdAt) {
  const bannerHeight = 60;
  const bannerY = 0;
  
  // Bannière avec dégradé simulé
  doc.rect(0, bannerY, doc.page.width, bannerHeight)
    .fillColor('#0A84FF')
    .fill();
  
  // Logo (32px)
  // Texte "KadduCare" (22px, Bold, blanc)
  // Titre (12px, blanc, opacity 0.95)
  // Date/Heure (10px, blanc, opacity 0.9, align right)
}

// Bloc Patient Pro
function renderPatientInfoPro(doc, patientData, contentWidth) {
  const blockHeight = 90;
  const borderRadius = 8;
  
  // Background avec ombre subtile
  // Border arrondi
  // Labels en uppercase, gris clair
  // Valeurs en bold/noir
}
```

---

**Ce prompt doit être utilisé pour transformer le PDF actuel en une version premium KadduCare Pro, en respectant tous les éléments de design et d'identité visuelle de la marque.**

