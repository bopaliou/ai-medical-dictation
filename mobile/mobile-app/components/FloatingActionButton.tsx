/**
 * Floating Action Button (FAB) global - Version agrandie et améliorée
 * Bouton flottant pour "Nouvelle dictée" avec modal de sélection de patient
 * Visible sur tous les écrans sauf onboarding, login, signup, record actif
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BorderRadius, Shadows } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import PatientSelectionModal, { PatientSelectionResult } from './PatientSelectionModal';
import { scaleIn, swell, ANIMATION_DURATION } from '@/utils/animations';

interface FloatingActionButtonProps {
  onPress?: () => void;
}

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const shadowOpacityAnim = React.useRef(new Animated.Value(0.3)).current;

  // Animation d'apparition premium : fade + scale
  useEffect(() => {
    Animated.parallel([
      scaleIn(scaleAnim, 0.85, 1, ANIMATION_DURATION.FAB),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.FAB,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

    // Arrêter toute animation en cours sur scaleAnim avant d'en démarrer une nouvelle
    scaleAnim.stopAnimation();
    // Réinitialiser la valeur à 1 avant de démarrer la nouvelle animation
    scaleAnim.setValue(1);
    
    // Animation swell premium : scale 1 → 1.08 → 1
    swell(scaleAnim, 1.08, ANIMATION_DURATION.FAB).start();
    
    // Animation de l'ombre (subtile)
    shadowOpacityAnim.stopAnimation();
    Animated.sequence([
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.5,
        duration: ANIMATION_DURATION.FAB / 2,
        useNativeDriver: false,
      }),
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.3,
        duration: ANIMATION_DURATION.FAB / 2,
        useNativeDriver: false,
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
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button, 
            { 
              backgroundColor: theme.colors.fabBackground,
              shadowOpacity: shadowOpacityAnim,
            },
          ]}
          onPress={handlePress}
          activeOpacity={1}
          accessibilityLabel="Nouvelle dictée"
          accessibilityRole="button"
          accessibilityHint="Démarrer une nouvelle dictée médicale"
        >
          <View style={styles.buttonInner}>
            <Ionicons name="mic" size={32} color={theme.colors.fabIcon} />
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
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
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
