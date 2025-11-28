/**
 * Composant Header moderne et élégant - Réutilisable
 * Design cohérent pour tous les écrans de l'application
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import AppHeader from './AppHeader';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  showBackButton?: boolean;
  rightButton?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    loading?: boolean;
    color?: string;
  };
  onBackPress?: () => void;
}

export default function ModernHeader({
  title,
  subtitle,
  icon = 'person',
  showBackButton = true,
  rightButton,
  onBackPress,
}: ModernHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      {/* Header KadduCare */}
      <AppHeader compact />

      <LinearGradient
        colors={theme.resolved === 'dark' 
          ? [theme.colors.backgroundElevated, theme.colors.backgroundCard]
          : [theme.colors.primaryLight, theme.colors.backgroundCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient]}
      >
        <View style={styles.header}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.backButtonHeader}
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.backButtonCircle, { backgroundColor: theme.colors.backgroundCard }]}>
                <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonHeader} />
          )}

          <View style={styles.headerTitleContainer}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name={icon} size={16} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

        {rightButton ? (
          <TouchableOpacity
            style={styles.rightButton}
            onPress={rightButton.onPress}
            disabled={rightButton.loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.rightButtonCircle,
                { backgroundColor: rightButton.color || theme.colors.success },
              ]}
            >
              {rightButton.loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={rightButton.icon} size={18} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButton} />
        )}
      </View>
    </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  // Header app avec logo KadduCare
  appHeader: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // backgroundColor et borderBottomColor appliqués dynamiquement
  },
  appHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogoContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    // color appliqué dynamiquement
  },
  headerGradient: {
    paddingBottom: 20,
    marginBottom: 8,
    minHeight: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 48,
  },
  backButtonHeader: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    gap: 10,
    overflow: 'hidden',
  },
  headerTextWrapper: {
    flex: 1,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    maxWidth: '100%',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    maxWidth: '100%',
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

