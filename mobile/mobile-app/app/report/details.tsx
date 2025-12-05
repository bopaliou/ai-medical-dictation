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
  Animated,
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
import * as Haptics from 'expo-haptics';
import ModernHeader from '@/components/ModernHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeIn, slideUp, ANIMATION_DURATION } from '@/utils/animations';

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
  const { theme } = useTheme();

  // États
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    if (!isLoading && report) {
      Animated.parallel([
        fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
        slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
      ]).start();
    }
  }, [isLoading, report]);

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
      // Afficher un message d'erreur clair selon le type d'erreur
      if (error.message) {
        if (error.message.includes('Trop de requêtes') || error.response?.status === 429) {
          // Pour l'erreur 429, on ne log pas comme erreur mais comme info
          // L'application va réessayer automatiquement
          console.log('ℹ️ Trop de requêtes - Les détails seront rechargés automatiquement dans quelques instants');
          // Ne pas afficher d'alerte pour 429, juste réessayer automatiquement après un délai
          setTimeout(() => {
            fetchReportDetails();
          }, 5000); // Réessayer après 5 secondes
          return; // Sortir tôt pour ne pas afficher d'erreur
        } else if (error.message.includes('Session expirée') || error.message.includes('Votre session a expiré')) {
          console.error('❌ Session expirée lors de la récupération des détails');
          Alert.alert('Session expirée', error.message, [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]);
        } else if (error.message.includes('non trouvé') || error.response?.status === 404) {
          console.error('❌ Rapport non trouvé');
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
        } else if (error.message.includes('Accès refusé') || error.message?.includes('pas autorisé') || error.message?.includes('autorisation')) {
          console.error('❌ Accès refusé');
          Alert.alert('Accès refusé', 'Vous n\'êtes pas autorisé à consulter ce rapport.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else if (error.message.includes('Impossible de se connecter') || error.message.includes('Oups !')) {
          console.error('❌ Erreur réseau lors de la récupération des détails:', error);
          Alert.alert('Erreur de connexion', error.message || 'Impossible de charger les détails du rapport.', [
            { text: 'Réessayer', onPress: fetchReportDetails },
            { text: 'Retour', style: 'cancel', onPress: () => router.back() }
          ]);
        } else {
          console.error('❌ Erreur lors de la récupération des détails:', error);
          Alert.alert('Erreur', error.message || 'Impossible de charger les détails du rapport.', [
            { text: 'Réessayer', onPress: fetchReportDetails },
            { text: 'Retour', style: 'cancel', onPress: () => router.back() }
          ]);
        }
      } else {
        console.error('❌ Erreur inconnue lors de la récupération des détails:', error);
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite. Veuillez réessayer.', [
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
        return theme.colors.success; // Vert pour finalisé (cohérent partout)
      case 'draft':
        return theme.colors.warning;
      case 'trash':
        return theme.colors.error;
      default:
        return theme.colors.textMuted;
    }
  };

  /**
   * Obtient la configuration des couleurs SOAPIE selon le thème
   */
  const getSoapieConfig = (sectionKey: string) => {
    const configs: Record<string, { color: string; bg: string; icon: string }> = {
      S: { color: '#5AC8FA', bg: theme.resolved === 'dark' ? '#1A3A5C' : '#E8F1FF', icon: 'chatbubble-ellipses' },
      O: { color: theme.colors.success, bg: theme.colors.successLight, icon: 'eye' },
      A: { color: theme.colors.warning, bg: theme.colors.warningLight, icon: 'analytics' },
      I: { color: '#AF52DE', bg: theme.resolved === 'dark' ? '#2A1A3A' : '#F3E8FF', icon: 'medical' },
      E: { color: theme.colors.primary, bg: theme.colors.primaryLight, icon: 'checkmark-circle' },
      P: { color: '#FF2D55', bg: theme.resolved === 'dark' ? '#3A1A22' : '#FFEBF0', icon: 'clipboard' },
    };
    return configs[sectionKey] || { color: theme.colors.primary, bg: theme.colors.primaryLight, icon: 'document' };
  };

  /**
   * Obtient la configuration des couleurs pour les signes vitaux
   */
  const getVitalConfig = (vitalKey: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      temperature: { color: theme.colors.warning, bg: theme.colors.warningLight },
      blood_pressure: { color: theme.colors.error, bg: theme.colors.errorLight },
      heart_rate: { color: theme.colors.error, bg: theme.colors.errorLight },
      respiratory_rate: { color: '#5AC8FA', bg: theme.resolved === 'dark' ? '#1A3A5C' : '#E8F1FF' },
      spo2: { color: theme.colors.primary, bg: theme.colors.primaryLight },
      glycemia: { color: theme.colors.warning, bg: theme.colors.warningLight },
    };
    return configs[vitalKey] || { color: theme.colors.primary, bg: theme.colors.primaryLight };
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

      // Vérifier la disponibilité de l'impression (peut ne pas être disponible sur toutes les plateformes/versions)
      try {
        if (typeof Print.isAvailableAsync === 'function') {
          const isAvailable = await Print.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert('Information', 'L\'impression n\'est pas disponible sur cet appareil');
            return;
          }
        } else {
          console.log('⚠️ Print.isAvailableAsync n\'est pas disponible, continuation de l\'impression...');
        }
      } catch (checkError) {
        console.log('⚠️ Erreur lors de la vérification de disponibilité, continuation...', checkError);
        // Continuer quand même, certaines plateformes peuvent ne pas avoir cette méthode
      }

      // Essayer d'abord d'imprimer directement depuis l'URL (plus rapide)
      try {
        console.log('🖨️ Tentative d\'impression directe depuis l\'URL...');
        await Print.printAsync({
          uri: report.pdf_url,
        });
        console.log('✅ Impression lancée depuis l\'URL');
        return;
      } catch (urlError: any) {
        console.log('⚠️ Impression directe échouée, téléchargement du fichier...', urlError.message);
        
        // Si l'impression directe échoue, télécharger le fichier d'abord
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
          // Vérifier que le fichier existe et a une taille valide
          const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
          if (!fileInfo.exists) {
            throw new Error('Le fichier téléchargé n\'existe pas');
          }
          
          if (fileInfo.size === 0) {
            throw new Error('Le fichier téléchargé est vide');
          }
          
          console.log('   Taille du fichier:', fileInfo.size, 'bytes');
          console.log('🖨️ Impression du fichier local:', downloadResult.uri);
          
          // Utiliser le fichier local pour l'impression
          await Print.printAsync({
            uri: downloadResult.uri,
            base64: false,
          });
          console.log('✅ Impression lancée depuis le fichier local');
          
          // Nettoyer le fichier temporaire après un délai
          setTimeout(async () => {
            try {
              const fileExists = await FileSystem.getInfoAsync(downloadResult.uri);
              if (fileExists.exists) {
                await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                console.log('🗑️ Fichier temporaire supprimé');
              }
            } catch (cleanupError) {
              console.warn('⚠️ Erreur lors du nettoyage du fichier temporaire:', cleanupError);
            }
          }, 5000);
        } else {
          throw new Error(`Échec du téléchargement du PDF (status: ${downloadResult.status})`);
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      console.error('   Message:', error.message);
      console.error('   Code:', error.code);
      console.error('   Stack:', error.stack);
      
      let errorMessage = 'Impossible d\'imprimer le PDF.';
      
      if (error.message?.includes('téléchargement') || error.message?.includes('download')) {
        errorMessage = 'Impossible de télécharger le PDF. Vérifiez votre connexion et les permissions de stockage.';
      } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      } else if (error.message?.includes('permission') || error.code === 'E_PERMISSION_DENIED') {
        errorMessage = 'Permission refusée. Vérifiez les permissions de l\'application.';
      } else if (error.message?.includes('format') || error.message?.includes('invalid')) {
        errorMessage = 'Format de fichier invalide. Le PDF pourrait être corrompu.';
      }
      
      Alert.alert('Erreur d\'impression', errorMessage);
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
   * Affiche une section SOAPIE avec design moderne et épuré (moins de couleurs)
   */
  const renderSOAPIESection = (
    sectionKey: 'S' | 'O' | 'A' | 'I' | 'E' | 'P',
    title: string,
    description: string,
    content: any
  ) => {
    if (!content || (typeof content === 'string' && !content.trim()) || 
        (Array.isArray(content) && content.length === 0) ||
        (typeof content === 'object' && Object.keys(content).length === 0)) {
      return null;
    }

    const sectionConfig = getSoapieConfig(sectionKey);

    return (
      <View style={[styles.soapieCard, { 
        backgroundColor: theme.colors.backgroundCard,
        borderColor: theme.colors.borderCard,
      }]}>
        <View style={[styles.soapieHeader, { 
          backgroundColor: theme.resolved === 'dark' ? sectionConfig.bg + '40' : sectionConfig.bg + '15',
          borderBottomColor: theme.colors.border,
        }]}>
          <View style={[styles.soapieIconContainer, { backgroundColor: sectionConfig.bg }]}>
            <Ionicons name={sectionConfig.icon as any} size={20} color={sectionConfig.color} />
          </View>
          <View style={styles.soapieHeaderText}>
            <View style={styles.soapieTitleRow}>
              <Text style={[styles.soapieTitle, { color: theme.colors.text }]}>{title}</Text>
              <View style={[styles.soapieBadge, { backgroundColor: sectionConfig.color }]}>
                <Text style={styles.soapieBadgeText}>{sectionKey}</Text>
              </View>
            </View>
            <Text style={[styles.soapieDescription, { color: theme.colors.textMuted }]}>{description}</Text>
          </View>
        </View>
        <View style={styles.soapieContent}>
          {typeof content === 'string' && (
            <Text style={[styles.soapieText, { color: theme.colors.text }]}>{content}</Text>
          )}
          {Array.isArray(content) && (
            <View style={styles.listContainer}>
              {content.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={[styles.listBullet, { backgroundColor: sectionConfig.bg }]}>
                    <Ionicons name="checkmark" size={12} color={sectionConfig.color} />
                  </View>
                  <Text style={[styles.listText, { color: theme.colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}
          {typeof content === 'object' && !Array.isArray(content) && (
            <View>
              {content.vitals && Object.keys(content.vitals).length > 0 && (
                <View style={[styles.vitalsContainer, { 
                  backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                  borderColor: theme.colors.border,
                }]}>
                  <View style={styles.vitalsHeader}>
                    <Ionicons name="pulse" size={18} color={getVitalConfig('blood_pressure').color} />
                    <Text style={[styles.vitalsTitle, { color: theme.colors.text }]}>Signes vitaux</Text>
                  </View>
                  <View style={styles.vitalsGrid}>
                    {content.vitals.temperature && (() => {
                      const config = getVitalConfig('temperature');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="thermometer" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Température</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.temperature}°C
                          </Text>
                        </View>
                      );
                    })()}
                    {content.vitals.blood_pressure && (() => {
                      const config = getVitalConfig('blood_pressure');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="pulse" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Tension artérielle</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.blood_pressure}
                          </Text>
                        </View>
                      );
                    })()}
                    {content.vitals.heart_rate && (() => {
                      const config = getVitalConfig('heart_rate');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="heart" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Fréquence cardiaque</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.heart_rate} bpm
                          </Text>
                        </View>
                      );
                    })()}
                    {content.vitals.respiratory_rate && (() => {
                      const config = getVitalConfig('respiratory_rate');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="fitness" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Fréquence respiratoire</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.respiratory_rate} /min
                          </Text>
                        </View>
                      );
                    })()}
                    {content.vitals.spo2 && (() => {
                      const config = getVitalConfig('spo2');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="water" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Saturation O₂</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.spo2.includes('%') ? content.vitals.spo2 : `${content.vitals.spo2}%`}
                          </Text>
                        </View>
                      );
                    })()}
                    {content.vitals.glycemia && (() => {
                      const config = getVitalConfig('glycemia');
                      return (
                        <View style={[styles.vitalCard, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
                          <Ionicons name="flask" size={20} color={config.color} />
                          <Text style={[styles.vitalLabel, { color: theme.colors.textSecondary }]}>Glycémie</Text>
                          <Text style={[styles.vitalValue, { color: config.color }]}>
                            {content.vitals.glycemia} g/L
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )}
              {content.exam && content.exam.trim() && (
                <View style={[styles.sectionBlock, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.sectionBlockHeader}>
                    <Ionicons name="search" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Examen clinique</Text>
                  </View>
                  <Text style={[styles.soapieText, { color: theme.colors.text, lineHeight: 22 }]}>{content.exam}</Text>
                </View>
              )}
              {content.labs && content.labs.trim() && (
                <View style={[styles.sectionBlock, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.sectionBlockHeader}>
                    <Ionicons name="flask-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Analyses biologiques</Text>
                  </View>
                  <Text style={[styles.soapieText, { color: theme.colors.text, lineHeight: 22 }]}>{content.labs}</Text>
                </View>
              )}
              {content.medications && Array.isArray(content.medications) && content.medications.length > 0 && (
                <View style={[styles.sectionBlock, { borderTopColor: theme.colors.border }]}>
                  <View style={styles.sectionBlockHeader}>
                    <Ionicons name="medical" size={18} color={theme.colors.primary} />
                    <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Médicaments ({content.medications.length})</Text>
                  </View>
                  <View style={styles.medicationsContainer}>
                    {content.medications.map((med: string, index: number) => (
                      <View key={index} style={[styles.medicationItem, { 
                        backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                        borderColor: theme.colors.border,
                      }]}>
                        <View style={[styles.medicationIcon, { backgroundColor: theme.colors.primaryLight }]}>
                          <Ionicons name="medical" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.medicationText, { color: theme.colors.text }]}>{med}</Text>
                      </View>
                    ))}
                  </View>
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
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ModernHeader
          title="Chargement..."
          subtitle="Récupération du rapport"
          icon="document-text"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des détails...</Text>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
        <ModernHeader
          title="Rapport non trouvé"
          subtitle="Impossible de charger les données"
          icon="alert-circle"
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Rapport non trouvé</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Impossible de charger les détails du rapport.</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchReportDetails}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
        
        {/* Header moderne */}
        <ModernHeader
          title={`Rapport ${report.patient.full_name}`}
          subtitle="Consultation et documentation SOAPIE"
          icon="document-text"
        />

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchReportDetails}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Section Patient - Design moderne */}
        <View style={[styles.patientCard, { 
          backgroundColor: theme.colors.backgroundCard,
          borderColor: theme.colors.borderCard,
        }]}>
          <View style={styles.patientGradient}>
            <View style={styles.patientHeader}>
              <View style={styles.patientHeaderInfo}>
                <View style={styles.patientNameRow}>
                  <View style={styles.patientNameContainer}>
                    <Text style={[styles.patientName, { color: theme.colors.text }]}>{report.patient.full_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                      <Ionicons 
                        name={report.status === 'final' ? 'checkmark-circle' : report.status === 'draft' ? 'create-outline' : 'trash-outline'} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.statusText}>{getStatusText(report.status)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.patientInfoGrid}>
                  {report.patient.age && (
                    <View style={[styles.patientInfoItem, { 
                      backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                      borderColor: theme.colors.border,
                    }]}>
                      <View style={[styles.patientInfoIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.patientInfoTextContainer}>
                        <Text style={[styles.patientInfoLabel, { color: theme.colors.textMuted }]}>Âge</Text>
                        <Text style={[styles.patientInfoValue, { color: theme.colors.text }]}>{report.patient.age} ans</Text>
                      </View>
                    </View>
                  )}
                  {report.patient.gender && (
                    <View style={[styles.patientInfoItem, { 
                      backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                      borderColor: theme.colors.border,
                    }]}>
                      <View style={[styles.patientInfoIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons 
                          name={report.patient.gender.toLowerCase().includes('f') ? "female" : "male"} 
                          size={16} 
                          color={theme.colors.primary} 
                        />
                      </View>
                      <View style={styles.patientInfoTextContainer}>
                        <Text style={[styles.patientInfoLabel, { color: theme.colors.textMuted }]}>Genre</Text>
                        <Text style={[styles.patientInfoValue, { color: theme.colors.text }]}>{report.patient.gender}</Text>
                      </View>
                    </View>
                  )}
                  {report.patient.room_number && (
                    <View style={[styles.patientInfoItem, { 
                      backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                      borderColor: theme.colors.border,
                    }]}>
                      <View style={[styles.patientInfoIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="bed" size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.patientInfoTextContainer}>
                        <Text style={[styles.patientInfoLabel, { color: theme.colors.textMuted }]}>Chambre</Text>
                        <Text style={[styles.patientInfoValue, { color: theme.colors.text }]}>{report.patient.room_number}</Text>
                      </View>
                    </View>
                  )}
                  {report.patient.unit && (
                    <View style={[styles.patientInfoItem, { 
                      backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                      borderColor: theme.colors.border,
                    }]}>
                      <View style={[styles.patientInfoIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="business" size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.patientInfoTextContainer}>
                        <Text style={[styles.patientInfoLabel, { color: theme.colors.textMuted }]}>Unité</Text>
                        <Text style={[styles.patientInfoValue, { color: theme.colors.text }]} numberOfLines={1}>{report.patient.unit}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={[styles.dateContainer, { borderTopColor: theme.colors.border }]}>
              <Ionicons name="time" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>{formatDate(report.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Section SOAPIE - Design moderne avec explications */}
        <View style={styles.soapieSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Résumé SOAPIE</Text>
                <Text style={styles.sectionSubtitle}>Méthode de documentation médicale structurée</Text>
              </View>
            </View>
          </View>
          
          {renderSOAPIESection(
            'S',
            'Subjective',
            'Motif de consultation et symptômes rapportés par le patient',
            report.soapie.S
          )}
          {renderSOAPIESection(
            'O',
            'Objective',
            'Observations cliniques, signes vitaux et examens objectifs',
            report.soapie.O
          )}
          {renderSOAPIESection(
            'A',
            'Assessment',
            'Évaluation et diagnostic basé sur les données S et O',
            report.soapie.A
          )}
          {renderSOAPIESection(
            'I',
            'Intervention',
            'Actions thérapeutiques et traitements administrés',
            report.soapie.I
          )}
          {renderSOAPIESection(
            'E',
            'Evaluation',
            'Évaluation de la réponse du patient aux interventions',
            report.soapie.E
          )}
          {renderSOAPIESection(
            'P',
            'Plan',
            'Plan de suivi et prochaines étapes de prise en charge',
            report.soapie.P
          )}
        </View>

        {/* Section PDF Actions - Design moderne */}
        <View style={[styles.actionsSection, { 
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.colors.borderCard,
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="document-attach" size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Document PDF</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>Consulter, partager ou imprimer le rapport</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.primaryButton, { 
              backgroundColor: theme.colors.primary,
            }]}
            onPress={handleOpenPDF}
            disabled={isActionLoading || !report.pdf_url}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            activeOpacity={0.8}
          >
            <View style={styles.primaryButtonIcon}>
              <Ionicons name="document-text" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.primaryButtonContent}>
              <Text style={styles.primaryButtonText}>Ouvrir le PDF</Text>
              <Text style={styles.primaryButtonSubtext}>Visualiser le rapport complet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={{ opacity: 0.7 }} />
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, {
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                borderColor: theme.colors.border,
              }]}
              onPress={handleSharePDF}
              disabled={isActionLoading || !report.pdf_url}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryButtonIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="share-social" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, {
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                borderColor: theme.colors.border,
              }]}
              onPress={handlePrintPDF}
              disabled={isActionLoading || !report.pdf_url}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryButtonIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="print" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Imprimer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, {
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
                borderColor: theme.colors.border,
              }]}
              onPress={handleDownloadPDF}
              disabled={isActionLoading || !report.pdf_url}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.7}
            >
              <View style={[styles.secondaryButtonIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="download" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>Télécharger</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Actions Statut - Design moderne */}
        <View style={[styles.statusActionsSection, {
          backgroundColor: theme.colors.backgroundCard,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.colors.borderCard,
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="settings" size={24} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Gestion du rapport</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>Modifier le statut ou éditer le contenu</Text>
              </View>
            </View>
          </View>
          
          {/* Bouton Modifier */}
          <TouchableOpacity
            style={[styles.statusButton, {
              backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F8F9FA',
              borderColor: theme.colors.primary,
            }]}
            onPress={handleEditReport}
            disabled={isActionLoading}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            activeOpacity={0.7}
          >
            <View style={[styles.statusButtonIcon, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="create" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.statusButtonContent}>
              <Text style={[styles.statusButtonText, { color: theme.colors.primary }]}>Modifier le rapport</Text>
              <Text style={[styles.statusButtonSubtext, { color: theme.colors.textMuted }]}>Éditer les informations SOAPIE</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          
          {report.status !== 'draft' && (
            <TouchableOpacity
              style={[styles.statusButton, { 
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#FFFBF5',
                borderColor: theme.colors.warning,
              }]}
              onPress={() => handleUpdateStatus('draft')}
              disabled={isActionLoading}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusButtonIcon, { backgroundColor: theme.colors.warningLight }]}>
                <Ionicons name="save" size={20} color={theme.colors.warning} />
              </View>
              <View style={styles.statusButtonContent}>
                <Text style={[styles.statusButtonText, { color: theme.colors.warning }]}>Mettre en brouillon</Text>
                <Text style={[styles.statusButtonSubtext, { color: theme.colors.textMuted }]}>Conserver comme brouillon</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {report.status !== 'final' && (
            <TouchableOpacity
              style={[styles.statusButton, { 
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#F0F9F4',
                borderColor: theme.colors.success,
              }]}
              onPress={() => handleUpdateStatus('final')}
              disabled={isActionLoading}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusButtonIcon, { backgroundColor: theme.colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.statusButtonContent}>
                <Text style={[styles.statusButtonText, { color: theme.colors.success }]}>
                  {report.status === 'trash' ? 'Restaurer' : 'Finaliser'}
                </Text>
                <Text style={[styles.statusButtonSubtext, { color: theme.colors.textMuted }]}>
                  {report.status === 'trash' ? 'Restaurer le rapport' : 'Marquer comme finalisé'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          
          {report.status !== 'trash' && (
            <TouchableOpacity
              style={[styles.statusButton, { 
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#FFF5F5',
                borderColor: theme.colors.error,
              }]}
              onPress={() => handleUpdateStatus('trash')}
              disabled={isActionLoading}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusButtonIcon, { backgroundColor: theme.colors.errorLight }]}>
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </View>
              <View style={styles.statusButtonContent}>
                <Text style={[styles.statusButtonText, { color: theme.colors.error }]}>Mettre à la corbeille</Text>
                <Text style={[styles.statusButtonSubtext, { color: theme.colors.textMuted }]}>Déplacer vers la corbeille</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {report.status === 'trash' && (
            <TouchableOpacity
              style={[styles.statusButton, {
                backgroundColor: theme.resolved === 'dark' ? theme.colors.backgroundElevated : '#FFEBEE',
                borderColor: theme.colors.error,
              }]}
              onPress={handleDeletePermanently}
              disabled={isActionLoading}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusButtonIcon, { backgroundColor: theme.colors.errorLight }]}>
                <Ionicons name="trash" size={20} color={theme.colors.error} />
              </View>
              <View style={styles.statusButtonContent}>
                <Text style={[styles.statusButtonText, { color: theme.colors.error }]}>Supprimer définitivement</Text>
                <Text style={[styles.statusButtonSubtext, { color: theme.colors.textMuted }]}>Cette action est irréversible</Text>
              </View>
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor appliqué dynamiquement
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    // color appliqué dynamiquement
    marginBottom: 2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    // color appliqué dynamiquement
    textAlign: 'center',
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
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    // borderColor appliqué dynamiquement
    // backgroundColor appliqué dynamiquement
  },
  patientGradient: {
    padding: 20,
  },
  patientHeader: {
    marginBottom: 16,
  },
  patientHeaderInfo: {
    flex: 1,
  },
  patientNameRow: {
    marginBottom: 12,
  },
  patientNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    // color appliqué dynamiquement
    flex: 1,
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  patientInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  patientInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
    padding: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  patientInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  patientInfoTextContainer: {
    flex: 1,
  },
  patientInfoLabel: {
    fontSize: 11,
    fontWeight: '500',
    // color appliqué dynamiquement
    marginBottom: 2,
  },
  patientInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    // borderTopColor appliqué dynamiquement
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    // color appliqué dynamiquement
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    // color appliqué dynamiquement
  },
  soapieSection: {
    marginBottom: 24,
  },
  soapieCard: {
    // backgroundColor appliqué dynamiquement
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  soapieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    // borderBottomColor appliqué dynamiquement
  },
  soapieIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soapieHeaderText: {
    flex: 1,
  },
  soapieTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  soapieTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.2,
  },
  soapieBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  soapieBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  soapieDescription: {
    fontSize: 13,
    fontWeight: '400',
    // color appliqué dynamiquement
    lineHeight: 18,
  },
  soapieContent: {
    padding: 16,
    paddingTop: 0,
  },
  soapieText: {
    fontSize: 15,
    // color appliqué dynamiquement
    lineHeight: 22,
    fontWeight: '400',
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    // color appliqué dynamiquement
    lineHeight: 22,
    fontWeight: '400',
  },
  vitalsContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    // backgroundColor appliqué dynamiquement
    borderRadius: 12,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  vitalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  vitalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  vitalLabel: {
    fontSize: 11,
    fontWeight: '500',
    // color appliqué dynamiquement
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    // borderTopColor appliqué dynamiquement
  },
  sectionBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  medicationsContainer: {
    marginTop: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  medicationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor appliqué dynamiquement
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  actionsSection: {
    marginBottom: 24,
    // backgroundColor, borderRadius, padding, borderWidth, borderColor appliqués dynamiquement
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    marginTop: 16,
  },
  primaryButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonContent: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
    gap: 8,
  },
  secondaryButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    // color appliqué dynamiquement
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusActionsSection: {
    marginBottom: 24,
    // backgroundColor, borderRadius, padding, borderWidth, borderColor appliqués dynamiquement
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    marginTop: 12,
    borderWidth: 1.5,
    // borderColor appliqué dynamiquement
    gap: 12,
  },
  editButton: {
    // borderColor appliqué dynamiquement
    // backgroundColor appliqué dynamiquement
  },
  deleteButton: {
    // borderColor appliqué dynamiquement
    backgroundColor: '#FFEBEE',
  },
  statusButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonContent: {
    flex: 1,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusButtonSubtext: {
    fontSize: 12,
    fontWeight: '400',
    // color appliqué dynamiquement
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

