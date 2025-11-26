/**
 * Écran Rapports - Liste de tous les rapports PDF générés
 * Design premium iOS avec filtres, recherche et actions rapides
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { reportApiService, Report } from '@/services/reportApi';

type FilterType = 'all' | 'final' | 'draft' | 'trash';

export default function RapportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les rapports
  const loadReports = useCallback(async (status?: string) => {
    try {
      setIsLoading(true);
      const response = await reportApiService.getReports({
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      console.log('📋 Rapports reçus:', response.reports?.length || 0, 'rapports');
      console.log('📋 Détails:', response.reports?.slice(0, 2));
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

  // Recharger les rapports quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  // Filtrer les rapports par statut
  useEffect(() => {
    let filtered = reports;

    // Filtrer par statut
    if (activeFilter !== 'all') {
      filtered = filtered.filter(report => report.status === activeFilter);
    }

    // Filtrer par recherche
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

  // Rafraîchir la liste
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadReports(activeFilter === 'all' ? undefined : activeFilter);
  }, [loadReports, activeFilter]);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtenir la couleur du badge de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return '#006CFF';
      case 'draft':
        return '#FF9500';
      case 'trash':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'final':
        return 'Finalisé';
      case 'draft':
        return 'Brouillon';
      case 'trash':
        return 'Corbeille';
      default:
        return status;
    }
  };

  // Ouvrir le PDF dans le viewer intégré
  const handleOpenPDF = (pdfUrl: string, reportId?: string) => {
    // Si reportId est fourni, naviguer vers l'écran de détails
    if (reportId) {
      router.push({
        pathname: '/report/details',
        params: { reportId },
      });
      return;
    }
    router.push({
      pathname: '/pdf-viewer',
      params: {
        pdf_url: pdfUrl,
        report_id: reportId || '',
      },
    });
  };

  // Partager le PDF
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
      } else {
        throw new Error('Échec du téléchargement du PDF');
      }
    } catch (error: any) {
      console.error('Erreur lors du partage:', error);
      Alert.alert('Erreur', 'Impossible de partager le PDF');
    }
  };

  // Afficher le menu d'actions
  const showActionMenu = (report: Report) => {
    const options = [];

    if (report.status === 'trash') {
      options.push({ text: 'Restaurer', onPress: () => handleRestoreReport(report.id) });
    } else {
      options.push({ text: 'Mettre en brouillon', onPress: () => handleUpdateStatus(report.id, 'draft') });
    }

    options.push(
      { text: 'Supprimer', style: 'destructive' as const, onPress: () => handleDeleteReport(report.id) },
      { text: 'Annuler', style: 'cancel' as const }
    );

    Alert.alert('Actions', `Rapport de ${report.patient?.full_name || 'Patient inconnu'}`, options);
  };

  // Mettre à jour le statut
  const handleUpdateStatus = async (reportId: string, status: 'draft' | 'final' | 'trash') => {
    try {
      await reportApiService.updateReportStatus(reportId, status);
      await loadReports(activeFilter === 'all' ? undefined : activeFilter);
      Alert.alert('Succès', `Rapport ${status === 'draft' ? 'mis en brouillon' : status === 'final' ? 'finalisé' : 'supprimé'}`);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le rapport');
    }
  };

  // Restaurer un rapport
  const handleRestoreReport = async (reportId: string) => {
    try {
      await reportApiService.updateReportStatus(reportId, 'final');
      await loadReports(activeFilter === 'all' ? undefined : activeFilter);
      Alert.alert('Succès', 'Rapport restauré');
    } catch (error: any) {
      console.error('Erreur lors de la restauration:', error);
      Alert.alert('Erreur', error.message || 'Impossible de restaurer le rapport');
    }
  };

  // Supprimer un rapport
  const handleDeleteReport = (reportId: string) => {
    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer définitivement ce rapport ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportApiService.deleteReport(reportId);
              await loadReports(activeFilter === 'all' ? undefined : activeFilter);
              Alert.alert('Succès', 'Rapport supprimé');
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le rapport');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes Rapports</Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par patient ou date..."
          placeholderTextColor="#8E8E93"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {(['all', 'final', 'draft', 'trash'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'Tous' : filter === 'final' ? 'Finalisés' : filter === 'draft' ? 'Brouillons' : 'Corbeille'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des rapports */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006CFF" />
          <Text style={styles.loadingText}>Chargement des rapports...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>
            {searchTerm ? 'Aucun résultat' : activeFilter === 'all' ? 'Aucun rapport' : `Aucun rapport ${getStatusLabel(activeFilter).toLowerCase()}`}
          </Text>
          <Text style={styles.emptyText}>
            {searchTerm
              ? 'Essayez avec d\'autres mots-clés'
              : activeFilter === 'all'
              ? 'Vos rapports générés apparaîtront ici'
              : `Vous n'avez pas de rapports ${getStatusLabel(activeFilter).toLowerCase()}`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#006CFF" />
          }
        >
          {filteredReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => {
                // Naviguer vers l'écran de détails si reportId est disponible
                if (report.id) {
                  router.push({
                    pathname: '/report/details',
                    params: { reportId: report.id },
                  });
                } else if (report.pdf_url) {
                  handleOpenPDF(report.pdf_url, report.id);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Icône PDF */}
              <View style={styles.cardIconContainer}>
                <Ionicons name="document-text" size={32} color="#006CFF" />
              </View>

              {/* Contenu */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardPatientName} numberOfLines={1}>
                    {report.patient?.full_name || 'Patient inconnu'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {getStatusLabel(report.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDateContainer}>
                  <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
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
                        handleSharePDF(report.pdf_url);
                      }}
                    >
                      <Ionicons name="share-outline" size={20} color="#006CFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        showActionMenu(report);
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 12,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#006CFF',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E6F4FE',
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
  },
  cardPatientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
});
