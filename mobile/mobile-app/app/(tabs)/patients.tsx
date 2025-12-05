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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { patientsApiService, Patient } from '@/services/patientsApi';
import { reportApiService, Report } from '@/services/reportApi';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeSlideUp, scalePress, scaleRelease, getCascadeDelay, ANIMATION_DURATION } from '@/utils/animations';
import { Spacing, BorderRadius, Shadows, Typography } from '@/constants/design';
import AppHeader from '@/components/AppHeader';
import * as Haptics from 'expo-haptics';

type SortType = 'alphabetical' | 'recent';

interface PatientStats {
  reportsCount: number;
  lastReportDate?: string;
  lastReportDetails?: {
    vitals?: {
      temperature?: string;
      blood_pressure?: string;
      heart_rate?: string;
      respiratory_rate?: string;
      spo2?: string;
      glycemia?: string;
    };
    medications?: string[];
    assessment?: string;
  };
}

export default function PatientsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>('alphabetical');
  const [patientStats, setPatientStats] = useState<Record<string, PatientStats>>({});

  const loadPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPatients = await patientsApiService.getAllPatients();
      setPatients(allPatients);
      setFilteredPatients(allPatients);

      // Charger les rapports pour calculer les statistiques et détails médicaux
      try {
        const reportsResponse = await reportApiService.getReports({ limit: 1000 });
        if (reportsResponse.ok && reportsResponse.reports) {
          const stats: Record<string, PatientStats> = {};

          // Calculer les statistiques par patient
          for (const patient of allPatients) {
            const patientReports = reportsResponse.reports.filter(
              report => report.patient_id === patient.id && report.status !== 'trash'
            );

            const lastReport = patientReports.length > 0
              ? patientReports.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
              : null;

            // Charger les détails du dernier rapport pour obtenir les infos médicales
            // On charge seulement le dernier rapport finalisé pour optimiser
            let lastReportDetails = undefined;
            if (lastReport && lastReport.status === 'final') {
              try {
                const report = await reportApiService.getReportDetails(lastReport.id);
                if (report) {
                  lastReportDetails = {
                    vitals: report.soapie?.O?.vitals,
                    medications: Array.isArray(report.soapie?.O?.medications)
                      ? report.soapie.O.medications
                      : undefined,
                    assessment: report.soapie?.A,
                  };
                }
              } catch (error) {
                // Ne pas bloquer si les détails ne se chargent pas
                console.error(`Erreur lors du chargement des détails du rapport ${lastReport.id}:`, error);
              }
            }

            stats[patient.id] = {
              reportsCount: patientReports.length,
              lastReportDate: lastReport?.created_at,
              lastReportDetails,
            };
          }

          setPatientStats(stats);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error);
        // Ne pas bloquer l'affichage si les rapports ne se chargent pas
      }
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
    // Navigation vers les détails du patient
    router.push({
      pathname: '/patient/[id]',
      params: { id: patient.id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />

      {/* Header KadduCare */}
      <AppHeader />

      {/* Header moderne et élégant avec recherche et filtres intégrés */}
      <View style={[styles.headerContainer, {
        backgroundColor: theme.colors.backgroundCard,
        borderBottomColor: theme.colors.border,
        paddingTop: Spacing.lg,
      }]}>
        {/* Titre et compteur */}
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="people" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Patients</Text>
              {!isLoading && (
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'}
                  {searchTerm && ` trouvé${filteredPatients.length > 1 ? 's' : ''}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Barre de recherche premium */}
        <View style={[styles.searchContainer, {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border
        }]}>
          <View style={[styles.searchIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="search" size={18} color={theme.colors.primary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Rechercher un patient..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchTerm('');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres de tri modernes */}
        <View style={styles.sortContainer}>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortType === 'alphabetical'
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
                  borderColor: sortType === 'alphabetical'
                    ? theme.colors.primary
                    : theme.colors.border
                }
              ]}
              onPress={() => {
                setSortType('alphabetical');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sortType === 'alphabetical' ? 'text' : 'text-outline'}
                size={16}
                color={sortType === 'alphabetical' ? '#FFFFFF' : theme.colors.textMuted}
              />
              <Text style={[
                styles.sortButtonText,
                { color: sortType === 'alphabetical' ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                Alphabétique
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortType === 'recent'
                    ? theme.colors.primary
                    : theme.colors.backgroundSecondary,
                  borderColor: sortType === 'recent'
                    ? theme.colors.primary
                    : theme.colors.border
                }
              ]}
              onPress={() => {
                setSortType('recent');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={sortType === 'recent' ? 'time' : 'time-outline'}
                size={16}
                color={sortType === 'recent' ? '#FFFFFF' : theme.colors.textMuted}
              />
              <Text style={[
                styles.sortButtonText,
                { color: sortType === 'recent' ? '#FFFFFF' : theme.colors.textSecondary }
              ]}>
                Récents
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Liste des patients */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundCard }]}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient'}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
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
              stats={patientStats[patient.id]}
            />
          ))}
        </ScrollView>
      )}
      <SafeAreaView style={styles.safeAreaBottom} edges={['bottom']} />
    </View>
  );
}

// Composant PatientCard avec animations et informations détaillées
interface PatientCardProps {
  patient: Patient;
  getInitials: (name: string) => string;
  getAvatarColor: (patient: Patient) => string;
  onPress: () => void;
  index: number;
  stats?: PatientStats;
}

function PatientCard({ patient, getInitials, getAvatarColor, onPress, index, stats }: PatientCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(12)).current;

  // Animation d'apparition premium : fade + slide-up avec délai en cascade
  React.useEffect(() => {
    const delay = getCascadeDelay(index, 30);
    fadeSlideUp(opacityAnim, translateYAnim, 12, ANIMATION_DURATION.CARD_APPEAR, delay).start();
  }, []);

  // Animations de press premium
  const handlePressIn = () => {
    scalePress(scaleAnim, 0.96).start();
  };

  const handlePressOut = () => {
    scaleRelease(scaleAnim, 1).start();
  };

  const initials = getInitials(patient.full_name || '');
  const avatarColor = getAvatarColor(patient);

  // Calculer l'âge à partir de la date de naissance si disponible
  const calculateAge = (dob?: string, ageString?: string): string | null => {
    if (ageString) return ageString;

    if (dob) {
      try {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        return age > 0 ? `${age} ans` : null;
      } catch {
        return null;
      }
    }

    return null;
  };

  // Formater les informations pour affichage
  const calculatedAge = calculateAge(patient.dob, patient.age);
  const hasAge = !!calculatedAge;
  const hasGender = !!patient.gender;
  const hasRoom = !!patient.room_number;
  const hasUnit = !!patient.unit;
  const hasCreatedAt = !!patient.created_at;
  const reportsCount = stats?.reportsCount || 0;
  const lastReportDate = stats?.lastReportDate;
  const medicalDetails = stats?.lastReportDetails;
  const vitals = medicalDetails?.vitals;
  const medications = medicalDetails?.medications;
  const assessment = medicalDetails?.assessment;

  // Vérifier si des signes vitaux sont disponibles
  const hasVitals = vitals && (
    vitals.blood_pressure ||
    vitals.temperature ||
    vitals.heart_rate ||
    vitals.spo2
  );
  const hasMedications = medications && medications.length > 0;
  const hasAssessment = !!assessment;

  // Formater la date relative
  const formatRelativeDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Compter le nombre d'informations disponibles
  const infoCount = [hasAge, hasGender, hasRoom, hasUnit].filter(Boolean).length;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.patientCard, {
          backgroundColor: theme.colors.backgroundCard,
          borderColor: theme.colors.borderCard
        }]}
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
          <Text style={[styles.patientName, { color: theme.colors.text }]} numberOfLines={1}>
            {patient.full_name || 'Patient inconnu'}
          </Text>

          {/* Ligne principale d'informations - toujours visible */}
          <View style={styles.mainInfoRow}>
            {hasAge && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={14} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{calculatedAge}</Text>
              </View>
            )}
            {hasGender && (
              <View style={styles.infoItem}>
                <Ionicons
                  name={patient.gender?.toLowerCase().includes('f') ? "female" : "male"}
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>{patient.gender}</Text>
              </View>
            )}
          </View>

          {/* Ligne secondaire - Chambre et Unité */}
          {(hasRoom || hasUnit) && (
            <View style={styles.secondaryInfoRow}>
              {hasRoom && (
                <View style={styles.infoItem}>
                  <Ionicons name="bed" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.secondaryInfoText, { color: theme.colors.textSecondary }]}>Ch. {patient.room_number}</Text>
                </View>
              )}
              {hasUnit && (
                <View style={styles.infoItem}>
                  <Ionicons name="business" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.secondaryInfoText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{patient.unit}</Text>
                </View>
              )}
            </View>
          )}

          {/* Détails médicaux importants */}
          {(hasVitals || hasMedications || hasAssessment) && (
            <View style={[styles.medicalDetailsContainer, { borderTopColor: theme.colors.border }]}>
              {/* Signes vitaux */}
              {hasVitals && (
                <View style={styles.vitalsRow}>
                  {vitals.blood_pressure && (
                    <View style={[styles.vitalBadge, {
                      backgroundColor: theme.colors.errorLight,
                      borderColor: theme.colors.error + '40'
                    }]}>
                      <Ionicons name="pulse" size={12} color={theme.colors.error} />
                      <Text style={[styles.vitalText, { color: theme.colors.error }]}>TA: {vitals.blood_pressure}</Text>
                    </View>
                  )}
                  {vitals.temperature && (
                    <View style={[styles.vitalBadge, {
                      backgroundColor: theme.colors.warningLight,
                      borderColor: theme.colors.warning + '40'
                    }]}>
                      <Ionicons name="thermometer" size={12} color={theme.colors.warning} />
                      <Text style={[styles.vitalText, { color: theme.colors.warning }]}>{vitals.temperature}°C</Text>
                    </View>
                  )}
                  {vitals.heart_rate && (
                    <View style={[styles.vitalBadge, {
                      backgroundColor: theme.colors.errorLight,
                      borderColor: theme.colors.error + '40'
                    }]}>
                      <Ionicons name="heart" size={12} color={theme.colors.error} />
                      <Text style={[styles.vitalText, { color: theme.colors.error }]}>{vitals.heart_rate} bpm</Text>
                    </View>
                  )}
                  {vitals.spo2 && (
                    <View style={[styles.vitalBadge, {
                      backgroundColor: theme.colors.primaryLight,
                      borderColor: theme.colors.primary + '40'
                    }]}>
                      <Ionicons name="water" size={12} color={theme.colors.primary} />
                      <Text style={[styles.vitalText, { color: theme.colors.primary }]}>SpO₂: {vitals.spo2}%</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Médications */}
              {hasMedications && (
                <View style={[styles.medicationsRow, {
                  backgroundColor: theme.colors.primaryLight,
                  borderColor: theme.colors.primary + '40',
                }]}>
                  <Ionicons name="medical" size={13} color={theme.colors.primary} />
                  <Text style={[styles.medicationsText, { color: theme.colors.primary }]} numberOfLines={1}>
                    {medications.length === 1
                      ? medications[0]
                      : `${medications.length} médicament${medications.length > 1 ? 's' : ''}`
                    }
                  </Text>
                </View>
              )}

              {/* Diagnostic/Évaluation */}
              {hasAssessment && (
                <View style={[styles.assessmentRow, {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                }]}>
                  <Ionicons name="clipboard" size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.assessmentText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                    {assessment.length > 80 ? `${assessment.substring(0, 80)}...` : assessment}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Statistiques des rapports */}
          {reportsCount > 0 && (
            <View style={[styles.statsRow, { borderTopColor: theme.colors.border }]}>
              <View style={styles.infoItem}>
                <Ionicons name="document-text" size={13} color={theme.colors.primary} />
                <Text style={[styles.statsText, { color: theme.colors.primary }]}>
                  {reportsCount} {reportsCount === 1 ? 'rapport' : 'rapports'}
                </Text>
              </View>
              {lastReportDate && (
                <View style={styles.infoItem}>
                  <Ionicons name="time" size={13} color={theme.colors.textSecondary} />
                  <Text style={[styles.statsSecondaryText, { color: theme.colors.textSecondary }]}>
                    Dernier: {formatRelativeDate(lastReportDate)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Date de création si disponible */}
          {hasCreatedAt && (
            <View style={[styles.metaInfoRow, { borderTopColor: theme.colors.border }]}>
              <Ionicons name="person-add-outline" size={11} color={theme.colors.textMuted} />
              <Text style={[styles.metaInfoText, { color: theme.colors.textMuted }]}>
                Ajouté {formatRelativeDate(patient.created_at)}
              </Text>
            </View>
          )}

          {/* Message si aucune info */}
          {infoCount === 0 && (
            <Text style={[styles.noInfoText, { color: theme.colors.textMuted }]}>Aucune information disponible</Text>
          )}
        </View>

        {/* Icône flèche */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaBottom: {
    backgroundColor: 'transparent',
  },
  // Header moderne et élégant
  headerContainer: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    // backgroundColor et borderBottomColor appliqués dynamiquement
  },
  headerTop: {
    marginBottom: Spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...Typography.h2, // 28px, 700 weight selon Design System
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs / 2,
    // color appliqué dynamiquement
  },
  subtitle: {
    ...Typography.label, // 14px, 600 weight selon Design System
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    // color appliqué dynamiquement
  },
  // Barre de recherche premium selon Design System
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md, // 12px
    paddingVertical: Spacing.md, // 12px
    borderRadius: BorderRadius.input, // 12px selon Design System
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm, // Ombre subtile selon Design System
    // backgroundColor et borderColor appliqués dynamiquement
  },
  searchIconContainer: {
    width: 36, // Légèrement plus grand
    height: 36,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    // backgroundColor appliqué dynamiquement
  },
  searchInput: {
    flex: 1,
    ...Typography.body, // 16px, 400 weight selon Design System
    fontSize: 16,
    fontWeight: '400',
    // color appliqué dynamiquement
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  // Filtres de tri modernes
  sortContainer: {
    marginTop: Spacing.xs,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs, // 4px
    paddingHorizontal: Spacing.md, // 12px
    paddingVertical: Spacing.md, // 12px
    borderRadius: BorderRadius.button, // 16px selon Design System
    borderWidth: 1,
    minHeight: 44, // Touch target minimum selon Design System
    // backgroundColor et borderColor appliqués dynamiquement
  },
  sortButtonText: {
    ...Typography.label, // 14px, 600 weight selon Design System
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    // color appliqué dynamiquement
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
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
    alignItems: 'flex-start',
    borderRadius: BorderRadius.card, // 20px selon Design System
    padding: Spacing.cardPadding, // 20px selon Design System
    borderWidth: 1,
    minHeight: 140, // Hauteur augmentée pour afficher les détails médicaux
    ...Shadows.lg, // Ombre plus visible selon Design System
    backgroundColor: '#FFFFFF', // Blanc pur selon Design System
    // borderColor appliqué dynamiquement
  },
  avatarContainer: {
    marginRight: 14,
    paddingTop: 2, // Alignement avec le nom
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // Pas d'ombre, design épuré
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: 4,
    paddingTop: 2,
  },
  patientName: {
    ...Typography.h4, // 20px, 600 weight selon Design System
    fontSize: 19,
    fontWeight: '700',
    marginBottom: Spacing.sm + 2, // 10px
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  // Ligne principale d'informations (âge, genre)
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    ...Typography.label, // 14px, 600 weight selon Design System
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Ligne secondaire (chambre, unité)
  secondaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  secondaryInfoText: {
    ...Typography.labelSmall, // 13px, 500 weight selon Design System
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  // Conteneur des détails médicaux
  medicalDetailsContainer: {
    marginTop: 10,
    marginBottom: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    gap: 8,
    // borderTopColor appliqué dynamiquement
  },
  // Signes vitaux
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  vitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    // backgroundColor, borderColor et color appliqués dynamiquement
  },
  vitalText: {
    fontSize: 11,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  // Médications
  medicationsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0E5FF',
  },
  medicationsText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  // Diagnostic/Évaluation
  assessmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  assessmentText: {
    fontSize: 11,
    fontWeight: '400',
    flex: 1,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Ligne statistiques (rapports)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    // borderTopColor appliqué dynamiquement
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsSecondaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Ligne meta (date de création)
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    // borderTopColor appliqué dynamiquement
  },
  metaInfoText: {
    fontSize: 11,
    fontWeight: '400',
  },
  noInfoText: {
    fontSize: 13,
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
