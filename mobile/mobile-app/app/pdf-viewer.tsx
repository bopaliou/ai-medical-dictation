/**
 * Écran PDF Viewer - Visualisation d'un PDF en plein écran
 * Design premium iOS avec actions complètes
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { reportApiService } from '@/services/reportApi';

export default function PDFViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  // Paramètres reçus
  const pdfUrl = params.pdf_url || params.pdfUrl as string;
  const reportId = params.report_id || params.reportId as string;

  // États
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Vérifier les paramètres requis
  React.useEffect(() => {
    if (!pdfUrl) {
      setError('URL du PDF non fournie');
      Alert.alert('Erreur', 'URL du PDF manquante', [
        {
          text: 'Retour',
          onPress: () => router.back(),
        },
      ]);
    }
  }, [pdfUrl, router]);

  // Gérer le chargement du PDF
  const handleLoadEnd = () => {
    setIsLoading(false);
    setPdfLoaded(true);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Erreur WebView:', nativeEvent);
    setIsLoading(false);
    setError('Impossible de charger le PDF');
  };

  // Partager le PDF
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
      setShowActionsMenu(false);
    }
  };

  // Ouvrir dans le navigateur
  const handleOpenInBrowser = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(pdfUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      });
      setShowActionsMenu(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'ouverture:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF dans le navigateur');
    }
  };

  // Imprimer le PDF
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
      setShowActionsMenu(false);
    }
  };

  // Télécharger le PDF localement
  const handleDownloadPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsLoading(true);
      const fileUri = FileSystem.documentDirectory + `rapport-${Date.now()}.pdf`;
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert('Succès', `PDF téléchargé: ${fileUri}`, [{ text: 'OK' }]);
      } else {
        throw new Error('Échec du téléchargement du PDF');
      }
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le PDF. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
      setShowActionsMenu(false);
    }
  };

  // Mettre en brouillon
  const handleSaveAsDraft = async () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    try {
      setIsLoading(true);
      await reportApiService.updateReportStatus(reportId, 'draft');
      Alert.alert('Succès', 'Rapport mis en brouillon', [
        {
          text: 'OK',
          onPress: () => {
            setShowActionsMenu(false);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la mise en brouillon:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre le rapport en brouillon');
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer le rapport
  const handleDeleteReport = () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer définitivement ce rapport ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setShowActionsMenu(false),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await reportApiService.deleteReport(reportId);
              Alert.alert('Succès', 'Rapport supprimé', [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowActionsMenu(false);
                    router.replace('/(tabs)/rapports');
                  },
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

  // Retour
  const handleBack = () => {
    router.back();
  };

  // HTML pour afficher le PDF dans WebView
  const pdfHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #000;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100vh;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="${pdfUrl}" type="application/pdf"></iframe>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Rapport PDF</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowActionsMenu(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Zone PDF */}
      <View style={styles.pdfContainer}>
        {isLoading && !pdfLoaded && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Chargement du PDF...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
            <Text style={styles.errorTitle}>Erreur de chargement</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                setPdfLoaded(false);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: pdfUrl || '' }}
            style={styles.webView}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Chargement du PDF...</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Menu d'actions */}
      <Modal
        visible={showActionsMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Actions</Text>
              <TouchableOpacity
                onPress={() => setShowActionsMenu(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuContent}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleOpenInBrowser}
                activeOpacity={0.7}
              >
                <Ionicons name="open-outline" size={22} color="#006CFF" />
                <Text style={styles.menuItemText}>Ouvrir dans le navigateur</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSharePDF}
                activeOpacity={0.7}
              >
                <Ionicons name="share-outline" size={22} color="#006CFF" />
                <Text style={styles.menuItemText}>Partager</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handlePrintPDF}
                activeOpacity={0.7}
              >
                <Ionicons name="print-outline" size={22} color="#006CFF" />
                <Text style={styles.menuItemText}>Imprimer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDownloadPDF}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={22} color="#006CFF" />
                <Text style={styles.menuItemText}>Télécharger</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSaveAsDraft}
                activeOpacity={0.7}
              >
                <Ionicons name="save-outline" size={22} color="#8E8E93" />
                <Text style={[styles.menuItemText, styles.menuItemTextSecondary]}>
                  Mettre en brouillon
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteReport}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                  Supprimer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Overlay de chargement global */}
      {isLoading && (
        <View style={styles.globalLoadingOverlay}>
          <ActivityIndicator size="large" color="#006CFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#006CFF',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1A1A1A',
  },
  menuItemTextSecondary: {
    color: '#8E8E93',
  },
  menuItemTextDanger: {
    color: '#FF3B30',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  globalLoadingOverlay: {
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
});

