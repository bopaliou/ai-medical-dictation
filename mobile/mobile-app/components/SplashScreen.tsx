/**
 * Splash Screen Premium KadduCare
 * Écran d'ouverture professionnel et élégant
 * Design cohérent avec le Brand Kit KadduCare
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import KadduCareLogo from './KadduCareLogo';
import { Typography } from '@/constants/design';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export default function SplashScreen({ onFinish, duration = 2500 }: SplashScreenProps) {
  const { theme } = useTheme();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée du logo
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(logoScale, {
          toValue: 1.05,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1.0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 0.5,
        duration: 1000,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Transition vers l'écran suivant
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) {
          onFinish();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  // Couleurs du dégradé KadduCare - Bleu médical premium
  const gradientColors = theme.resolved === 'dark'
    ? ['#0D1B2A', '#1A3A5C', '#0A84FF']
    : ['#E8F1FF', '#D0E5FF', '#B8D9FF', '#A0CDFF'];

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeOut,
          backgroundColor: gradientColors[0], // Fond identique au splash natif pour transition fluide
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, StyleSheet.absoluteFill]}
      >
        {/* Logo centré avec animation */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <KadduCareLogo size={120} />
          </Animated.View>
        </View>

        {/* Texte KadduCare en bas */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={[styles.brandText, { color: theme.colors.text }]}>
            KadduCare
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000, // Z-index très élevé pour être au-dessus de tout
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandText: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
    opacity: 0.45,
  },
});

