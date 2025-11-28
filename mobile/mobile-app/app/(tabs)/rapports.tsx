/**
 * Écran Rapports - Design premium médical moderne
 * Interface élégante inspirée de Ada Health, Apple Health, Notion
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
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { reportApiService, Report } from '@/services/reportApi';
import ReportCard from '@/components/ReportCard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeIn, slideUp, ANIMATION_DURATION } from '@/utils/animations';

type FilterType = 'all' | 'final' | 'draft' | 'trash';

// Composant FilterChip avec animations et couleurs par statut
function FilterChip({ label, filterKey, isActive, onPress, index }: { label: string; filterKey: FilterType; isActive: boolean; onPress: () => void; index: number }) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Couleurs selon le statut - appliquées en arrière-plan
  const getFilterColors = (key: FilterType) => {
    switch (key) {
      case 'final':
        return {
          activeBg: theme.colors.success,
          activeBorder: theme.colors.success,
          activeText: '#FFFFFF',
          inactiveBg: theme.colors.successLight,
          inactiveBorder: theme.colors.success + '60',
          inactiveText: theme.colors.success,
        };
      case 'draft':
        return {
          activeBg: theme.colors.warning,
          activeBorder: theme.colors.warning,
          activeText: '#FFFFFF',
          inactiveBg: theme.colors.warningLight,
          inactiveBorder: theme.colors.warning + '60',
          inactiveText: theme.colors.warning,
        };
      case 'trash':
        return {
          activeBg: theme.colors.error,
          activeBorder: theme.colors.error,
          activeText: '#FFFFFF',
          inactiveBg: theme.colors.errorLight,
          inactiveBorder: theme.colors.error + '60',
          inactiveText: theme.colors.error,
        };
      default: // 'all'
        return {
          activeBg: theme.colors.primary,
          activeBorder: theme.colors.primary,
          activeText: '#FFFFFF',
          inactiveBg: theme.colors.primaryLight,
          inactiveBorder: theme.colors.primary + '60',
          inactiveText: theme.colors.primary,
        };
    }
  };

  const colors = getFilterColors(filterKey);

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.filterChip,
            isActive
              ? {
                  backgroundColor: colors.activeBg,
                  borderColor: colors.activeBorder,
                }
              : {
                  backgroundColor: colors.inactiveBg,
                  borderColor: colors.inactiveBorder,
                },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {isActive && (
            <View style={[styles.filterChipActiveIndicator, { backgroundColor: colors.activeText }]} />
          )}
          <Text
            style={[
              styles.filterText,
              isActive
                ? { color: colors.activeText }
                : { color: colors.inactiveText },
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RapportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
  }, []);

  const loadReports = useCallback(async (status?: string) => {
    try {
      setIsLoading(true);
      const response = await reportApiService.getReports({
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      setReports(response.reports || []);
      setFilteredReports(response.reports || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les rapports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  useEffect(() => {
    let filtered = reports;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(report => report.status === activeFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(report => {
        const patientName = report.patient?.full_name?.toLowerCase() || '';
        const dateStr = new Date(report.created_at).toLocaleDateString('fr-FR').toLowerCase();
        return patientName.includes(searchLower) || dateStr.includes(searchLower);
      });
    }

    setFilteredReports(filtered);
  }, [reports, activeFilter, searchTerm]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReports(activeFilter === 'all' ? undefined : activeFilter);
  }, [loadReports, activeFilter]);


  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'final':
        return { 
          color: theme.colors.success, 
          bgColor: theme.colors.successLight,
          label: 'Finalisé', 
          icon: 'checkmark-circle' as const 
        };
      case 'draft':
        return { 
          color: theme.colors.warning, 
          bgColor: theme.colors.warningLight,
          label: 'Brouillon', 
          icon: 'document-text' as const 
        };
      case 'trash':
        return { 
          color: theme.colors.error, 
          bgColor: theme.colors.errorLight,
          label: 'Corbeille', 
          icon: 'trash' as const 
        };
      default:
        return { 
          color: theme.colors.textMuted, 
          bgColor: theme.colors.backgroundSecondary,
          label: status, 
          icon: 'ellipse' as const 
        };
    }
  };


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
    } else {
      Alert.alert('Erreur', 'ID du rapport manquant');
    }
  };

  const handleSharePDF = async (pdfUrl: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'Le partage n\'est pas disponible sur cet appareil');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `report-${Date.now()}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager le rapport PDF',
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du partage:', error);
      Alert.alert('Erreur', 'Impossible de partager le PDF');
    }
  };

  const showActionMenu = (report: Report) => {
    const options = [];

    if (report.status === 'trash') {
      options.push({ text: 'Restaurer', onPress: () => handleRestoreReport(report.id) });
      options.push(
        { text: 'Supprimer définitivement', style: 'destructive' as const, onPress: () => handleDeletePermanently(report.id) },
        { text: 'Annuler', style: 'cancel' as const }
      );
    } else {
      options.push({ text: 'Mettre en brouillon', onPress: () => handleUpdateStatus(report.id, 'draft') });
      options.push({ text: 'Mettre à la corbeille', style: 'destructive' as const, onPress: () => handleMoveToTrash(report.id) });
      options.push({ text: 'Annuler', style: 'cancel' as const });
    }

    Alert.alert('Actions', `Rapport de ${report.patient?.full_name || 'Patient inconnu'}`, options);
  };

  const handleUpdateStatus = async (reportId: string, status: 'draft' | 'final' | 'trash') => {
    try {
      await reportApiService.updateReportStatus(reportId, status);
      await loadReports(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rapport');
    }
  };

  const handleRestoreReport = async (reportId: string) => {
    try {
      await reportApiService.updateReportStatus(reportId, 'final');
      await loadReports(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de restaurer le rapport');
    }
  };

  const handleMoveToTrash = async (reportId: string) => {
    try {
      await reportApiService.updateReportStatus(reportId, 'trash');
      await loadReports(activeFilter === 'all' ? undefined : activeFilter);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre le rapport à la corbeille');
    }
  };

  const handleDeletePermanently = (reportId: string) => {
    Alert.alert(
      'Supprimer définitivement',
      'Cette action est irréversible. Le rapport sera supprimé de manière permanente.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportApiService.deleteReport(reportId);
              await loadReports(activeFilter === 'all' ? undefined : activeFilter);
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le rapport');
            }
          },
        },
      ]
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'final', label: 'Finalisés' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'trash', label: 'Corbeille' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />

      {/* Header moderne avec gradient - Edge-to-edge */}
      <LinearGradient
        colors={theme.resolved === 'dark' 
          ? [theme.colors.backgroundElevated, theme.colors.backgroundCard]
          : ['#FFFFFF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { borderBottomColor: theme.colors.border }]}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
        <View>
              <Text style={[styles.title, { color: theme.colors.text }]}>Rapports</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Historique des notes et dictées</Text>
            </View>
            <View style={styles.headerStats}>
              <Text style={[styles.statsText, { color: theme.colors.textSecondary }]}>{filteredReports.length} rapport{filteredReports.length > 1 ? 's' : ''}</Text>
            </View>
        </View>
      </View>

        {/* Barre de recherche premium avec glassmorphism */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchContainer, { 
            backgroundColor: theme.colors.backgroundCard,
            borderColor: theme.colors.borderCard,
          }]}>
            <View style={[styles.searchIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="search" size={20} color={theme.colors.primary} />
            </View>
        <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher par patient ou date..."
              placeholderTextColor={theme.colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
              returnKeyType="search"
              clearButtonMode="never"
        />
        {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchTerm('');
                }}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.clearButtonInner, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </View>
          </TouchableOpacity>
        )}
          </View>
      </View>

        {/* Chips de filtres premium avec animations */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
          {filters.map((filter, index) => {
            const isActive = activeFilter === filter.key;
            return (
              <FilterChip
            key={filter.key}
                label={filter.label}
                filterKey={filter.key}
                isActive={isActive}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(filter.key);
                }}
                index={index}
              />
            );
          })}
      </ScrollView>
      </LinearGradient>

      {/* Liste des rapports */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundCard }]}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {searchTerm
              ? 'Aucun résultat'
              : activeFilter === 'all'
              ? 'Aucun rapport'
              : `Aucun rapport ${filters.find(f => f.key === activeFilter)?.label.toLowerCase()}`}
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {searchTerm
              ? 'Essayez avec d\'autres mots-clés'
              : 'Vos rapports générés apparaîtront ici'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
        >
          {filteredReports.map((report, index) => (
              <ReportCard
                key={report.id}
                report={report}
              onPress={() => handleReportPress(report)}
              onShare={report.pdf_url ? () => handleSharePDF(report.pdf_url!) : undefined}
                onMenu={() => showActionMenu(report)}
                index={index}
              showPatientName={true}
              />
          ))}
        </ScrollView>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      android: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  headerStats: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    // backgroundColor appliqué dynamiquement
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    fontWeight: '400',
    letterSpacing: -0.2,
    // color appliqué dynamiquement
  },
  clearButton: {
    marginLeft: 8,
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
  },
  filtersContainer: {
    maxHeight: 56,
    paddingBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1.5,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 44,
  },
  filterChipActiveIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: 14,
  },
  reportCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  cardPatientName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '400',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
