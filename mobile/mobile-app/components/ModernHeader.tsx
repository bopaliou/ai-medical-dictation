/**
 * ModernHeader - Header moderne pour écrans de détail selon Design System KadduCare
 * Inclut bouton retour, titre, sous-titre et actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/design';
import * as Haptics from 'expo-haptics';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    color?: string; // Couleur personnalisée pour l'icône et le background
  };
  style?: ViewStyle;
}

export default function ModernHeader({
  title,
  subtitle,
  icon,
  iconColor,
  showBackButton = true,
  onBackPress,
  rightAction,
  style,
}: ModernHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const iconBgColor = iconColor || theme.colors.primary;
  const iconTextColor = iconColor || theme.colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.backgroundCard,
          borderBottomColor: theme.colors.borderCard,
          paddingTop: insets.top + Spacing.md, // Safe area + 12px selon Design System
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Bouton retour */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.backButtonCircle,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Contenu central */}
        <View style={styles.centerContent}>
          {icon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconBgColor + '20', // 20% opacity
                },
              ]}
            >
              <Ionicons name={icon} size={20} color={iconTextColor} />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: theme.colors.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Action droite */}
        {rightAction && (
          <TouchableOpacity
            style={styles.rightAction}
            onPress={rightAction.onPress}
            disabled={rightAction.disabled || rightAction.loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.rightActionCircle,
                {
                  backgroundColor: rightAction.disabled
                    ? theme.colors.backgroundSecondary
                    : (rightAction.color || theme.colors.success),
                },
              ]}
            >
              {rightAction.loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name={rightAction.icon}
                  size={18}
                  color={rightAction.disabled ? theme.colors.textMuted : '#FFFFFF'}
                />
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.lg, // 16px selon Design System
    paddingHorizontal: Spacing.screenPadding, // 24px selon Design System
    borderBottomWidth: 1,
    ...Shadows.sm, // Ombre subtile selon Design System
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md, // 12px selon Design System
  },
  backButton: {
    width: 44, // Touch target minimum selon Design System
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.sm, // Ombre subtile selon Design System
  },
  centerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm, // 8px selon Design System
    paddingHorizontal: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0, // Permet le truncate
  },
  title: {
    ...Typography.h3, // 24px, 600 weight selon Design System
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 28,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption, // 12px, 400 weight selon Design System
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: Spacing.xs / 2, // 2px
  },
  rightAction: {
    width: 44, // Touch target minimum selon Design System
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm, // Ombre subtile selon Design System
  },
});
