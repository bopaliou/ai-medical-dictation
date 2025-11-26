/**
 * Hook pour animer un waveform (barres verticales animées)
 */

import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const BAR_COUNT = 20; // Nombre de barres dans le waveform
const MIN_HEIGHT = 4; // Hauteur minimale des barres (%)
const MAX_HEIGHT = 100; // Hauteur maximale des barres (%)

export interface WaveformBar {
  height: Animated.Value;
  delay: number;
}

export interface UseWaveformReturn {
  bars: WaveformBar[];
  isAnimating: boolean;
  start: () => void;
  stop: () => void;
}

export function useWaveform(): UseWaveformReturn {
  const [bars, setBars] = useState<WaveformBar[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // Initialiser les barres avec des hauteurs et délais aléatoires
  useEffect(() => {
    const initialBars: WaveformBar[] = Array.from({ length: BAR_COUNT }, (_, i) => ({
      height: new Animated.Value(MIN_HEIGHT),
      delay: i * 50, // Délai progressif pour effet cascade
    }));
    setBars(initialBars);
  }, []);

  const start = () => {
    if (isAnimating || bars.length === 0) return;
    setIsAnimating(true);

    // Créer des animations pour chaque barre
    animationsRef.current = bars.map((bar) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(bar.delay),
          Animated.timing(bar.height, {
            toValue: MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT),
            duration: 200 + Math.random() * 300, // Durée variable entre 200-500ms
            useNativeDriver: false, // height n'est pas supporté par useNativeDriver
          }),
          Animated.timing(bar.height, {
            toValue: MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT),
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      );
    });

    // Démarrer toutes les animations
    animationsRef.current.forEach((anim) => anim.start());
  };

  const stop = () => {
    setIsAnimating(false);
    
    // Arrêter toutes les animations
    animationsRef.current.forEach((anim) => anim.stop());
    animationsRef.current = [];

    // Réinitialiser les hauteurs à MIN_HEIGHT avec animation douce
    bars.forEach((bar) => {
      Animated.timing(bar.height, {
        toValue: MIN_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  };

  return {
    bars,
    isAnimating,
    start,
    stop,
  };
}

