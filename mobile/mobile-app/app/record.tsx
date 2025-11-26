/**
 * Écran d'enregistrement audio - Design Premium iOS
 * Enregistrement vocal avec timer, waveform animé et bouton STOP
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTimer } from '@/hooks/useTimer';
import { useWaveform } from '@/hooks/useWaveform';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { CreatePatientData } from '@/services/patientsApi';

const { width } = Dimensions.get('window');

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<CreatePatientData | null>(null);
  const [skip, setSkip] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Hooks
  const timer = useTimer();
  const waveform = useWaveform();
  const recorder = useAudioRecorder();

  // Récupérer les paramètres de route
  useEffect(() => {
    if (params.patientId && params.patientId !== '') {
      setPatientId(params.patientId as string);
    }
    
    if (params.skip === 'true') {
      setSkip(true);
    }
    
    if (params.patientData && params.patientData !== '') {
      try {
        const parsed = JSON.parse(params.patientData as string);
        setPatientData(parsed);
      } catch (error) {
        console.error('Erreur lors du parsing des données patient:', error);
      }
    }

    // Animation d'apparition
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [params]);

  // Démarrer automatiquement l'enregistrement une fois les permissions accordées
  useEffect(() => {
    if (recorder.hasPermission === true && !hasStarted && !recorder.isRecording) {
      console.log('🚀 Démarrage automatique de l\'enregistrement...');
      handleStartRecording();
    } else if (recorder.hasPermission === false && !hasStarted) {
      console.log('🔐 Demande de permissions...');
      recorder.requestPermissions();
    }
  }, [recorder.hasPermission, hasStarted, recorder.isRecording]);

  const handleStartRecording = async () => {
    try {
      // Demander les permissions si nécessaire
      if (recorder.hasPermission === false) {
        const granted = await recorder.requestPermissions();
        if (!granted) {
          return;
        }
      }

      // Démarrer l'enregistrement
      await recorder.startRecording();
      
      // Démarrer le timer et le waveform
      timer.start();
      waveform.start();
      setHasStarted(true);
    } catch (error: any) {
      console.error('Erreur lors du démarrage:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('🛑 Arrêt de l\'enregistrement demandé...');
      
      // Arrêter l'enregistrement
      const audioUri = await recorder.stopRecording();
      
      // Arrêter le timer et le waveform
      timer.stop();
      waveform.stop();

      if (!audioUri) {
        console.error('❌ Aucun fichier audio enregistré');
        Alert.alert(
          'Erreur',
          'Aucun fichier audio n\'a pu être récupéré. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('✅ Fichier audio récupéré:', audioUri);
      console.log('📤 Navigation vers l\'écran d\'édition...');

      // Naviguer directement vers l'écran d'édition
      // L'upload et la structuration se feront dans report/edit.tsx
      router.push({
        pathname: '/report/edit',
        params: {
          audioUri,
          patientId: patientId || '',
          skip: skip ? 'true' : 'false',
          patientData: patientData ? JSON.stringify(patientData) : '',
        },
      } as any);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'arrêt:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'arrêt de l\'enregistrement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = () => {
    if (recorder.isRecording) {
      // Si un enregistrement est en cours, demander confirmation
      Alert.alert(
        'Annuler l\'enregistrement',
        'Un enregistrement est en cours. Voulez-vous vraiment annuler ? L\'enregistrement sera perdu.',
        [
          {
            text: 'Continuer',
            style: 'cancel',
          },
          {
            text: 'Annuler',
            style: 'destructive',
            onPress: async () => {
              try {
                // Arrêter l'enregistrement
                await recorder.stopRecording();
                timer.stop();
                waveform.stop();
              } catch (error) {
                console.error('Erreur lors de l\'annulation:', error);
              }
              // Revenir au dashboard
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } else {
      // Si aucun enregistrement n'est en cours, revenir directement
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header Premium */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleCancel}
          >
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enregistrement</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              // Placeholder - non fonctionnel pour l'instant
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Zone principale centrée */}
        <View style={styles.mainArea}>
          {/* Timer */}
          <Text style={styles.timer}>{timer.formattedTime}</Text>

          {/* Bouton STOP */}
          <TouchableOpacity
            style={styles.stopButtonContainer}
            onPress={handleStopRecording}
            disabled={!recorder.isRecording}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF3B30']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.stopButton}
            >
              <Text style={styles.stopButtonText}>STOP</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Waveform animé */}
          <View style={styles.waveformContainer}>
            {waveform.bars.map((bar, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: bar.height.interpolate({
                      inputRange: [4, 100],
                      outputRange: [8, 60],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  timer: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 80,
    fontVariant: ['tabular-nums'], // Chiffres à largeur fixe
  },
  stopButtonContainer: {
    marginBottom: 60,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  stopButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  stopButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: width - 64,
    gap: 4,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#006CFF',
    borderRadius: 2,
    minHeight: 8,
  },
});
