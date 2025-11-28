/**
 * KadduCare Design System - Brand Kit Officiel
 * Système de design premium médical moderne
 * Palette officielle KadduCare
 */

export const Colors = {
  // Palette KadduCare officielle
  // Bleu médical moderne - Couleur principale de la marque
  primary: '#0A84FF',           // Bleu KadduCare principal
  primaryLight: '#E8F1FF',      // Bleu clair pour backgrounds et accents légers
  primaryDark: '#0051D5',        // Bleu foncé premium pour contrastes et profondeur
  primaryGradient: ['#0A84FF', '#0051D5'], // Dégradé bleu KadduCare
  
  // Vert santé - Pour validations et statuts positifs
  success: '#34C759',            // Vert santé KadduCare
  successLight: '#E8F5E9',       // Vert très clair pour backgrounds
  successDark: '#28A745',        // Vert foncé pour contrastes
  
  // Rouge - Pour erreurs et actions destructives
  error: '#FF3B30',              // Rouge propre pour erreurs/suppression
  errorLight: '#FFEBEE',         // Rouge très clair pour backgrounds
  
  // Orange - Pour avertissements
  warning: '#FF9500',            // Orange pour avertissements
  warningLight: '#FFF3E0',       // Orange très clair
  
  // Neutres KadduCare
  background: '#F5F5F7',         // Gris propre (fond principal)
  backgroundCard: '#FFFFFF',     // Blanc pur pour cartes
  backgroundSecondary: '#FAFAFA', // Gris très clair pour séparations
  backgroundElevated: '#FFFFFF',  // Blanc pour éléments élevés
  
  // Textes
  text: '#1B1B1D',               // Noir profond (texte principal)
  textSecondary: '#4A4A4A',      // Sous-texte
  textMuted: '#8E8E93',          // Texte discret
  textLight: '#C7C7CC',          // Texte très discret
  
  // Bordures
  border: '#E5E5EA',             // Bordure standard
  borderLight: '#F0F0F0',         // Bordure très légère
  borderCard: '#E5E5EA',         // Bordure pour cartes
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)', // Overlay pour modals
  
  // Statuts KadduCare
  status: {
    draft: '#8E8E93',            // Gris pour brouillon
    final: '#34C759',            // Vert KadduCare pour finalisé
    trash: '#FF3B30',            // Rouge pour corbeille
  }
};

export const Typography = {
  // Typographie KadduCare - Hiérarchie moderne et professionnelle
  // Police recommandée : Inter ou système (San Francisco sur iOS, Roboto sur Android)
  
  // Titres principaux
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  
  // Sous-titres
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  subtitleSmall: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  
  // Corps de texte
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodyTiny: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Labels et boutons
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  
  // Captions et métadonnées
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  captionSmall: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  
  // Chiffres et statistiques
  number: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  numberLarge: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
};

export const Spacing = {
  // Espacement KadduCare - Système basé sur 4px
  // Principe : beaucoup d'espace blanc pour un design aéré et premium
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
  // Espacements spécifiques pour sections
  section: 32,
  sectionLarge: 48,
  cardPadding: 20,
  screenPadding: 24,
};

export const BorderRadius = {
  // Rayons de bordure KadduCare - Design arrondi élégant
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
  // Rayons spécifiques
  card: 20,
  button: 16,
  input: 12,
  badge: 12,
};

export const Shadows = {
  // Ombres KadduCare - Douces et subtiles pour un effet premium
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  // Ombres spécifiques
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const DesignSystem = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};

