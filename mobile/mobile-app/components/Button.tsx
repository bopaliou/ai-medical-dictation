/**
 * Composant Button réutilisable selon le Design System KadduCare
 * Supporte les variantes : primary, secondary, outline, text
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius, Shadows, Typography } from '@/constants/design';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md, // 12px
      paddingHorizontal: Spacing.lg, // 16px
      borderRadius: BorderRadius.button, // 16px
      minHeight: 48, // Touch target minimum selon Design System
      gap: Spacing.xs, // 4px
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.colors.textMuted : theme.colors.primary,
          ...Shadows.button,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? theme.colors.border : theme.colors.primary,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? theme.colors.border : theme.colors.border,
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingVertical: Spacing.sm, // 8px
          paddingHorizontal: Spacing.md, // 12px
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...Typography.label, // 14px, 600 weight selon Design System
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? theme.colors.textMuted : theme.colors.primary,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? theme.colors.textMuted : theme.colors.text,
        };
      case 'text':
        return {
          ...baseStyle,
          color: disabled ? theme.colors.textMuted : theme.colors.primary,
        };
      default:
        return baseStyle;
    }
  };

  const iconColor = variant === 'primary' ? '#FFFFFF' : getTextStyles().color;
  const iconSize = 18;

  return (
    <TouchableOpacity
      style={[getButtonStyles(), disabled && { opacity: 0.4 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          )}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

