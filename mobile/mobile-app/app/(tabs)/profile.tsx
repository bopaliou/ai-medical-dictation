/**
 * Écran Profil - User Hub premium médical
 * Design épuré et élégant pour professionnel de la santé
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';
import { fadeIn, slideUp, scaleIn, getCascadeDelay, ANIMATION_DURATION } from '@/utils/animations';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  // Animation de l'avatar : fade + scale
  const avatarScale = React.useRef(new Animated.Value(0.8)).current;
  const avatarOpacity = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // Animation de l'écran
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
    
    // Animation de l'avatar avec délai
    Animated.parallel([
      fadeIn(avatarOpacity, ANIMATION_DURATION.NORMAL, 100),
      scaleIn(avatarScale, 0.8, 1, ANIMATION_DURATION.NORMAL, 100),
    ]).start();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour obtenir le rôle formaté
  const getRoleLabel = (): string => {
    if (!user?.role) return 'Professionnel de la santé';
    switch (user.role) {
      case 'admin':
        return 'Administrateur';
      case 'nurse':
        return 'Infirmière';
      default:
        return user.role;
    }
  };

  // Sections de paramètres
  const settingsSections = [
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline' as const,
          label: 'Modifier le profil',
          onPress: () => router.push('/settings'),
        },
        {
          icon: 'mail-outline' as const,
          label: 'Email',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Sécurité',
      items: [
        {
          icon: 'lock-closed-outline' as const,
          label: 'Mot de passe',
          onPress: () => {},
        },
        {
          icon: 'shield-checkmark-outline' as const,
          label: 'Sécurité et confidentialité',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline' as const,
          label: 'Préférences de notification',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Aide & Support',
      items: [
        {
          icon: 'help-circle-outline' as const,
          label: 'Centre d\'aide',
          onPress: () => {},
        },
        {
          icon: 'chatbubble-outline' as const,
          label: 'Nous contacter',
          onPress: () => {},
        },
        {
          icon: 'information-circle-outline' as const,
          label: 'À propos',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <Animated.View 
      style={[
        { flex: 1 },
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }],
        },
      ]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
        
        {/* Header simple */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Mon profil</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <View style={[styles.userProfileCard, { 
            backgroundColor: theme.colors.backgroundCard,
            borderColor: theme.colors.borderCard,
          }]}>
            <Animated.View 
              style={[
                styles.avatarContainer, 
                { backgroundColor: theme.colors.primaryLight },
                {
                  opacity: avatarOpacity,
                  transform: [{ scale: avatarScale }],
                },
              ]}
            >
              <Ionicons name="person" size={36} color={theme.colors.primary} />
            </Animated.View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.full_name || 'Utilisateur'}</Text>
            <Text style={[styles.userRole, { color: theme.colors.textSecondary }]}>{getRoleLabel()}</Text>
          </View>

        {/* Settings Cards */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={[styles.settingsSection, { 
            backgroundColor: theme.colors.backgroundCard,
            borderColor: theme.colors.borderCard,
          }]}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  { borderBottomColor: theme.colors.border },
                  itemIndex === 0 && styles.settingItemFirst,
                  itemIndex === section.items.length - 1 && styles.settingItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.settingItemLabel, { color: theme.colors.text }]}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          style={[styles.logoutButton, { 
            backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#FFF5F5',
            borderColor: theme.colors.error,
          }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 140, // Espace pour le FAB
  },
  // User Profile Card
  userProfileCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  // Settings Cards
  settingsSection: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    minHeight: 56, // Touch target confortable
    // borderBottomColor appliqué dynamiquement
  },
  settingItemFirst: {
    // Pas de style spécial pour le premier
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItemLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  // Bouton Déconnexion
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    minHeight: 56, // Touch target confortable
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
