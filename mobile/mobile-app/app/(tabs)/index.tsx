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
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';
import * as Haptics from 'expo-haptics';
import NetworkErrorBanner from '@/components/NetworkErrorBanner';
import ReportCard from '@/components/ReportCard';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeIn, slideUp, ANIMATION_DURATION } from '@/utils/animations';

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
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const isLightMode = theme.resolved === 'light';
  
  // Gradient de couleur pour l'icône (plus subtil en dark mode)
  const iconBgOpacity = isLightMode ? 1 : 0.2;
  const iconBgColor = `${backgroundColor}${Math.round(iconBgOpacity * 255).toString(16).padStart(2, '0')}`;

  const content = (
    <Animated.View
      style={[
        styles.statCardContent,
        { 
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
          backgroundColor: theme.colors.backgroundCard,
          borderColor: theme.colors.borderCard,
        },
      ]}
    >
      {/* Icône avec fond coloré moderne */}
      <View style={[
        styles.statIconContainer, 
        { 
          backgroundColor: iconBgColor,
        },
      ]}>
        <Ionicons 
          name={icon} 
          size={isLightMode ? 30 : 28} 
          color={isLightMode ? iconColor : backgroundColor} 
        />
      </View>
      
      {/* Valeur avec typographie premium */}
      <Text style={[
        styles.statValue, 
        { 
          color: theme.colors.text,
        },
      ]}>
        {value}
      </Text>
      
      {/* Label avec espacement optimal */}
      <Text style={[
        styles.statLabel, 
        { 
          color: theme.colors.textSecondary,
        },
      ]}>
        {label}
      </Text>
      
      {/* Indicateur de couleur subtil en bas */}
      <View style={[
        styles.statIndicator,
        { backgroundColor: backgroundColor },
      ]} />
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

// Composant RecentReportItem supprimé - Utilisation de ReportCard à la place

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = SCREEN_WIDTH * 0.65; // 65% de la largeur de l'écran

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
  }, []);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final' | 'trash'>('all');
  const [statsScrollIndex, setStatsScrollIndex] = useState(0);
  const statsScrollViewRef = React.useRef<FlatList>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const firstName = user?.full_name?.split(' ')[0] || '';

  const loadRecentReports = async () => {
    try {
      setIsLoadingNotes(true);
      setNetworkError(null);
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
      
      // Afficher un message d'erreur clair si c'est une erreur réseau
      if (error.message && error.message.includes('Impossible de se connecter')) {
        setNetworkError(error.message);
      }
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setIsLoadingStats(true);
      setNetworkError(null);
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
      
      // Afficher un message d'erreur clair si c'est une erreur réseau
      if (error.message && error.message.includes('Impossible de se connecter')) {
        setNetworkError(error.message);
        // Ne pas afficher d'alerte ici car elle sera déjà affichée par loadRecentReports
      }
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
        pathname: '/report/details' as any,
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

  const handleRetryConnection = () => {
    loadRecentReports();
    loadStatistics();
  };

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
        
        {/* Bannière d'erreur réseau élégante */}
        <NetworkErrorBanner
          message={networkError || ''}
          visible={!!networkError}
          onDismiss={() => setNetworkError(null)}
          onRetry={handleRetryConnection}
        />
        
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          networkError && { paddingTop: 200 }, // Espace pour la bannière d'erreur
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header premium avec avatar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              {firstName ? `Bonjour, ${firstName}` : 'Bienvenue'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Voici vos dernières activités</Text>
          </View>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="person" size={28} color={theme.colors.primary} />
          </View>
        </View>

        {/* Section Statistiques - Carousel Premium */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Statistiques</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
                Vue d'ensemble de votre activité
              </Text>
            </View>
          </View>
          {isLoadingStats ? (
            <View style={styles.statsLoadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
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
              {/* Indicateurs de pagination modernes */}
              <View style={styles.paginationDots}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      { backgroundColor: theme.colors.border },
                      index === statsScrollIndex && [
                        styles.paginationDotActive,
                        { backgroundColor: theme.colors.primary },
                      ],
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
                  { 
                    backgroundColor: statusFilter === status ? theme.colors.primary : theme.colors.backgroundCard,
                    borderColor: statusFilter === status ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { 
                      color: statusFilter === status ? theme.colors.backgroundCard : theme.colors.textSecondary,
                    },
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
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
            </View>
          ) : filteredRecentReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundCard }]}>
                <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                {statusFilter === 'all'
                  ? 'Aucun rapport récent'
                  : `Aucun rapport ${statusFilter === 'final' ? 'finalisé' : statusFilter === 'draft' ? 'en brouillon' : 'dans la corbeille'}`}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Créez votre première dictée</Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {filteredRecentReports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onPress={() => handleReportPress(report)}
                  index={index}
                  showPatientName={true}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
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
    aspectRatio: 1.15, // Format plus élégant
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // backgroundColor appliqué dynamiquement
  },
  paginationDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    // backgroundColor appliqué dynamiquement
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
    borderWidth: 1,
  },
  filterChipActive: {
    // Styles dynamiques appliqués dans le composant
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '600',
  },
  statCardContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    // backgroundColor et borderColor appliqués dynamiquement
  },
  statCardContentLight: {
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statIconContainerLight: {
    // Pas d'ombre, design épuré
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -1,
    lineHeight: 48,
  },
  statIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  statsHeader: {
    marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: Spacing.xs / 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
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
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Medical Cards - Design moderne et informatif
  cardsList: {
    gap: Spacing.md,
  },
  // États
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    // color appliqué dynamiquement
    marginTop: Spacing.md,
  },
  emptyContainer: {
    padding: 64, // Spacing.xxxl * 2 (32 * 2)
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    // backgroundColor appliqué dynamiquement
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
});
