/**
 * AppHeader - Header réutilisable avec logo KadduCare
 * Utilisé en haut de chaque écran pour la cohérence de la marque
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import KadduCareLogo from './KadduCareLogo';
import { Spacing, Typography } from '@/constants/design';

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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  titleCompact: {
    fontSize: 28,
  },
});

