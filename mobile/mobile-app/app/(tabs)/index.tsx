/**
 * Écran d'accueil - Dashboard infirmière - Design moderne
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

function ActionCard({ icon, title, description, onPress, color = '#007AFF' }: ActionCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              await new Promise(resolve => setTimeout(resolve, 300));
              router.replace('/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const firstName = user?.full_name?.split(' ')[0] || 'infirmière';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              Bonjour, {firstName} 👩‍⚕️
            </Text>
            <Text style={styles.subtitle}>Que souhaitez-vous faire aujourd&apos;hui ?</Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
            disabled={isLoggingOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#FF3B30" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsContainer}>
          <ActionCard
            icon="mic"
            title="Enregistrer une note vocale"
            description="Dictez une observation, nous structurons automatiquement en SOAPIE."
            onPress={() => router.push('/record')}
            color="#007AFF"
          />

          <ActionCard
            icon="document-text"
            title="Notes récentes"
            description="Relisez les notes générées récemment."
            onPress={() => router.push('/notes' as any)}
            color="#34C759"
          />

          <ActionCard
            icon="people"
            title="Patients"
            description="Consultez les fiches patient."
            onPress={() => router.push('/patients' as any)}
            color="#FF9500"
          />

          <ActionCard
            icon="settings"
            title="Paramètres"
            description="Gérez vos préférences et paramètres de l'application."
            onPress={() => router.push('/settings')}
            color="#8E8E93"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    marginTop: Platform.OS === 'ios' ? 8 : 16,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E73',
    lineHeight: 22,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  actionsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
});
