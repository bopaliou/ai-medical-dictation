/**
 * KadduCare Design System - Brand Kit Officiel
 * Système de design premium médical moderne
 * Palette officielle KadduCare
 */

export const Colors = {
  // Palette KadduCare officielle - Antigravity Redesign
  // Bleu Royal - Confiance et autorité
  primary: '#258bef',
  primaryLight: '#EFF6FF',
  primaryDark: '#1d4ed8',
  primaryGradient: ['#258bef', '#1d4ed8'],

  // Vitality Green - Vie et validation (Action principale)
  success: '#22c55e',
  successLight: '#F0FDF4',
  successDark: '#15803d',

  // Rouge - Erreurs
  error: '#EF4444',
  errorLight: '#FEF2F2',

  // Orange - Avertissements
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  // Neutres - Slate pour le "Weightless feel"
  background: '#F8FAFC',
  backgroundCard: '#FFFFFF',
  backgroundSecondary: '#F1F5F9',
  backgroundElevated: '#FFFFFF',

  // Textes - Slate Contrasté
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',

  // Bordures
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderCard: '#F1F5F9',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.4)',

  // Statuts
  status: {
    draft: '#94A3B8',
    final: '#22c55e',
    trash: '#EF4444',
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

