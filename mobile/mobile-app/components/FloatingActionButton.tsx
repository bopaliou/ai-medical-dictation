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

  // Ref animations
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current; // New Opacity animation (Native)
  const isAnimating = React.useRef(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

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

    // Boucle de pulsation subtile pour l'effet "Antigravity"
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
  }, [scaleAnim, opacityAnim, pulseAnim]);

  // Calculer la position du FAB au-dessus de la tab bar
  const getBottomPosition = () => {
    const tabBarBaseHeight = 56 + 8 + 8; // 72px base + padding
    const tabBarSafeArea = insets.bottom;
    const tabBarTotalHeight = tabBarBaseHeight + tabBarSafeArea;
    const fabSpacing = 16;
    return tabBarTotalHeight + fabSpacing;
  };

  const hiddenScreens = ['onboarding', 'login', 'signup', 'record'];
  const currentScreen = segments[0] || '';
  const shouldHide = hiddenScreens.includes(currentScreen);

  const handlePress = () => {
    if (isAnimating.current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isAnimating.current = true;

    // Animation scale (Swell)
    scaleAnim.stopAnimation(() => {
      scaleAnim.setValue(1);
      const swellAnimation = swell(scaleAnim, 1.08, ANIMATION_DURATION.FAB);
      swellAnimation.start(() => {
        isAnimating.current = false;
      });
    });

    // Animation Glow (Native Opacity)
    glowAnim.setValue(0);
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 0.6, // Semi-transparent glow
        duration: ANIMATION_DURATION.FAB / 2,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION.FAB / 2,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    } else {
      setShowPatientModal(true);
    }
  };

  const handlePatientSelected = (result: PatientSelectionResult) => {
    setShowPatientModal(false);
    const params: Record<string, string> = {
      patientId: result.patientId || '',
      skip: result.skip ? 'true' : 'false',
    };

    if (result.patientData) {
      params.patientData = JSON.stringify(result.patientData);
    }

    // Delai pour laisser l'animation de modal se terminer
    setTimeout(() => {
      router.push({
        pathname: '/record',
        params,
      } as any);
    }, 300);
  };

  if (shouldHide) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            bottom: getBottomPosition(),
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Glow Layer - Behind button */}
        <Animated.View
          style={[
            styles.button,
            {
              position: 'absolute',
              backgroundColor: theme.colors.fabBackground,
              opacity: glowAnim, // Animate transparency (Native)
              transform: [{ scale: pulseAnim }], // Pulse with button
              shadowColor: theme.colors.fabBackground,
              shadowOpacity: 0.8, // Stronger shadow for glow
              shadowRadius: 20,
              elevation: 0, // No elevation to prevent overlay issues on Android
            },
          ]}
        />

        {/* Main Button */}
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.fabBackground,
              transform: [{ scale: pulseAnim }],
              shadowColor: theme.colors.fabBackground,
              shadowOpacity: 0.3, // Normal shadow
              shadowRadius: 8,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.buttonInnerTouchable}
            onPress={handlePress}
            activeOpacity={1}
          >
            <View style={styles.buttonInner}>
              <Ionicons name="mic" size={32} color={theme.colors.fabIcon} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

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
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonInnerTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
