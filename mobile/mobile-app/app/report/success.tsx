/**
 * Écran de Succès - Affichage premium après génération d'un rapport PDF
 * Design iOS-grade avec toutes les actions PDF disponibles
 * 
 * IMPORTANT : Cet écran récupère TOUJOURS les données à jour via l'API
 * pour garantir que les informations affichées sont les plus récentes,
 * même si le rapport a été modifié après sa création.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Animated } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { reportApiService, ReportDetails } from '@/services/reportApi';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Paramètres reçus (uniquement pour pdfUrl et reportId)
  const pdfUrl = params.pdfUrl as string;
  const reportId = params.report_id || params.noteId as string;

  // États
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Animations
  const [scaleAnim] = useState(new Animated.Value(0));
  const [checkOpacity] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  /**
   * Récupère les détails du rapport depuis l'API
   * Cette fonction garantit que les données affichées sont toujours à jour
   */
  const fetchReportDetails = async () => {
    if (!reportId) {
      setLoadError('ID du rapport manquant');
      setIsLoadingReport(false);
      return;
    }

    try {
      setIsLoadingReport(true);
      setLoadError(null);

      console.log('📋 Récupération des détails du rapport:', reportId);
      const details = await reportApiService.getReportDetails(reportId);

      setReport(details);
      console.log('✅ Détails du rapport récupérés:', {
        patient: details.patient?.full_name || '(vide)',
        age: details.patient?.age || '(vide)',
        gender: details.patient?.gender || '(vide)',
        created_at: details.created_at
      });

      // Animation fade-in des données
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      setLoadError(error.message || 'Impossible de charger les détails du rapport');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Récupération initiale des données
  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  // Animation d'entrée de l'icône de succès
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /**
   * Formate une date en français
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Ouvrir le PDF dans le navigateur
   */
  const handleOpenPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsLoading(true);
      await WebBrowser.openBrowserAsync(pdfUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'ouverture du PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Partager le PDF
   */
  const handleSharePDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsLoading(true);

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
      Alert.alert('Erreur', 'Impossible de partager le PDF. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Imprimer le PDF
   */
  const handlePrintPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsLoading(true);

      const isAvailable = await Print.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'L\'impression n\'est pas disponible sur cet appareil');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `report-print-${Date.now()}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        await Print.printAsync({
          uri: downloadResult.uri,
          html: '',
        });
      } else {
        throw new Error('Échec du téléchargement du PDF');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'impression:', error);
      Alert.alert('Erreur', 'Impossible d\'imprimer le PDF. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprimer le rapport (mettre à la corbeille)
   */
  const handleDeleteReport = () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await reportApiService.deleteReport(reportId);
              Alert.alert('Succès', 'Rapport supprimé avec succès', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)'),
                },
              ]);
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le rapport');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Mettre le rapport en brouillon
   */
  const handleSaveAsDraft = async () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    try {
      setIsLoading(true);
      await reportApiService.saveAsDraft(reportId);
      Alert.alert('Succès', 'Rapport mis en brouillon', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la mise en brouillon:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre le rapport en brouillon');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Retour au tableau de bord
   */
  const handleBackToDashboard = () => {
    router.replace('/(tabs)');
  };

  /**
   * Réessayer le chargement des données
   */
  const handleRetry = () => {
    fetchReportDetails();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#006CFF" />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section principale */}
        <View style={styles.mainSection}>
          {/* Icône de succès animée */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: checkOpacity,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={96} color="#1BC47D" />
          </Animated.View>

          {/* Titre */}
          <Text style={styles.title}>Rapport généré</Text>
          <Text style={styles.subtitle}>Votre document est prêt</Text>

          {/* Carte d'information */}
          <View style={styles.infoCard}>
            {isLoadingReport ? (
              // État de chargement
              <View style={styles.loadingInfo}>
                <ActivityIndicator size="small" color="#006CFF" />
                <Text style={styles.loadingInfoText}>Chargement des informations...</Text>
              </View>
            ) : loadError ? (
              // État d'erreur
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorTitle}>Erreur de chargement</Text>
                <Text style={styles.errorMessage}>{loadError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRetry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={20} color="#006CFF" />
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : report ? (
              // Données chargées avec succès (fade-in)
              <Animated.View style={{ opacity: fadeAnim }}>
                {/* Nom du patient */}
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color="#8E8E93" />
                  <Text style={styles.infoLabel}>Nom complet :</Text>
                  <Text style={styles.infoValue}>
                    {report.patient?.full_name || 'Non spécifié'}
                  </Text>
                </View>

                {/* Âge */}
                {report.patient?.age && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#8E8E93" />
                    <Text style={styles.infoLabel}>Âge :</Text>
                    <Text style={styles.infoValue}>{report.patient.age}</Text>
                  </View>
                )}

                {/* Sexe */}
                {report.patient?.gender && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person-circle-outline" size={20} color="#8E8E93" />
                    <Text style={styles.infoLabel}>Sexe :</Text>
                    <Text style={styles.infoValue}>{report.patient.gender}</Text>
                  </View>
                )}

                {/* Chambre */}
                {report.patient?.room_number && (
                  <View style={styles.infoRow}>
                    <Ionicons name="bed-outline" size={20} color="#8E8E93" />
                    <Text style={styles.infoLabel}>Chambre :</Text>
                    <Text style={styles.infoValue}>{report.patient.room_number}</Text>
                  </View>
                )}

                {/* Unité / Service */}
                {report.patient?.unit && (
                  <View style={styles.infoRow}>
                    <Ionicons name="business-outline" size={20} color="#8E8E93" />
                    <Text style={styles.infoLabel}>Unité / Service :</Text>
                    <Text style={styles.infoValue}>{report.patient.unit}</Text>
                  </View>
                )}

                {/* Date */}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
                  <Text style={styles.infoLabel}>Date :</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(report.created_at)}
                  </Text>
                </View>

                {/* Type */}
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
                  <Text style={styles.infoLabel}>Type :</Text>
                  <Text style={styles.infoValue}>SOAPIE</Text>
                </View>

                {/* Statut */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name={report.status === 'final' ? 'checkmark-circle-outline' : 'create-outline'}
                    size={20}
                    color="#8E8E93"
                  />
                  <Text style={styles.infoLabel}>Statut :</Text>
                  <Text style={[
                    styles.infoValue,
                    report.status === 'final' && styles.statusFinal,
                    report.status === 'draft' && styles.statusDraft
                  ]}>
                    {report.status === 'final' ? 'Finalisé' :
                      report.status === 'draft' ? 'Brouillon' :
                        'Corbeille'}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>

        {/* Section Actions (affichée uniquement si les données sont chargées) */}
        {!isLoadingReport && !loadError && report && (
          <View style={styles.actionsSection}>
            <Text style={styles.actionsTitle}>Actions</Text>

            {/* Bouton primaire : Ouvrir PDF */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenPDF}
              activeOpacity={0.8}
              disabled={isLoading || !pdfUrl}
            >
              <Ionicons name="document-outline" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ouvrir le PDF</Text>
            </TouchableOpacity>

            {/* Boutons secondaires */}
            <View style={styles.secondaryButtonsContainer}>
              {/* Imprimer */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePrintPDF}
                activeOpacity={0.7}
                disabled={isLoading || !pdfUrl}
              >
                <Ionicons name="print-outline" size={22} color="#006CFF" />
                <Text style={styles.secondaryButtonText}>Imprimer</Text>
              </TouchableOpacity>

              {/* Partager */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSharePDF}
                activeOpacity={0.7}
                disabled={isLoading || !pdfUrl}
              >
                <Ionicons name="share-outline" size={22} color="#006CFF" />
                <Text style={styles.secondaryButtonText}>Partager</Text>
              </TouchableOpacity>
            </View>

            {/* Actions de gestion */}
            <View style={styles.managementButtonsContainer}>
              {/* Mettre en brouillon */}
              <TouchableOpacity
                style={styles.managementButton}
                onPress={handleSaveAsDraft}
                activeOpacity={0.7}
                disabled={isLoading || !reportId}
              >
                <Ionicons name="save-outline" size={20} color="#8E8E93" />
                <Text style={styles.managementButtonText}>Mettre en brouillon</Text>
              </TouchableOpacity>

              {/* Supprimer */}
              <TouchableOpacity
                style={[styles.managementButton, styles.deleteButton]}
                onPress={handleDeleteReport}
                activeOpacity={0.7}
                disabled={isLoading || !reportId}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.managementButtonText, styles.deleteButtonText]}>
                  Mettre à la corbeille
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bouton retour dashboard */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToDashboard}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Retour au tableau de bord</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  mainSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
    minWidth: 60,
  },
  infoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
  },
  statusFinal: {
    color: '#1BC47D',
  },
  statusDraft: {
    color: '#FF9500',
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingInfoText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#006CFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#006CFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006CFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#006CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#006CFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#006CFF',
    fontSize: 15,
    fontWeight: '600',
  },
  managementButtonsContainer: {
    gap: 12,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  deleteButton: {
    borderColor: '#FFEBEE',
  },
  managementButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#006CFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
