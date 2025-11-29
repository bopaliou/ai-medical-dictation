import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import KadduCareLogo from './KadduCareLogo';
import { Spacing, Typography, Shadows, BorderRadius } from '@/constants/design';

interface HomeHeaderProps {
  user: any;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
}

export default function HomeHeader({ user, onMenuPress, onProfilePress }: HomeHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const firstName = user?.full_name?.split(' ')[0] || 'Docteur';

  // Couleurs extraites du logo/thème
  const primaryColor = theme.colors.primary;
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.backgroundCard,
        paddingTop: insets.top + Spacing.sm,
        borderBottomColor: theme.colors.borderCard,
      }
    ]}>
      {/* Niveau 1 : Top Header */}
      <View style={styles.topHeader}>
        {/* Menu Hamburger */}
        <TouchableOpacity 
          onPress={onMenuPress}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu-outline" size={28} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Logo Centré */}
        <View style={styles.logoContainer}>
          <KadduCareLogo size={40} variant="icon" />
          <Text style={[styles.brandName, { color: theme.colors.text }]}>KadduCare</Text>
        </View>

        {/* Avatar Utilisateur */}
        <TouchableOpacity 
          onPress={onProfilePress}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarContainer, { borderColor: theme.colors.border }]}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.avatarInitials, { color: theme.colors.primary }]}>
                  {firstName.substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Niveau 2 : Sub Header (Message Bienvenue) */}
      <View style={styles.subHeader}>
        <Animated.View 
          entering={FadeIn.duration(600).delay(100)}
          style={styles.greetingContainer}
        >
          <Text style={[styles.greetingText, { color: theme.colors.text }]}>
            Bonjour, {firstName}
          </Text>
        </Animated.View>
        
        <Animated.View 
          entering={SlideInUp.duration(500).delay(300)}
        >
          <Text style={[styles.subTitleText, { color: theme.colors.textSecondary }]}>
            Voici vos dernières activités
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    // Ombre médicale spécifique demandée (0, 2, 8, 0.05)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    height: 44, // Hauteur standard pour alignement
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  subHeader: {
    gap: 4,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    ...Typography.h2,
    fontSize: 24, // 22-26px demandé
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  subTitleText: {
    ...Typography.body,
    fontSize: 15, // 14-16px demandé
    fontWeight: '400',
  },
});
