/**
 * Hook pour gérer l'enregistrement audio avec Expo Audio
 */

import { useState, useEffect } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { Alert } from 'react-native';
import type { AudioRecorder, RecorderState } from 'expo-audio';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingUri: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  requestPermissions: () => Promise<boolean>;
  hasPermission: boolean | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // Créer un preset personnalisé pour enregistrer en WAV (format privilégié)
  // Configuration optimisée pour WAV avec les paramètres requis par Whisper
  // Configuration "Gold Standard" pour la dictée vocale AI (Whisper/Gemini)
  // Format: AAC (m4a) @ 64kbps, 16kHz, Mono
  // Optimisations: Voice Communication (Echo Cancellation, Noise Suppression)
  const customPreset = {
    ...RecordingPresets.HIGH_QUALITY,
    android: {
      extension: '.m4a',
      outputFormat: 2, // MPEG_4
      audioEncoder: 3, // AAC
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000, // 64 kbps (suffisant pour la voix, upload rapide)
      // Source 7 = VOICE_COMMUNICATION (Active Echo Cancellation & Noise Suppression)
      audioSource: 7,
    },
    ios: {
      extension: '.m4a',
      outputFormat: 'mpeg4aac', // kAudioFormatMPEG4AAC
      audioQuality: 3, // High
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm;codecs=opus',
      bitsPerSecond: 64000,
    },
  } as any;

  // Créer le recorder avec le hook expo-audio
  const recorder = useExpoAudioRecorder(customPreset, (status) => {
    // Callback pour les mises à jour de statut
    console.log('📊 Statut de l\'enregistrement:', {
      isRecording: (status as any).isRecording,
      isFinished: status.isFinished,
      url: status.url,
      hasError: status.hasError,
      error: status.error,
    });

    if (status.isFinished && status.url) {
      console.log('✅ Enregistrement terminé, URI:', status.url);
      setRecordingUri(status.url);
    }
    if (status.hasError && status.error) {
      console.error('❌ Erreur dans le callback:', status.error);
      setError(status.error);
    }
  });

  // Utiliser le hook pour obtenir l'état en temps réel
  const recorderState: RecorderState = useAudioRecorderState(recorder, 500);

  // Vérifier les permissions au montage
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permissions = await getRecordingPermissionsAsync();
      setHasPermission(permissions.granted || false);
    } catch (err) {
      console.error('Erreur lors de la vérification des permissions:', err);
      setHasPermission(false);
    }
  };

  const requestPermissionsAsync = async (): Promise<boolean> => {
    try {
      const permissions = await requestRecordingPermissionsAsync();
      const granted = permissions.granted || false;
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Permission requise',
          'L\'accès au microphone est nécessaire pour enregistrer des dictées. Veuillez autoriser l\'accès dans les paramètres de l\'application.',
          [{ text: 'OK' }]
        );
      }

      return granted;
    } catch (err) {
      console.error('Erreur lors de la demande de permissions:', err);
      setHasPermission(false);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Démarrage de l\'enregistrement...');
      setError(null);
      setRecordingUri(null);

      // Vérifier les permissions
      if (hasPermission === false) {
        console.log('🔐 Demande de permissions...');
        const granted = await requestPermissionsAsync();
        if (!granted) {
          throw new Error('Permission microphone refusée');
        }
      }

      // Configurer le mode audio pour l'enregistrement
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: false,
      });

      // Préparer l'enregistrement avec les options AAC (Optimisé AI)
      console.log('📝 Préparation de l\'enregistrement (AAC 16kHz)...');
      console.log('📋 Configuration:', {
        sampleRate: 16000,
        channels: 1,
        bitRate: 64000,
        source: 'Voice Communication (Echo/Noise Filter)'
      });
      await recorder.prepareToRecordAsync();

      // Démarrer l'enregistrement
      console.log('▶️ Démarrage effectif...');
      recorder.record();
      console.log('✅ Enregistrement démarré');
    } catch (err: any) {
      console.error('❌ Erreur lors du démarrage de l\'enregistrement:', err);
      setError(err.message || 'Erreur lors du démarrage de l\'enregistrement');

      if (err.message?.includes('permission')) {
        Alert.alert(
          'Permission requise',
          'L\'accès au microphone est nécessaire. Veuillez autoriser l\'accès dans les paramètres.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (!recorderState.isRecording) {
        console.warn('⚠️ Tentative d\'arrêt alors qu\'aucun enregistrement n\'est en cours');
        return null;
      }

      console.log('🛑 Arrêt de l\'enregistrement...');

      // Arrêter l'enregistrement
      await recorder.stop();

      // Attendre que l'enregistrement soit terminé et que l'URI soit disponible
      // On attend jusqu'à 2 secondes maximum
      let uri: string | null = null;
      const maxWait = 2000; // 2 secondes
      const checkInterval = 100; // Vérifier toutes les 100ms
      let waited = 0;

      while (waited < maxWait && !uri) {
        // Vérifier si l'URI est disponible dans le callback (via recordingUri)
        if (recordingUri) {
          uri = recordingUri;
          break;
        }

        // Vérifier aussi directement sur le recorder
        try {
          const recorderUri = (recorder as any).uri;
          if (recorderUri) {
            uri = recorderUri;
            break;
          }
        } catch (e) {
          // Ignorer les erreurs d'accès à l'URI
        }

        // Attendre avant de vérifier à nouveau
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      // Réinitialiser le mode audio
      await setAudioModeAsync({
        allowsRecording: false,
      });

      if (uri) {
        console.log('✅ URI de l\'enregistrement récupérée:', uri);
        const isM4a = uri.toLowerCase().endsWith('.m4a');
        console.log('📁 Format détecté:', isM4a ? 'AAC/M4A ✅' : 'Autre format (sera converti par le backend)');
        setRecordingUri(uri);
        return uri;
      }

      console.error('❌ Aucune URI disponible après l\'arrêt de l\'enregistrement');
      console.log('État du recorder:', {
        isRecording: recorderState.isRecording,
        recordingUri,
        recorderUri: (recorder as any).uri,
      });

      return null;
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'arrêt de l\'enregistrement:', err);
      setError(err.message || 'Erreur lors de l\'arrêt de l\'enregistrement');
      return null;
    }
  };

  return {
    isRecording: recorderState.isRecording,
    recordingUri,
    error,
    startRecording,
    stopRecording,
    requestPermissions: requestPermissionsAsync,
    hasPermission,
  };
}
