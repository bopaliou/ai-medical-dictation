/**
 * Écran Dashboard Home - Design premium médical moderne
 * Inspiré de : Apple Health, Ada Health, Notion, Calm
 * Tableau de bord épuré et professionnel pour professionnels de la santé
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PatientSelectionModal, { PatientSelectionResult } from '@/components/PatientSelectionModal';
import { notesApiService, Note } from '@/services/notesApi';
import { patientsApiService } from '@/services/patientsApi';
import { reportApiService, Report } from '@/services/reportApi';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';
import * as Haptics from 'expo-haptics';

// Palette médicale premium
const MEDICAL_COLORS = {
  primary: '#0A84FF',
  primaryLight: '#E8F1FF',
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#1B1B1D',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E93',
  success: '#34C759',
  error: '#FF3B30',
};

// Composant pour les cards de statistiques
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  iconColor: string;
  backgroundColor: string;
  onPress?: () => void;
}

function StatCard({ 
  icon, 
  label, 
  value, 
  iconColor,
  backgroundColor,
  onPress
}: StatCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.statCardContent,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor }]}>
        <Ionicons name={icon} size={32} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.statCard}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.statCard}>
      {content}
    </View>
  );
}

// Composant pour les cards de rapports récents
interface RecentReportItemProps {
  report: Report;
  onPress?: () => void;
}

function RecentReportItem({ report, onPress }: RecentReportItemProps) {
  const getRelativeDate = () => {
    const now = new Date();
    const reportDate = new Date(report.created_at || now);
    const diffMs = now.getTime() - reportDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return reportDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const patientName = report.patient?.full_name || 'Patient inconnu';
  const status = report.status || 'final';
  const statusConfig = {
    draft: { label: 'Brouillon', color: MEDICAL_COLORS.textMuted, bg: '#F5F5F7' },
    final: { label: 'Finalisé', color: MEDICAL_COLORS.success, bg: '#E8F5E9' },
    trash: { label: 'Corbeille', color: MEDICAL_COLORS.error, bg: '#FFEBEE' },
  };
  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.final;

  return (
    <TouchableOpacity
      style={styles.medicalCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name="document-text" size={24} color={MEDICAL_COLORS.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {patientName}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          Rapport SOAPIE
        </Text>
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: currentStatus.bg }]}>
            <Text style={[styles.statusText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
          <Text style={styles.cardDate}>{getRelativeDate()}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={MEDICAL_COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = SCREEN_WIDTH * 0.65; // 65% de la largeur de l'écran

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final' | 'trash'>('all');
  const [statsScrollIndex, setStatsScrollIndex] = useState(0);
  const statsScrollViewRef = React.useRef<FlatList>(null);

  const firstName = user?.full_name?.split(' ')[0] || '';

  const loadRecentReports = async () => {
    try {
      setIsLoadingNotes(true);
      // Charger tous les rapports récents (tous statuts) et les trier par date
      const reportsResponse = await reportApiService.getReports({ limit: 50 });
      if (reportsResponse.ok && reportsResponse.reports) {
        // Trier par date de création (plus récent en premier)
        const sortedReports = [...reportsResponse.reports].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        setRecentReports(sortedReports);
        // Mettre à jour aussi allReports pour les statistiques
        setAllReports(reportsResponse.reports);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports récents:', error);
      setRecentReports([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true);
      // Charger le nombre de patients
      const patients = await patientsApiService.getAllPatients();
      setTotalPatients(patients.length);

      // Les rapports sont déjà chargés dans loadRecentReports
      // Si allReports est vide, charger tous les rapports
      if (allReports.length === 0) {
        const reportsResponse = await reportApiService.getReports({ limit: 1000 });
        if (reportsResponse.ok && reportsResponse.reports) {
          setAllReports(reportsResponse.reports);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setTotalPatients(0);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Calculer les statistiques à partir de TOUS les rapports
  const calculateStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Utiliser allReports au lieu de recentNotes
    const totalReports = allReports.length;
    
    const reportsThisMonth = allReports.filter(report => {
      const reportDate = new Date(report.created_at || now);
      return reportDate >= startOfMonth;
    }).length;
    
    const finalizedReports = allReports.filter(report => 
      report.status === 'final'
    ).length;

    return {
      totalReports,
      reportsThisMonth,
      finalizedReports,
    };
  };

  // Filtrer les rapports récents par statut
  const filteredRecentReports = React.useMemo(() => {
    if (statusFilter === 'all') {
      return recentReports;
    }
    return recentReports.filter(report => report.status === statusFilter);
  }, [recentReports, statusFilter]);

  useEffect(() => {
    loadRecentReports();
    loadStatistics();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadRecentReports();
      loadStatistics();
    }, [])
  );

  const handleReportPress = (report: Report) => {
    if (!report.pdf_url) {
      Alert.alert(
        'Rapport non disponible',
        'Ce rapport n\'a pas encore été généré. Veuillez générer le PDF depuis l\'écran d\'édition.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (report.id) {
      router.push({
        pathname: '/report/details',
        params: { reportId: report.id },
      });
    }
  };

  const handlePatientSelected = (result: PatientSelectionResult) => {
    setShowPatientModal(false);
    
    const params: Record<string, string> = {
      patientId: result.patientId || '',
      skip: result.skip ? 'true' : 'false',
    };
    
    if (result.patientData) {
      params.patientData = JSON.stringify(result.patientData);
    }
    
    setTimeout(() => {
      router.push({
        pathname: '/record',
        params,
      } as any);
    }, 300);
  };

  const handleNewDictation = () => {
    setShowPatientModal(true);
  };

  const handleViewReports = () => {
    router.push('/(tabs)/rapports' as any);
  };

  const handleViewAllPatients = () => {
    router.push('/(tabs)/patients' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header premium avec avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {firstName ? `Bonjour, ${firstName}` : 'Bienvenue'}
            </Text>
            <Text style={styles.subtitle}>Voici vos dernières activités</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={28} color={MEDICAL_COLORS.primary} />
          </View>
        </View>

        {/* Section Statistiques - Carousel */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          {isLoadingStats ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color={MEDICAL_COLORS.primary} />
            </View>
          ) : (
            <>
              <FlatList
                ref={statsScrollViewRef}
                data={(() => {
                  const stats = calculateStats();
                  return [
                    {
                      icon: 'document-text' as const,
                      label: 'Rapports totaux',
                      value: stats.totalReports,
                      iconColor: '#FFFFFF',
                      backgroundColor: '#0A84FF',
                      onPress: handleViewReports,
                    },
                    {
                      icon: 'calendar' as const,
                      label: 'Ce mois-ci',
                      value: stats.reportsThisMonth,
                      iconColor: '#FFFFFF',
                      backgroundColor: '#34C759',
                    },
                    {
                      icon: 'checkmark-circle' as const,
                      label: 'Finalisés',
                      value: stats.finalizedReports,
                      iconColor: '#FFFFFF',
                      backgroundColor: '#FF9500',
                    },
                    {
                      icon: 'people' as const,
                      label: 'Patients',
                      value: totalPatients,
                      iconColor: '#FFFFFF',
                      backgroundColor: '#AF52DE',
                      onPress: handleViewAllPatients,
                    },
                  ];
                })()}
                renderItem={({ item }) => (
                  <View style={styles.statCardWrapper}>
                    <StatCard
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      iconColor={item.iconColor}
                      backgroundColor={item.backgroundColor}
                      onPress={item.onPress}
                    />
                  </View>
                )}
                keyExtractor={(item, index) => `stat-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={STAT_CARD_WIDTH + Spacing.md}
                decelerationRate="fast"
                contentContainerStyle={styles.statsCarouselContent}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(
                    event.nativeEvent.contentOffset.x / (STAT_CARD_WIDTH + Spacing.md)
                  );
                  setStatsScrollIndex(index);
                }}
              />
              {/* Indicateurs de pagination */}
              <View style={styles.paginationDots}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === statsScrollIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Section Rapports récents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rapports récents</Text>
            {filteredRecentReports.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/rapports' as any)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres par statut */}
          <View style={styles.filterContainer}>
            {(['all', 'final', 'draft', 'trash'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  statusFilter === status && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === status && styles.filterChipTextActive,
                  ]}
                >
                  {status === 'all'
                    ? 'Tous'
                    : status === 'final'
                    ? 'Finalisés'
                    : status === 'draft'
                    ? 'Brouillons'
                    : 'Corbeille'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoadingNotes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={MEDICAL_COLORS.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : filteredRecentReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={64} color={MEDICAL_COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {statusFilter === 'all'
                  ? 'Aucun rapport récent'
                  : `Aucun rapport ${statusFilter === 'final' ? 'finalisé' : statusFilter === 'draft' ? 'en brouillon' : 'dans la corbeille'}`}
              </Text>
              <Text style={styles.emptySubtext}>Créez votre première dictée</Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {filteredRecentReports.map((report) => (
                <RecentReportItem
                  key={report.id}
                  report={report}
                  onPress={() => handleReportPress(report)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <PatientSelectionModal
        visible={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSelect={handlePatientSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MEDICAL_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 140, // Espace pour le FAB
  },
  // Header premium
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: MEDICAL_COLORS.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: MEDICAL_COLORS.textMuted,
    marginTop: Spacing.xs,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: MEDICAL_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  // Statistiques - Carousel
  statsSection: {
    marginBottom: Spacing.xxl,
  },
  statsCarouselContent: {
    paddingRight: Spacing.xl,
  },
  statsLoadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardWrapper: {
    width: STAT_CARD_WIDTH,
    marginRight: Spacing.md,
  },
  statCard: {
    width: '100%',
    aspectRatio: 1.1, // Légèrement plus larges que hautes
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MEDICAL_COLORS.textMuted,
    opacity: 0.3,
  },
  paginationDotActive: {
    backgroundColor: MEDICAL_COLORS.primary,
    opacity: 1,
    width: 24,
  },
  // Filtres
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: MEDICAL_COLORS.card,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: MEDICAL_COLORS.primary,
    borderColor: MEDICAL_COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: MEDICAL_COLORS.card,
    fontWeight: '600',
  },
  statCardContent: {
    backgroundColor: MEDICAL_COLORS.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: MEDICAL_COLORS.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
    textAlign: 'center',
  },
  // Sections
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: MEDICAL_COLORS.text,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: MEDICAL_COLORS.primary,
  },
  // Medical Cards
  cardsList: {
    gap: Spacing.md,
  },
  medicalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEDICAL_COLORS.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    minHeight: 48, // Touch target
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: MEDICAL_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: MEDICAL_COLORS.text,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: MEDICAL_COLORS.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '400',
    color: MEDICAL_COLORS.textMuted,
  },
  // États
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: MEDICAL_COLORS.textMuted,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    padding: Spacing.xxxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: MEDICAL_COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MEDICAL_COLORS.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: MEDICAL_COLORS.textMuted,
    marginTop: Spacing.xs,
  },
});
