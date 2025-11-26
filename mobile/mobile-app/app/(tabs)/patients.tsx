/**
 * Écran Patients - Design premium médical moderne
 * Interface élégante type "medical directory" inspirée d'Apple / Notion / Crisp
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { patientsApiService, Patient } from '@/services/patientsApi';

// Couleurs médicales premium
const MEDICAL_COLORS = {
  primary: '#0A84FF',
  background: '#F2F4F7',
  card: '#FFFFFF',
  text: '#1B1B1D',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E93',
  border: '#E5E5EA',
  icon: 'rgba(27, 27, 29, 0.8)', // 80% black opacity
};

type SortType = 'alphabetical' | 'recent';

export default function PatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('alphabetical');

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPatients = await patientsApiService.getAllPatients();
      setPatients(allPatients);
      setFilteredPatients(allPatients);
    } catch (error: any) {
      console.error('Erreur lors du chargement des patients:', error);
      if (error.message === 'SESSION_EXPIRED' || error.message?.includes('expiré')) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de charger les patients');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  // Filtrer et trier les patients
  useEffect(() => {
    let filtered = patients;

    // Filtrer par recherche (nom, âge, sexe, chambre, unité)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => {
        const name = patient.full_name?.toLowerCase() || '';
        const age = patient.age?.toLowerCase() || '';
        const gender = patient.gender?.toLowerCase() || '';
        const unit = patient.unit?.toLowerCase() || '';
        const room = patient.room_number?.toLowerCase() || '';
        return (
          name.includes(searchLower) ||
          age.includes(searchLower) ||
          gender.includes(searchLower) ||
          unit.includes(searchLower) ||
          room.includes(searchLower)
        );
      });
    }

    // Trier
    if (sortType === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => {
        const nameA = (a.full_name || '').toLowerCase();
        const nameB = (b.full_name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
      });
    } else if (sortType === 'recent') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Plus récent en premier
      });
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, sortType]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPatients();
  }, [loadPatients]);

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fonction pour obtenir la couleur de l'avatar basée sur le patient
  const getAvatarColor = (patient: Patient): string => {
    // Utiliser une couleur basée sur le hash de l'ID pour différencier visuellement
    const colors = [
      '#0A84FF', // Bleu primaire
      '#34C759', // Vert
      '#FF9500', // Orange
      '#FF3B30', // Rouge
      '#AF52DE', // Violet
      '#FF2D55', // Rose
      '#5AC8FA', // Bleu clair
      '#FFCC00', // Jaune
    ];
    const hash = patient.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handlePatientPress = (patient: Patient) => {
    // Navigation vers les détails du patient (à implémenter si nécessaire)
    // Pour l'instant, on peut juste afficher les infos
    console.log('Patient sélectionné:', patient);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      
      {/* Gradient de fond optionnel */}
      <LinearGradient
        colors={['#FFFFFF', '#F2F4F7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Header moderne */}
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        {!isLoading && (
          <Text style={styles.subtitle}>
            {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
            {searchTerm && ` trouvé${filteredPatients.length > 1 ? 's' : ''}`}
          </Text>
        )}
      </View>

      {/* Barre de recherche épurée */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={MEDICAL_COLORS.icon} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, âge, chambre, service..."
          placeholderTextColor={MEDICAL_COLORS.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity 
            onPress={() => setSearchTerm('')} 
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color={MEDICAL_COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tri */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Trier par :</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortType === 'alphabetical' && styles.sortButtonActive]}
            onPress={() => setSortType('alphabetical')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="text-outline" 
              size={16} 
              color={sortType === 'alphabetical' ? MEDICAL_COLORS.card : MEDICAL_COLORS.textMuted} 
            />
            <Text style={[styles.sortButtonText, sortType === 'alphabetical' && styles.sortButtonTextActive]}>
              Alphabétique
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortType === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortType('recent')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={sortType === 'recent' ? MEDICAL_COLORS.card : MEDICAL_COLORS.textMuted} 
            />
            <Text style={[styles.sortButtonText, sortType === 'recent' && styles.sortButtonTextActive]}>
              Récents
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des patients */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MEDICAL_COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={64} color={MEDICAL_COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient'}
          </Text>
          <Text style={styles.emptyText}>
            {searchTerm
              ? 'Essayez avec d\'autres mots-clés'
              : 'Les patients que vous créez apparaîtront ici'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={MEDICAL_COLORS.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredPatients.map((patient, index) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              getInitials={getInitials}
              getAvatarColor={getAvatarColor}
              onPress={() => handlePatientPress(patient)}
              index={index}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Composant PatientCard avec animations et informations détaillées
interface PatientCardProps {
  patient: Patient;
  getInitials: (name: string) => string;
  getAvatarColor: (patient: Patient) => string;
  onPress: () => void;
  index: number;
}

function PatientCard({ patient, getInitials, getAvatarColor, onPress, index }: PatientCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const initials = getInitials(patient.full_name || '');
  const avatarColor = getAvatarColor(patient);

  // Formater les informations pour affichage rapide
  const hasAge = !!patient.age;
  const hasGender = !!patient.gender;
  const hasRoom = !!patient.room_number;
  const hasUnit = !!patient.unit;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.patientCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Avatar circulaire avec initiales et couleur unique */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Contenu principal avec informations détaillées */}
        <View style={styles.cardContent}>
          {/* Nom du patient */}
          <Text style={styles.patientName} numberOfLines={1}>
            {patient.full_name || 'Patient inconnu'}
          </Text>

          {/* Informations rapides en badges */}
          <View style={styles.infoBadges}>
            {hasAge && (
              <View style={styles.badge}>
                <Ionicons name="calendar-outline" size={12} color={MEDICAL_COLORS.textSecondary} />
                <Text style={styles.badgeText}>{patient.age} ans</Text>
              </View>
            )}
            {hasGender && (
              <View style={styles.badge}>
                <Ionicons 
                  name={patient.gender?.toLowerCase().includes('f') ? "female-outline" : "male-outline"} 
                  size={12} 
                  color={MEDICAL_COLORS.textSecondary} 
                />
                <Text style={styles.badgeText}>{patient.gender}</Text>
              </View>
            )}
            {hasRoom && (
              <View style={styles.badge}>
                <Ionicons name="bed-outline" size={12} color={MEDICAL_COLORS.textSecondary} />
                <Text style={styles.badgeText}>Ch. {patient.room_number}</Text>
              </View>
            )}
            {hasUnit && (
              <View style={styles.badge}>
                <Ionicons name="business-outline" size={12} color={MEDICAL_COLORS.textSecondary} />
                <Text style={styles.badgeText} numberOfLines={1}>{patient.unit}</Text>
              </View>
            )}
          </View>

          {/* Ligne d'informations secondaires si disponibles */}
          {(hasAge || hasGender || hasRoom || hasUnit) ? null : (
            <Text style={styles.patientSubLabel}>Informations non renseignées</Text>
          )}
        </View>

        {/* Icône flèche */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={MEDICAL_COLORS.icon} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: MEDICAL_COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: MEDICAL_COLORS.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEDICAL_COLORS.card,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: MEDICAL_COLORS.text,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: MEDICAL_COLORS.card,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: MEDICAL_COLORS.primary,
    borderColor: MEDICAL_COLORS.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
  },
  sortButtonTextActive: {
    color: MEDICAL_COLORS.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: MEDICAL_COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: MEDICAL_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: MEDICAL_COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 140, // Espace pour le FAB
  },
  cardWrapper: {
    marginBottom: 16,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEDICAL_COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
    minHeight: 80, // Hauteur augmentée pour afficher plus d'infos
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: MEDICAL_COLORS.card,
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: MEDICAL_COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  infoBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEDICAL_COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    maxWidth: 120,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
  },
  patientSubLabel: {
    fontSize: 13,
    color: MEDICAL_COLORS.textMuted,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 4,
  },
  arrowContainer: {
    marginLeft: 8,
    padding: 8,
    justifyContent: 'center',
  },
});
