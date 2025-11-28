/**
 * Composant Logo KadduCare - Réutilisable et adaptatif
 * Supporte les thèmes clair/sombre et différentes tailles
 */

import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface KadduCareLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  style?: ViewStyle | ImageStyle;
  showText?: boolean;
}

export default function KadduCareLogo({ 
  size = 70, 
  variant = 'full',
  style,
  showText = false 
}: KadduCareLogoProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('@/assets/images/logo-kadducare.png')}
        style={[
          styles.logo,
          { width: size, height: size },
          variant === 'icon' && styles.iconVariant,
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // Le logo s'adapte automatiquement au thème via l'image
  },
  iconVariant: {
    // Pour une version icône uniquement si nécessaire
  },
});

