/**
 * Écran ReportDetailsScreen - Affichage détaillé d'un rapport PDF
 * Design iOS-grade avec toutes les informations patient, SOAPIE et actions
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
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { reportApiService, ReportDetails } from '@/services/reportApi';

// Interface pour les détails du rapport
interface ReportDetails {
  id: string;
  patient_id: string | null;
  pdf_url: string;
  created_at: string;
  recorded_at?: string;
  status: 'draft' | 'final' | 'trash';
  patient: {
    id: string | null;
    full_name: string;
    age: string | null;
    gender: string | null;
    room_number: string | null;
    unit: string | null;
  };
  soapie: {
    S?: string;
    O?: {
      vitals?: {
        temperature?: string;
        blood_pressure?: string;
        heart_rate?: string;
        respiratory_rate?: string;
        spo2?: string;
        glycemia?: string;
      };
      exam?: string;
      labs?: string;
      medications?: string[];
    };
    A?: string;
    I?: string[] | string;
    E?: string;
    P?: string;
  };
  transcription?: string;
}

export default function ReportDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportId = params.reportId as string;

  // États
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /**
   * Récupère les détails du rapport depuis l'API
   */
  const fetchReportDetails = async () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport manquant', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log(`📋 Récupération des détails du rapport: ${reportId}`);
      const reportDetails = await reportApiService.getReportDetails(reportId);
      setReport(reportDetails);
      console.log('✅ Détails du rapport récupérés avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      
      if (error.message?.includes('Session expirée')) {
        Alert.alert('Session expirée', error.message, [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      } else if (error.message?.includes('non trouvé') || error.response?.status === 404) {
        Alert.alert(
          'Rapport non trouvé',
          'Ce rapport n\'existe pas ou a été supprimé. La liste sera actualisée.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Retourner au dashboard et forcer le rechargement
                router.replace('/(tabs)');
              }
            }
          ]
        );
      } else if (error.message?.includes('Accès refusé') || error.message?.includes('pas autorisé')) {
        Alert.alert('Accès refusé', 'Vous n\'êtes pas autorisé à consulter ce rapport.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de charger les détails du rapport.', [
          { text: 'Réessayer', onPress: fetchReportDetails },
          { text: 'Retour', style: 'cancel', onPress: () => router.back() }
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

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
   * Obtient la couleur du badge de statut
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final':
        return '#007AFF';
      case 'draft':
        return '#FFD60A';
      case 'trash':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  /**
   * Obtient le texte du statut
   */
  const getStatusText = (status: string) => {
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

  /**
   * Ouvrir le PDF dans le viewer intégré
   */
  const handleOpenPDF = async () => {
    if (!report?.pdf_url) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('📄 Ouverture du PDF:', report.pdf_url);
      
      // Ouvrir dans le viewer intégré
      router.push({
        pathname: '/pdf-viewer',
        params: {
          pdf_url: report.pdf_url,
          report_id: report.id,
        },
      });
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture du PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF. Vérifiez votre connexion.');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Partager le PDF
   */
  const handleSharePDF = async () => {
    if (!report?.pdf_url) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('📤 Partage du PDF:', report.pdf_url);
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'Le partage n\'est pas disponible sur cet appareil');
        return;
      }

      // Télécharger le PDF temporairement pour le partage
      const fileName = `rapport-${report.patient.full_name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('📥 Téléchargement du PDF pour partage...');
      const downloadResult = await FileSystem.downloadAsync(report.pdf_url, fileUri);

      console.log('📥 Résultat du téléchargement:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers,
      });

      if (downloadResult.status === 200 && downloadResult.uri) {
        console.log('📤 Partage du fichier:', downloadResult.uri);
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager le rapport PDF',
          UTI: 'com.adobe.pdf', // Type uniforme pour iOS
        });
        console.log('✅ Partage réussi');
      } else {
        throw new Error(`Échec du téléchargement du PDF (status: ${downloadResult.status})`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du partage:', error);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      Alert.alert(
        'Erreur',
        error.message?.includes('téléchargement') 
          ? 'Impossible de télécharger le PDF. Vérifiez votre connexion et les permissions de stockage.'
          : 'Impossible de partager le PDF. Vérifiez votre connexion.'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Imprimer le PDF
   */
  const handlePrintPDF = async () => {
    if (!report?.pdf_url) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('🖨️ Impression du PDF:', report.pdf_url);

      const isAvailable = await Print.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'L\'impression n\'est pas disponible sur cet appareil');
        return;
      }

      // Télécharger le PDF temporairement pour l'impression
      const fileName = `rapport-print-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('📥 Téléchargement du PDF pour impression...');
      console.log('   URL source:', report.pdf_url);
      console.log('   Destination:', fileUri);
      
      const downloadResult = await FileSystem.downloadAsync(report.pdf_url, fileUri);

      console.log('📥 Résultat du téléchargement:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers,
      });

      if (downloadResult.status === 200 && downloadResult.uri) {
        // Vérifier que le fichier existe
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        if (!fileInfo.exists) {
          throw new Error('Le fichier téléchargé n\'existe pas');
        }
        
        console.log('   Taille du fichier:', fileInfo.size, 'bytes');
        console.log('🖨️ Impression du fichier:', downloadResult.uri);
        
        await Print.printAsync({
          uri: downloadResult.uri,
        });
        console.log('✅ Impression lancée');
      } else {
        throw new Error(`Échec du téléchargement du PDF (status: ${downloadResult.status})`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      Alert.alert(
        'Erreur',
        error.message?.includes('téléchargement')
          ? 'Impossible de télécharger le PDF. Vérifiez votre connexion et les permissions de stockage.'
          : 'Impossible d\'imprimer le PDF. Vérifiez votre connexion.'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Télécharger le PDF
   */
  const handleDownloadPDF = async () => {
    if (!report?.pdf_url) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);

      const fileName = `rapport-${report.patient.full_name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(report.pdf_url, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert('Succès', `PDF téléchargé: ${fileName}`);
      } else {
        throw new Error('Échec du téléchargement');
      }
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le PDF. Vérifiez votre connexion.');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Mettre à jour le statut du rapport
   */
  const handleUpdateStatus = async (newStatus: 'draft' | 'final' | 'trash') => {
    if (!report) return;

    try {
      setIsActionLoading(true);
      await reportApiService.updateReportStatus(report.id, newStatus);
      
      // Rafraîchir les données pour mettre à jour l'affichage des boutons
      await fetchReportDetails();
      
      // Ne pas afficher d'alerte pour éviter d'interrompre l'utilisateur
      // Le changement de bouton sera visible immédiatement après le rafraîchissement
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut du rapport.');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Modifier le rapport (rediriger vers l'écran d'édition)
   */
  const handleEditReport = () => {
    if (!report) {
      Alert.alert('Erreur', 'Impossible de modifier le rapport');
      return;
    }

    // Construire les paramètres pour l'écran d'édition
    const params: Record<string, string> = {
      note_id: report.id,
      structured_json: JSON.stringify({
        patient: report.patient,
        soapie: report.soapie,
      }),
      patientData: JSON.stringify(report.patient), // Passer aussi patientData séparément pour compatibilité
    };

    if (report.patient_id) {
      params.patientId = report.patient_id;
    }

    if (report.transcription) {
      params.transcription = report.transcription;
    }

    console.log('✏️ Navigation vers l\'écran d\'édition avec:', {
      note_id: report.id,
      patient_id: report.patient_id,
      has_soapie: !!report.soapie,
      has_vitals: !!(report.soapie?.O?.vitals),
      patient: report.patient,
    });

    router.push({
      pathname: '/report/edit',
      params,
    });
  };

  /**
   * Supprimer définitivement le rapport
   */
  const handleDeletePermanently = () => {
    if (!report) return;

    Alert.alert(
      'Supprimer définitivement',
      'Êtes-vous sûr de vouloir supprimer définitivement ce rapport ? Cette action est irréversible.',
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
              setIsActionLoading(true);
              await reportApiService.deleteReport(report.id);
              Alert.alert('Succès', 'Rapport supprimé définitivement', [
                { text: 'OK', onPress: () => router.push('/(tabs)/rapports') }
              ]);
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le rapport.');
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Affiche une section SOAPIE
   */
  const renderSOAPIESection = (title: string, content: any, icon: string) => {
    if (!content || (typeof content === 'string' && !content.trim()) || 
        (Array.isArray(content) && content.length === 0) ||
        (typeof content === 'object' && Object.keys(content).length === 0)) {
      return null;
    }

    return (
      <View style={styles.soapieCard}>
        <View style={styles.soapieHeader}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
          <Text style={styles.soapieTitle}>{title}</Text>
        </View>
        <View style={styles.soapieContent}>
          {typeof content === 'string' && (
            <Text style={styles.soapieText}>{content}</Text>
          )}
          {Array.isArray(content) && (
            <View style={styles.listContainer}>
              {content.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
          {typeof content === 'object' && !Array.isArray(content) && (
            <View>
              {content.vitals && Object.keys(content.vitals).length > 0 && (
                <View style={styles.vitalsContainer}>
                  <Text style={styles.vitalsTitle}>Signes vitaux:</Text>
                  {content.vitals.temperature && (
                    <Text style={styles.vitalItem}>Température: {content.vitals.temperature}</Text>
                  )}
                  {content.vitals.blood_pressure && (
                    <Text style={styles.vitalItem}>Tension: {content.vitals.blood_pressure}</Text>
                  )}
                  {content.vitals.heart_rate && (
                    <Text style={styles.vitalItem}>FC: {content.vitals.heart_rate}</Text>
                  )}
                  {content.vitals.respiratory_rate && (
                    <Text style={styles.vitalItem}>FR: {content.vitals.respiratory_rate}</Text>
                  )}
                  {content.vitals.spo2 && (
                    <Text style={styles.vitalItem}>SpO2: {content.vitals.spo2}</Text>
                  )}
                  {content.vitals.glycemia && (
                    <Text style={styles.vitalItem}>Glycémie: {content.vitals.glycemia}</Text>
                  )}
                </View>
              )}
              {content.exam && content.exam.trim() && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Examen:</Text>
                  <Text style={styles.soapieText}>{content.exam}</Text>
                </View>
              )}
              {content.labs && content.labs.trim() && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Analyses:</Text>
                  <Text style={styles.soapieText}>{content.labs}</Text>
                </View>
              )}
              {content.medications && Array.isArray(content.medications) && content.medications.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Médicaments:</Text>
                  {content.medications.map((med: string, index: number) => (
                    <View key={index} style={styles.listItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.listText}>{med}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading && !report) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du rapport</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du rapport</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Rapport non trouvé</Text>
          <Text style={styles.errorText}>Impossible de charger les détails du rapport.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportDetails}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du rapport</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchReportDetails}
            tintColor="#007AFF"
          />
        }
      >
        {/* Section Patient */}
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientNameContainer}>
              <Text style={styles.patientName}>{report.patient.full_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.patientInfo}>
            {report.patient.age && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                <Text style={styles.infoText}>{report.patient.age} ans</Text>
              </View>
            )}
            {report.patient.gender && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#8E8E93" />
                <Text style={styles.infoText}>{report.patient.gender}</Text>
              </View>
            )}
            {report.patient.room_number && (
              <View style={styles.infoRow}>
                <Ionicons name="bed-outline" size={16} color="#8E8E93" />
                <Text style={styles.infoText}>Chambre {report.patient.room_number}</Text>
              </View>
            )}
            {report.patient.unit && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={16} color="#8E8E93" />
                <Text style={styles.infoText}>{report.patient.unit}</Text>
              </View>
            )}
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.dateText}>{formatDate(report.created_at)}</Text>
          </View>
        </View>

        {/* Section SOAPIE */}
        <View style={styles.soapieSection}>
          <Text style={styles.sectionTitle}>Résumé SOAPIE</Text>
          
          {renderSOAPIESection('S - Subjective', report.soapie.S, 'chatbubble-outline')}
          {renderSOAPIESection('O - Objective', report.soapie.O, 'eye-outline')}
          {renderSOAPIESection('A - Assessment', report.soapie.A, 'analytics-outline')}
          {renderSOAPIESection('I - Intervention', report.soapie.I, 'medical-outline')}
          {renderSOAPIESection('E - Evaluation', report.soapie.E, 'checkmark-circle-outline')}
          {renderSOAPIESection('P - Plan', report.soapie.P, 'clipboard-outline')}
        </View>

        {/* Section PDF Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions PDF</Text>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleOpenPDF}
            disabled={isActionLoading || !report.pdf_url}
          >
            <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Ouvrir le PDF</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSharePDF}
              disabled={isActionLoading || !report.pdf_url}
            >
              <Ionicons name="share-outline" size={22} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePrintPDF}
              disabled={isActionLoading || !report.pdf_url}
            >
              <Ionicons name="print-outline" size={22} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Imprimer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDownloadPDF}
              disabled={isActionLoading || !report.pdf_url}
            >
              <Ionicons name="download-outline" size={22} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Télécharger</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Actions Statut */}
        <View style={styles.statusActionsSection}>
          <Text style={styles.sectionTitle}>Gestion du rapport</Text>
          
          {/* Bouton Modifier */}
          <TouchableOpacity
            style={[styles.statusButton, styles.editButton]}
            onPress={handleEditReport}
            disabled={isActionLoading}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={[styles.statusButtonText, { color: '#007AFF' }]}>Modifier le rapport</Text>
          </TouchableOpacity>
          
          {report.status !== 'draft' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('draft')}
              disabled={isActionLoading}
            >
              <Ionicons name="save-outline" size={20} color="#FFD60A" />
              <Text style={[styles.statusButtonText, { color: '#FFD60A' }]}>Mettre en brouillon</Text>
            </TouchableOpacity>
          )}
          
          {report.status !== 'final' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('final')}
              disabled={isActionLoading}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#007AFF" />
              <Text style={[styles.statusButtonText, { color: '#007AFF' }]}>
                {report.status === 'trash' ? 'Restaurer' : 'Finaliser'}
              </Text>
            </TouchableOpacity>
          )}
          
          {report.status !== 'trash' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => handleUpdateStatus('trash')}
              disabled={isActionLoading}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.statusButtonText, { color: '#FF3B30' }]}>Mettre à la corbeille</Text>
            </TouchableOpacity>
          )}
          
          {report.status === 'trash' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={handleDeletePermanently}
              disabled={isActionLoading}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.statusButtonText, { color: '#FF3B30' }]}>Supprimer définitivement</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton Retour */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/rapports')}
          disabled={isActionLoading}
        >
          <Text style={styles.backButtonText}>Retour aux rapports</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Loading Overlay */}
      {isActionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientHeader: {
    marginBottom: 16,
  },
  patientNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  patientInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  soapieSection: {
    marginBottom: 24,
  },
  soapieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  soapieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  soapieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  soapieContent: {
    marginTop: 8,
  },
  soapieText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  listContainer: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  vitalsContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  vitalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  vitalItem: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  actionsSection: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusActionsSection: {
    marginBottom: 24,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  editButton: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

