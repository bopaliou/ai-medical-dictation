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
import ModernHeader from '@/components/ModernHeader';

import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';

const { width } = Dimensions.get('window');

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<CreatePatientData | null>(null);
  const [skip, setSkip] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Hooks
  const timer = useTimer();
  const waveform = useWaveform();
  const recorder = useAudioRecorder();

  // ... (Keep useEffect logic same as before, just omitting for brevity if I could, but I must replace the whole component to be safe or use partials carefully. I will include the unchanged useEffects to be safe)

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
      if (recorder.hasPermission === false) {
        const granted = await recorder.requestPermissions();
        if (!granted) return;
      }
      await recorder.startRecording();
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
      const audioUri = await recorder.stopRecording();
      timer.stop();
      waveform.stop();

      if (!audioUri) {
        Alert.alert('Erreur', 'Aucun fichier audio n\'a pu être récupéré.', [{ text: 'OK' }]);
        return;
      }

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
      Alert.alert('Erreur', 'Une erreur est survenue.', [{ text: 'OK' }]);
    }
  };

  const handleCancel = () => {
    if (recorder.isRecording) {
      Alert.alert(
        'Annuler l\'enregistrement',
        'Voulez-vous vraiment annuler ? L\'enregistrement sera perdu.',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Annuler',
            style: 'destructive',
            onPress: async () => {
              try {
                await recorder.stopRecording();
                timer.stop();
                waveform.stop();
              } catch (error) { }
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ModernHeader
          title="Enregistrement"
          subtitle="Dictée vocale médicale"
          icon="mic"
          onBackPress={handleCancel}
        />

        <View style={styles.mainArea}>
          {/* Timer - Typography Moderne */}
          <Text style={[styles.timer, { color: theme.colors.text }]}>
            {timer.formattedTime}
          </Text>

          {/* Bouton STOP - Design Elegant */}
          <TouchableOpacity
            style={[styles.stopButtonContainer, {
              shadowColor: theme.colors.error
            }]}
            onPress={handleStopRecording}
            disabled={!recorder.isRecording}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.error, theme.colors.error + 'D0'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.stopButton, { borderColor: theme.colors.background }]}
            >
              <View style={styles.stopIcon} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.stopLabel, { color: theme.colors.textSecondary }]}>
            Appuyez pour terminer
          </Text>

          {/* Waveform animé - Dynamic Colors */}
          <View style={styles.waveformContainer}>
            {waveform.bars.map((bar, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    backgroundColor: index % 2 === 0 ? theme.colors.primary : theme.colors.success, // Alternance Bleu/Vert
                    height: bar.height.interpolate({
                      inputRange: [4, 100],
                      outputRange: [6, 50], // Amplitude ajustée
                    }),
                    opacity: bar.height.interpolate({
                      inputRange: [4, 100],
                      outputRange: [0.3, 1], // Opacité dynamique
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  timer: {
    ...Typography.numberLarge,
    fontSize: 48, // Très grand pour lisibilité
    fontWeight: '300', // Light font for modern look
    marginBottom: Spacing.xxxxxl,
    fontVariant: ['tabular-nums'],
  },
  stopButtonContainer: {
    marginBottom: Spacing.md,
    ...Shadows.floating,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  stopButton: {
    width: 90, // Plus petit, plus élégant
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  stopLabel: {
    ...Typography.label,
    marginBottom: Spacing.xxxxl,
    opacity: 0.8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: width - 64,
    gap: 5,
  },
  waveformBar: {
    width: 5,
    borderRadius: 3,
    minHeight: 6,
  },
});
