/**
 * AppHeader - Header réutilisable avec logo KadduCare
 * Utilisé en haut de chaque écran pour la cohérence de la marque
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import KadduCareLogo from './KadduCareLogo';
import { Spacing, Typography, Shadows } from '@/constants/design';

interface AppHeaderProps {
  showLogo?: boolean;
  showTitle?: boolean;
  title?: string;
  style?: ViewStyle;
  compact?: boolean;
}

export default function AppHeader({ 
  showLogo = true, 
  showTitle = true,
  title = 'KadduCare',
  style,
  compact = false
}: AppHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundCard,
          borderBottomColor: theme.colors.borderCard,
          paddingTop: compact ? Spacing.md : insets.top + Spacing.md,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {showLogo && (
          <KadduCareLogo size={compact ? 56 : 70} />
        )}
        {showTitle && (
          <Text 
            style={[
              styles.title,
              { color: theme.colors.text },
              compact && styles.titleCompact,
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg, // 16px selon Design System
    paddingHorizontal: Spacing.screenPadding, // 24px selon Design System
    borderBottomWidth: 1,
    ...Shadows.sm, // Ombre subtile selon Design System
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md, // 12px selon Design System
  },
  title: {
    ...Typography.h1, // 32px, 700 weight selon Design System
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8, // Selon Design System
    lineHeight: 40, // Selon Design System
  },
  titleCompact: {
    ...Typography.h2, // 28px, 700 weight selon Design System
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
});

