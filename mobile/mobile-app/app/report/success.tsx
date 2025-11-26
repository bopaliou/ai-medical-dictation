/**
 * Écran Success - Affichage premium après génération d'un rapport PDF
 * Design iOS-grade avec toutes les actions PDF disponibles
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Animated } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { reportApiService } from '@/services/reportApi';
import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Paramètres reçus
  const pdfUrl = params.pdfUrl as string;
  const reportId = params.report_id || params.noteId as string; // Support des deux noms
  const patientName = params.patient_name as string;
  const createdAt = params.created_at as string;

  // États
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [checkOpacity] = useState(new Animated.Value(0));

  // Animation d'entrée
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

  // Formater la date
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
      
      // Vérifier si le partage est disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'Le partage n\'est pas disponible sur cet appareil');
        return;
      }

      // Télécharger le PDF temporairement pour le partage
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

      // Vérifier si l'impression est disponible
      const isAvailable = await Print.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Information', 'L\'impression n\'est pas disponible sur cet appareil');
        return;
      }

      // Télécharger le PDF temporairement pour l'impression
      const fileUri = FileSystem.documentDirectory + `report-print-${Date.now()}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        await Print.printAsync({
          uri: downloadResult.uri,
          html: '', // Non utilisé pour les PDF
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
   * Retour au dashboard
   */
  const handleBackToDashboard = () => {
    router.replace('/(tabs)');
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
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Patient :</Text>
              <Text style={styles.infoValue}>{patientName || 'Non spécifié'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Date :</Text>
              <Text style={styles.infoValue}>{formatDate(createdAt)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Type :</Text>
              <Text style={styles.infoValue}>SOAPIE</Text>
            </View>
          </View>
        </View>

        {/* Section Actions */}
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

        {/* Bouton retour dashboard */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToDashboard}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Retour au dashboard</Text>
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
