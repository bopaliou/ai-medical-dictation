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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';

// Couleurs spécifiques pour le profil
const PROFILE_COLORS = {
  background: '#F5F6FA',
  card: '#FFFFFF',
  logout: '#FF3B30',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Header simple */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.userProfileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Utilisateur'}</Text>
          <Text style={styles.userRole}>{getRoleLabel()}</Text>
        </View>

        {/* Settings Cards */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.settingsSection}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.settingItem,
                  itemIndex === 0 && styles.settingItemFirst,
                  itemIndex === section.items.length - 1 && styles.settingItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingItemLeft}>
                  <Ionicons name={item.icon} size={24} color={Colors.text} />
                  <Text style={styles.settingItemLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={PROFILE_COLORS.logout} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PROFILE_COLORS.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: PROFILE_COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
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
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    ...Shadows.md,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Settings Cards
  settingsSection: {
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    minHeight: 56, // Touch target confortable
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
  settingItemLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  // Bouton Déconnexion
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PROFILE_COLORS.card,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    minHeight: 56, // Touch target confortable
    ...Shadows.sm,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '600',
    color: PROFILE_COLORS.logout,
  },
});
