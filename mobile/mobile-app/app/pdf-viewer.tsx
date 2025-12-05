/**
 * PDFPreviewScreen - Écran de visualisation PDF complet
 * Design premium iOS moderne avec toutes les actions nécessaires
 * Compatible Expo Router
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { reportApiService } from '@/services/reportApi';
import axios from 'axios';

export default function PDFPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const webViewRef = useRef<WebView>(null);

  // Paramètres reçus via expo-router
  const initialPdfUrl = (params.pdf_url || params.pdfUrl) as string;
  const reportId = (params.report_id || params.reportId) as string;

  // États
  const [pdfUrl, setPdfUrl] = useState<string>(initialPdfUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

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

  const handleError = async (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Erreur WebView:', nativeEvent);

    // Si l'erreur est liée au bucket (404), essayer de régénérer l'URL (publique ou signée)
    if (nativeEvent?.description?.includes('404') || nativeEvent?.description?.includes('Bucket Not found') || nativeEvent?.description?.includes('Bucket not found')) {
      console.log('🔄 Erreur 404 détectée, tentative de régénération de l\'URL...');

      if (reportId) {
        try {
          setIsLoading(true);
          const newSignedUrl = await reportApiService.regenerateSignedUrl(reportId);
          console.log('✅ Nouvelle URL obtenue, rechargement du PDF...');

          // Mettre à jour l'URL et recharger
          setPdfUrl(newSignedUrl);
          setError(null);

          // Recharger le WebView avec la nouvelle URL
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        } catch (regenerateError: any) {
          console.error('❌ Erreur lors de la régénération de l\'URL:', regenerateError);
          setIsLoading(false);
          setError('Impossible de charger le PDF. Erreur: ' + (regenerateError.message || 'URL invalide'));
        }
      } else {
        setIsLoading(false);
        setError('Impossible de charger le PDF. Bucket non trouvé.');
      }
    } else {
      setIsLoading(false);
      setError('Impossible de charger le PDF');
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
      setIsActionLoading(true);
      console.log('📥 Téléchargement du PDF pour partage...');

      // Assurer que le répertoire de documents existe
      if (!FileSystem.documentDirectory) {
        throw new Error('Répertoire de documents non disponible');
      }

      const fileName = `rapport-share-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      console.log('📥 Résultat du téléchargement:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
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
      Alert.alert(
        'Erreur',
        error.message?.includes('téléchargement')
          ? 'Impossible de télécharger le PDF. Vérifiez votre connexion et les permissions de stockage.'
          : 'Impossible de partager le PDF. Vérifiez votre connexion.'
      );
    } finally {
      setIsActionLoading(false);
      setShowActionsMenu(false);
    }
  };

  /**
   * Ouvrir le PDF dans le navigateur externe
   */
  const handleOpenInBrowser = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('🌐 Ouverture du PDF dans le navigateur:', pdfUrl);

      await WebBrowser.openBrowserAsync(pdfUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
        controlsColor: '#006CFF',
      });

      console.log('✅ PDF ouvert dans le navigateur');
      setShowActionsMenu(false);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ouverture:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF dans le navigateur');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Imprimer le PDF via expo-print
   */
  const handlePrintPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('🖨️ Impression du PDF:', pdfUrl);

      // Vérifier que l'impression est disponible
      // Note: Print.isAvailableAsync n'est pas disponible dans toutes les versions/plateformes
      /*
      const isAvailable = await Print.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Information',
          'L\'impression n\'est pas disponible sur cet appareil. Veuillez utiliser "Ouvrir dans le navigateur" pour imprimer depuis le navigateur.'
        );
        setIsActionLoading(false);
        setShowActionsMenu(false);
        return;
      }
      */

      // Vérifier que le répertoire de documents existe
      const documentDir = FileSystem.documentDirectory;
      if (!documentDir) {
        throw new Error('Répertoire de documents non disponible');
      }

      // Utiliser l'URL actuelle ou régénérer si nécessaire
      let finalPdfUrl = pdfUrl;

      // Si on a un reportId et que l'URL semble expirée, essayer de la régénérer
      if (reportId && (pdfUrl.includes('expires=') || pdfUrl.includes('signature='))) {
        try {
          console.log('🔄 Vérification de l\'URL signée...');
          const newSignedUrl = await reportApiService.regenerateSignedUrl(reportId);
          finalPdfUrl = newSignedUrl;
          setPdfUrl(newSignedUrl); // Mettre à jour l'URL pour les prochaines utilisations
          console.log('✅ URL signée régénérée pour l\'impression');
        } catch (regenerateError) {
          console.warn('⚠️ Impossible de régénérer l\'URL, utilisation de l\'URL actuelle:', regenerateError);
          // Continuer avec l'URL actuelle
        }
      }

      // Télécharger le PDF temporairement pour l'impression
      const fileName = `rapport-print-${Date.now()}.pdf`;
      const fileUri = `${documentDir}${fileName}`;

      console.log('📥 Téléchargement du PDF pour impression...');
      console.log('   URL source:', finalPdfUrl);
      console.log('   Destination:', fileUri);

      // Télécharger avec timeout et meilleure gestion d'erreur
      // Méthode 1: Essayer FileSystem.downloadAsync (plus rapide pour les URLs publiques)
      let downloadResult;
      try {
        const downloadPromise = FileSystem.downloadAsync(finalPdfUrl, fileUri);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: Le téléchargement a pris trop de temps (>30s)')), 30000)
        );

        downloadResult = await Promise.race([downloadPromise, timeoutPromise]) as Awaited<ReturnType<typeof FileSystem.downloadAsync>>;
      } catch (downloadError: any) {
        // Si FileSystem.downloadAsync échoue, essayer avec axios (pour les URLs nécessitant des headers)
        console.warn('⚠️ FileSystem.downloadAsync a échoué, tentative avec axios:', downloadError.message);

        try {
          // Télécharger avec axios (gère mieux les headers d'authentification)
          const response = await axios.get(finalPdfUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
              'Accept': 'application/pdf',
            },
          });

          // Convertir ArrayBuffer en base64 (méthode compatible React Native)
          const arrayBuffer = response.data;
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);

          // Écrire le fichier en base64
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Créer un objet downloadResult compatible
          downloadResult = {
            status: response.status,
            uri: fileUri,
            headers: response.headers as any,
          };

          console.log('✅ PDF téléchargé avec axios');
        } catch (axiosError: any) {
          console.error('❌ Erreur axios:', axiosError);
          // Si axios échoue aussi, relancer l'erreur originale
          throw downloadError;
        }
      }

      console.log('📥 Résultat du téléchargement:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
        headers: downloadResult.headers,
      });

      // Vérifier que le téléchargement a réussi
      if (downloadResult.status !== 200) {
        throw new Error(`Échec du téléchargement du PDF (status: ${downloadResult.status})`);
      }

      if (!downloadResult.uri) {
        throw new Error('URI du fichier téléchargé non disponible');
      }

      // Vérifier que le fichier existe et a une taille valide
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      console.log('📄 Informations du fichier:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Le fichier téléchargé n\'existe pas');
      }

      if (fileInfo.size === 0) {
        throw new Error('Le fichier téléchargé est vide');
      }

      console.log('🖨️ Impression du fichier:', downloadResult.uri);
      console.log('   Taille du fichier:', fileInfo.size, 'bytes');

      // Lancer l'impression
      const printResult = await Print.printAsync({
        uri: downloadResult.uri,
        html: undefined, // Utiliser uniquement l'URI, pas de HTML
      });

      console.log('✅ Impression lancée:', printResult);

      // Nettoyer le fichier temporaire après impression (optionnel)
      // On peut le laisser pour permettre une réimpression rapide

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      console.error('   Stack:', error.stack);

      // Messages d'erreur plus précis
      let errorMessage = 'Impossible d\'imprimer le PDF.';

      if (error.message?.includes('téléchargement') || error.message?.includes('download')) {
        errorMessage = 'Impossible de télécharger le PDF. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message?.includes('connexion') || error.message?.includes('connection') || error.message?.includes('network')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Le téléchargement a pris trop de temps. Vérifiez votre connexion et réessayez.';
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = 'Le PDF n\'a pas été trouvé. Il a peut-être été supprimé ou l\'URL a expiré.';
      } else if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('unauthorized')) {
        errorMessage = 'Vous n\'êtes pas autorisé à accéder à ce PDF. Veuillez vous reconnecter.';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      Alert.alert('Erreur d\'impression', errorMessage, [
        {
          text: 'Réessayer',
          onPress: () => handlePrintPDF(),
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]);
    } finally {
      setIsActionLoading(false);
      setShowActionsMenu(false);
    }
  };

  /**
   * Télécharger le PDF localement
   */
  const handleDownloadPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Erreur', 'URL du PDF non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('📥 Téléchargement du PDF:', pdfUrl);

      const fileName = `rapport-${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      console.log('📥 Destination:', fileUri);
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      console.log('📥 Résultat du téléchargement:', {
        status: downloadResult.status,
        uri: downloadResult.uri,
      });

      if (downloadResult.status === 200 && downloadResult.uri) {
        console.log('✅ PDF téléchargé avec succès:', downloadResult.uri);
        Alert.alert(
          'Succès',
          'PDF téléchargé avec succès dans le dossier Documents',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(`Échec du téléchargement du PDF (status: ${downloadResult.status})`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du téléchargement:', error);
      Alert.alert(
        'Erreur',
        error.message?.includes('téléchargement')
          ? 'Impossible de télécharger le PDF. Vérifiez votre connexion et les permissions de stockage.'
          : 'Impossible de télécharger le PDF. Vérifiez votre connexion.'
      );
    } finally {
      setIsActionLoading(false);
      setShowActionsMenu(false);
    }
  };

  /**
   * Mettre le rapport en brouillon → PATCH /api/reports/:report_id { status: "draft" }
   */
  const handleSaveAsDraft = async () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('📝 Mise en brouillon du rapport:', reportId);

      await reportApiService.updateReportStatus(reportId, 'draft');

      console.log('✅ Rapport mis en brouillon');
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
      console.error('❌ Erreur lors de la mise en brouillon:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre le rapport en brouillon');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Finaliser le rapport → PATCH /api/reports/:report_id { status: "final" }
   */
  const handleFinalize = async () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    try {
      setIsActionLoading(true);
      console.log('✅ Finalisation du rapport:', reportId);

      await reportApiService.updateReportStatus(reportId, 'final');

      console.log('✅ Rapport finalisé');
      Alert.alert('Succès', 'Rapport finalisé', [
        {
          text: 'OK',
          onPress: () => {
            setShowActionsMenu(false);
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Erreur lors de la finalisation:', error);
      Alert.alert('Erreur', error.message || 'Impossible de finaliser le rapport');
    } finally {
      setIsActionLoading(false);
    }
  };

  /**
   * Supprimer le rapport → DELETE /api/reports/:report_id
   * Redirige vers /reports après suppression
   */
  const handleDeleteReport = () => {
    if (!reportId) {
      Alert.alert('Erreur', 'ID du rapport non disponible');
      return;
    }

    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer définitivement ce rapport ? Cette action supprimera aussi le PDF et l\'audio associés.',
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
              setIsActionLoading(true);
              console.log('🗑️ Suppression du rapport:', reportId);

              await reportApiService.deleteReport(reportId);

              console.log('✅ Rapport supprimé avec succès');
              Alert.alert('Succès', 'Rapport supprimé définitivement', [
                {
                  text: 'OK',
                  onPress: () => {
                    setShowActionsMenu(false);
                    // Rediriger vers l'écran des rapports
                    router.replace('/(tabs)/rapports');
                  },
                },
              ]);
            } catch (error: any) {
              console.error('❌ Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le rapport');
            } finally {
              setIsActionLoading(false);
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

  // HTML optimisé pour afficher le PDF dans WebView
  const pdfHtml = pdfUrl ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #000;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
          }
          iframe {
            width: 100%;
            height: 100vh;
            border: none;
            display: block;
          }
          .error {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <iframe src="${pdfUrl}" type="application/pdf"></iframe>
      </body>
    </html>
  ` : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header Premium iOS */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Aperçu PDF</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSharePDF}
            activeOpacity={0.7}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowActionsMenu(true)}
            activeOpacity={0.7}
            disabled={isActionLoading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
        ) : pdfUrl ? (
          <WebView
            ref={webViewRef}
            source={{
              uri: pdfUrl,
              headers: {
                'Accept': 'application/pdf',
              }
            }}
            style={styles.webView}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={async (syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Erreur HTTP WebView:', nativeEvent);

              // Si erreur 400 ou 404, essayer de régénérer l'URL signée
              if ((nativeEvent.statusCode === 400 || nativeEvent.statusCode === 404) && reportId) {
                console.log(`🔄 Erreur ${nativeEvent.statusCode} détectée, tentative de régénération de l'URL signée...`);

                try {
                  setIsLoading(true);
                  const newSignedUrl = await reportApiService.regenerateSignedUrl(reportId);
                  console.log('✅ Nouvelle URL signée obtenue, rechargement du PDF...');

                  // Mettre à jour l'URL et recharger
                  setPdfUrl(newSignedUrl);
                  setError(null);

                  // Recharger le WebView avec la nouvelle URL
                  if (webViewRef.current) {
                    webViewRef.current.reload();
                  }
                } catch (regenerateError: any) {
                  console.error('❌ Erreur lors de la régénération de l\'URL:', regenerateError);
                  setIsLoading(false);
                  setError(`Erreur ${nativeEvent.statusCode}: Impossible de charger le PDF. ${regenerateError.message || 'URL invalide'}`);
                }
              } else {
                setIsLoading(false);
                setError(`Erreur ${nativeEvent.statusCode}: Impossible de charger le PDF`);
              }
            }}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            cacheEnabled={true}
            incognito={false}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Chargement du PDF...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="document-outline" size={64} color="#8E8E93" />
            <Text style={styles.errorTitle}>PDF non disponible</Text>
            <Text style={styles.errorText}>L'URL du PDF n'a pas été fournie</Text>
          </View>
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

            <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
              {/* Actions PDF */}
              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Actions PDF</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleOpenInBrowser}
                  activeOpacity={0.7}
                  disabled={isActionLoading}
                >
                  <Ionicons name="open-outline" size={22} color="#006CFF" />
                  <Text style={styles.menuItemText}>Ouvrir dans le navigateur</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSharePDF}
                  activeOpacity={0.7}
                  disabled={isActionLoading}
                >
                  <Ionicons name="share-outline" size={22} color="#006CFF" />
                  <Text style={styles.menuItemText}>Partager</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handlePrintPDF}
                  activeOpacity={0.7}
                  disabled={isActionLoading}
                >
                  <Ionicons name="print-outline" size={22} color="#006CFF" />
                  <Text style={styles.menuItemText}>Imprimer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleDownloadPDF}
                  activeOpacity={0.7}
                  disabled={isActionLoading}
                >
                  <Ionicons name="download-outline" size={22} color="#006CFF" />
                  <Text style={styles.menuItemText}>Télécharger</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuDivider} />

              {/* Gestion du rapport */}
              {reportId && (
                <>
                  <View style={styles.menuSection}>
                    <Text style={styles.menuSectionTitle}>Gestion du rapport</Text>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleSaveAsDraft}
                      activeOpacity={0.7}
                      disabled={isActionLoading}
                    >
                      <Ionicons name="document-text-outline" size={22} color="#8E8E93" />
                      <Text style={[styles.menuItemText, styles.menuItemTextSecondary]}>
                        Mettre en brouillon
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleFinalize}
                      activeOpacity={0.7}
                      disabled={isActionLoading}
                    >
                      <Ionicons name="checkmark-circle-outline" size={22} color="#34C759" />
                      <Text style={[styles.menuItemText, { color: '#34C759' }]}>
                        Finaliser
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleDeleteReport}
                      activeOpacity={0.7}
                      disabled={isActionLoading}
                    >
                      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                      <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                        Supprimer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Overlay de chargement global pour les actions */}
      {isActionLoading && (
        <View style={styles.globalLoadingOverlay}>
          <ActivityIndicator size="large" color="#006CFF" />
          <Text style={styles.loadingOverlayText}>Traitement en cours...</Text>
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    gap: 12,
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
});

