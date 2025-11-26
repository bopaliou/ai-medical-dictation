/**
 * Floating Action Button (FAB) global - Version agrandie et améliorée
 * Bouton flottant pour "Nouvelle dictée" avec modal de sélection de patient
 * Visible sur tous les écrans sauf onboarding, login, signup, record actif
 */

import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Shadows, Spacing } from '@/constants/design';
import PatientSelectionModal, { PatientSelectionResult } from './PatientSelectionModal';

interface FloatingActionButtonProps {
  onPress?: () => void;
}

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Calculer la position du FAB au-dessus de la tab bar
  // Hauteur tab bar = 56 (base) + 8 (padding top) + 8 (padding bottom) + safeAreaBottom
  const getBottomPosition = () => {
    const tabBarBaseHeight = 56 + 8 + 8; // 72px
    const tabBarSafeArea = insets.bottom;
    const tabBarTotalHeight = tabBarBaseHeight + tabBarSafeArea;
    const fabSpacing = 16; // Espace entre FAB et tab bar
    return tabBarTotalHeight + fabSpacing;
  };

  // Écrans où le FAB ne doit pas être visible
  const hiddenScreens = ['onboarding', 'login', 'signup', 'record'];
  const currentScreen = segments[0] || '';
  const shouldHide = hiddenScreens.includes(currentScreen);

  const handlePress = () => {
    // Feedback haptique
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation de scale
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    } else {
      // Ouvrir le modal de sélection de patient
      setShowPatientModal(true);
    }
  };

  const handlePatientSelected = (result: PatientSelectionResult) => {
    setShowPatientModal(false);
    
    // Construire les paramètres de route
    const params: Record<string, string> = {
      patientId: result.patientId || '',
      skip: result.skip ? 'true' : 'false',
    };
    
    if (result.patientData) {
      params.patientData = JSON.stringify(result.patientData);
    }
    
    // Navigation vers l'écran d'enregistrement avec les paramètres
    setTimeout(() => {
      router.push({
        pathname: '/record',
        params,
      } as any);
    }, 300);
  };

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            bottom: getBottomPosition(),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.9}
          accessibilityLabel="Nouvelle dictée"
          accessibilityRole="button"
          accessibilityHint="Démarrer une nouvelle dictée médicale"
        >
          <View style={styles.buttonInner}>
            <Ionicons name="mic" size={32} color={Colors.backgroundCard} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de sélection de patient */}
      <PatientSelectionModal
        visible={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSelect={handlePatientSelected}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 72, // Agrandi de 56px à 72px
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
    // Ombre plus prononcée pour le FAB agrandi
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
