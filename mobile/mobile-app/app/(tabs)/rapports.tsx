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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { reportApiService, Report } from '@/services/reportApi';

type FilterType = 'all' | 'final' | 'draft' | 'trash';

// Couleurs médicales premium
const MEDICAL_COLORS = {
  primary: '#0A84FF',
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#1B1B1D',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E93',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
};

export default function RapportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'final':
        return { 
          color: MEDICAL_COLORS.success, 
          bgColor: '#E8F5E9',
          label: 'Finalisé', 
          icon: 'checkmark-circle' as const 
        };
      case 'draft':
        return { 
          color: MEDICAL_COLORS.warning, 
          bgColor: '#FFF3E0',
          label: 'Brouillon', 
          icon: 'document-text' as const 
        };
      case 'trash':
        return { 
          color: MEDICAL_COLORS.error, 
          bgColor: '#FFEBEE',
          label: 'Corbeille', 
          icon: 'trash' as const 
        };
      default:
        return { 
          color: MEDICAL_COLORS.textMuted, 
          bgColor: '#F5F5F7',
          label: status, 
          icon: 'ellipse' as const 
        };
    }
  };

  const getReportSummary = (report: Report): string => {
    if (report.soapie?.S) {
      const s = String(report.soapie.S);
      return s.length > 80 ? s.substring(0, 80) + '...' : s;
    }
    if (report.soapie?.A) {
      const a = String(report.soapie.A);
      return a.length > 80 ? a.substring(0, 80) + '...' : a;
    }
    return 'Note médicale SOAPIE';
  };

  const handleOpenPDF = (reportId?: string) => {
    if (reportId) {
      router.push({
        pathname: '/report/details',
        params: { reportId },
      });
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />

      {/* Header moderne avec titre et sous-titre */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Rapports</Text>
          <Text style={styles.subtitle}>Historique des notes et dictées</Text>
        </View>
      </View>

      {/* Barre de recherche élégante */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={MEDICAL_COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par patient ou date..."
          placeholderTextColor={MEDICAL_COLORS.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color={MEDICAL_COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Chips de filtres élégants */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des rapports */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MEDICAL_COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={64} color={MEDICAL_COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchTerm
              ? 'Aucun résultat'
              : activeFilter === 'all'
              ? 'Aucun rapport'
              : `Aucun rapport ${filters.find(f => f.key === activeFilter)?.label.toLowerCase()}`}
          </Text>
          <Text style={styles.emptyText}>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={MEDICAL_COLORS.primary} />
          }
        >
          {filteredReports.map((report, index) => {
            const statusConfig = getStatusConfig(report.status);
            return (
              <ReportCard
                key={report.id}
                report={report}
                statusConfig={statusConfig}
                formatDate={formatDate}
                getReportSummary={getReportSummary}
                onPress={() => handleOpenPDF(report.id)}
                onShare={() => handleSharePDF(report.pdf_url!)}
                onMenu={() => showActionMenu(report)}
                index={index}
              />
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Composant ReportCard avec animations
interface ReportCardProps {
  report: Report;
  statusConfig: { color: string; bgColor: string; label: string; icon: keyof typeof Ionicons.glyphMap };
  formatDate: (date: string) => string;
  getReportSummary: (report: Report) => string;
  onPress: () => void;
  onShare: () => void;
  onMenu: () => void;
  index: number;
}

function ReportCard({ report, statusConfig, formatDate, getReportSummary, onPress, onShare, onMenu, index }: ReportCardProps) {
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
        style={styles.reportCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Icône principale */}
        <View style={styles.cardIconContainer}>
          <Ionicons name="document-text" size={32} color={MEDICAL_COLORS.primary} />
        </View>

        {/* Contenu principal */}
        <View style={styles.cardContent}>
          {/* Header avec nom patient et badge */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardPatientName} numberOfLines={1}>
              {report.patient?.full_name || 'Patient inconnu'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Résumé en 1-2 lignes */}
          <Text style={styles.cardSummary} numberOfLines={2}>
            {getReportSummary(report)}
          </Text>

          {/* Date et heure */}
          <View style={styles.cardDateContainer}>
            <Ionicons name="time-outline" size={14} color={MEDICAL_COLORS.textMuted} />
            <Text style={styles.cardDate}>{formatDate(report.created_at)}</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.cardActions}>
          {report.pdf_url && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={22} color={MEDICAL_COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onMenu();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={MEDICAL_COLORS.textMuted} />
              </TouchableOpacity>
            </>
          )}
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
    paddingBottom: 20,
    backgroundColor: MEDICAL_COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: MEDICAL_COLORS.border,
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
    color: MEDICAL_COLORS.textSecondary,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEDICAL_COLORS.card,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
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
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: MEDICAL_COLORS.card,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: MEDICAL_COLORS.primary,
    borderColor: MEDICAL_COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: MEDICAL_COLORS.textSecondary,
  },
  filterTextActive: {
    color: MEDICAL_COLORS.card,
    fontWeight: '600',
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
    marginBottom: 14,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: MEDICAL_COLORS.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: MEDICAL_COLORS.border,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#E8F1FF',
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
    color: MEDICAL_COLORS.text,
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
    color: MEDICAL_COLORS.textSecondary,
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
    color: MEDICAL_COLORS.textMuted,
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
    backgroundColor: '#F5F5F7',
  },
});
