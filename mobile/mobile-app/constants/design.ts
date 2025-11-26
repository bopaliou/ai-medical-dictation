/**
 * Système de design premium médical
 * Inspiré de : Apple Health, Headspace, Notion, Ada Health
 * Palette douce, professionnelle et moderne pour environnements hospitaliers
 */

export const Colors = {
  // Palette médicale premium
  primary: '#0A84FF',           // Bleu médical moderne
  primaryLight: '#E8F1FF',      // Bleu clair pour backgrounds
  primaryDark: '#0051D5',        // Bleu foncé pour contrastes
  
  success: '#34C759',            // Vert validation
  successLight: '#E8F5E9',       // Vert très clair
  
  error: '#FF3B30',              // Rouge propre pour erreurs/suppression
  errorLight: '#FFEBEE',         // Rouge très clair
  
  warning: '#FF9500',            // Orange pour avertissements
  warningLight: '#FFF3E0',       // Orange très clair
  
  // Gris et neutres
  background: '#F5F5F7',         // Gris propre (fond principal)
  backgroundCard: '#FFFFFF',     // Blanc pour cartes
  backgroundSecondary: '#FAFAFA', // Gris très clair
  
  // Textes
  text: '#1B1B1D',               // Noir profond (texte principal)
  textSecondary: '#4A4A4A',      // Sous-texte
  textMuted: '#8E8E93',          // Texte discret
  textLight: '#C7C7CC',          // Texte très discret
  
  // Bordures
  border: '#E5E5EA',             // Bordure standard
  borderLight: '#F0F0F0',         // Bordure très légère
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)', // Overlay pour modals
  
  // Statuts
  status: {
    draft: '#8E8E93',            // Gris pour brouillon
    final: '#34C759',            // Vert pour finalisé
    trash: '#FF3B30',            // Rouge pour corbeille
  }
};

export const Typography = {
  // Titres
  h1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  
  // Sous-titres
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  subtitleSmall: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  
  // Corps
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Labels
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  
  // Captions
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
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

