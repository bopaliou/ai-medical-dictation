/**
 * Système d'animations premium pour l'application médicale
 * Inspiré de : Apple Health, Notion, iOS Settings
 * Animations douces, non-distrayantes, élégantes et adaptées à un environnement hospitalier
 */

import { Animated, Easing } from 'react-native';

// ============================================
// CONSTANTES D'ANIMATION
// ============================================

export const ANIMATION_DURATION = {
  FAST: 120,
  NORMAL: 200,
  SLOW: 280,
  SCREEN_TRANSITION: 220,
  CARD_APPEAR: 240,
  BUTTON_PRESS: 150,
  TAB_BAR: 200,
  FAB: 180,
} as const;

export const ANIMATION_EASING = {
  EASE_IN_OUT: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  EASE_OUT: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  EASE_IN: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  SMOOTH: Easing.out(Easing.cubic),
} as const;

// ============================================
// ANIMATIONS DE BASE
// ============================================

/**
 * Animation fade-in simple
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL,
  delay: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: ANIMATION_EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Animation fade-out
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: ANIMATION_EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Animation slide-up (apparition depuis le bas)
 */
export const slideUp = (
  animatedValue: Animated.Value,
  distance: number = 12,
  duration: number = ANIMATION_DURATION.CARD_APPEAR,
  delay: number = 0
) => {
  animatedValue.setValue(distance);
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: ANIMATION_EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Animation slide-down
 */
export const slideDown = (
  animatedValue: Animated.Value,
  distance: number = 12,
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  return Animated.timing(animatedValue, {
    toValue: distance,
    duration,
    easing: ANIMATION_EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Animation scale (apparition avec zoom)
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  from: number = 0.85,
  to: number = 1,
  duration: number = ANIMATION_DURATION.NORMAL,
  delay: number = 0
) => {
  animatedValue.setValue(from);
  return Animated.timing(animatedValue, {
    toValue: to,
    duration,
    delay,
    easing: ANIMATION_EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

/**
 * Animation scale-out
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  to: number = 0.85,
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  return Animated.timing(animatedValue, {
    toValue: to,
    duration,
    easing: ANIMATION_EASING.EASE_IN,
    useNativeDriver: true,
  });
};

/**
 * Animation de press (scale down)
 */
export const scalePress = (
  animatedValue: Animated.Value,
  to: number = 0.96,
  duration: number = ANIMATION_DURATION.BUTTON_PRESS
) => {
  return Animated.spring(animatedValue, {
    toValue: to,
    useNativeDriver: true,
    tension: 300,
    friction: 20,
  });
};

/**
 * Animation de release (scale up)
 */
export const scaleRelease = (
  animatedValue: Animated.Value,
  to: number = 1,
  duration: number = ANIMATION_DURATION.BUTTON_PRESS
) => {
  return Animated.spring(animatedValue, {
    toValue: to,
    useNativeDriver: true,
    tension: 300,
    friction: 20,
  });
};

/**
 * Animation de swell (pour FAB)
 */
export const swell = (
  animatedValue: Animated.Value,
  peak: number = 1.08,
  duration: number = ANIMATION_DURATION.FAB
) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: peak,
      duration: duration / 2,
      easing: ANIMATION_EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration / 2,
      easing: ANIMATION_EASING.EASE_IN,
      useNativeDriver: true,
    }),
  ]);
};

// ============================================
// ANIMATIONS COMPOSÉES
// ============================================

/**
 * Animation fade + slide-up (pour les cards)
 */
export const fadeSlideUp = (
  opacity: Animated.Value,
  translateY: Animated.Value,
  distance: number = 12,
  duration: number = ANIMATION_DURATION.CARD_APPEAR,
  delay: number = 0
) => {
  opacity.setValue(0);
  translateY.setValue(distance);

  return Animated.parallel([
    fadeIn(opacity, duration, delay),
    slideUp(translateY, distance, duration, delay),
  ]);
};

/**
 * Animation fade + scale (pour les écrans)
 */
export const fadeScale = (
  opacity: Animated.Value,
  scale: Animated.Value,
  from: number = 0.98,
  duration: number = ANIMATION_DURATION.SCREEN_TRANSITION
) => {
  opacity.setValue(0);
  scale.setValue(from);

  return Animated.parallel([
    fadeIn(opacity, duration),
    scaleIn(scale, from, 1, duration),
  ]);
};

/**
 * Animation d'apparition complète (fade + slide + scale)
 */
export const appear = (
  opacity: Animated.Value,
  translateY: Animated.Value,
  scale: Animated.Value,
  distance: number = 12,
  scaleFrom: number = 0.95,
  duration: number = ANIMATION_DURATION.CARD_APPEAR,
  delay: number = 0
) => {
  opacity.setValue(0);
  translateY.setValue(distance);
  scale.setValue(scaleFrom);

  return Animated.parallel([
    fadeIn(opacity, duration, delay),
    slideUp(translateY, distance, duration, delay),
    scaleIn(scale, scaleFrom, 1, duration, delay),
  ]);
};

// ============================================
// ANIMATIONS EN CASCADE (pour les listes)
// ============================================

/**
 * Calcule le délai pour une animation en cascade
 */
export const getCascadeDelay = (
  index: number,
  baseDelay: number = 30
): number => {
  return index * baseDelay;
};

/**
 * Animation en cascade pour une liste de cards
 */
export const cascadeList = (
  animatedValues: Animated.Value[],
  distance: number = 12,
  duration: number = ANIMATION_DURATION.CARD_APPEAR,
  baseDelay: number = 30
) => {
  return animatedValues.map((value, index) => {
    const delay = getCascadeDelay(index, baseDelay);
    return fadeSlideUp(
      value,
      value, // Utiliser la même valeur pour opacity et translateY
      distance,
      duration,
      delay
    );
  });
};

// ============================================
// ANIMATIONS SPÉCIALISÉES
// ============================================

/**
 * Animation pour Tab Bar (icône active)
 */
export const tabBarAnimate = (
  scale: Animated.Value,
  opacity: Animated.Value,
  duration: number = ANIMATION_DURATION.TAB_BAR
) => {
  return Animated.parallel([
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: duration / 2,
        easing: ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration / 2,
        easing: ANIMATION_EASING.EASE_IN,
        useNativeDriver: true,
      }),
    ]),
    fadeIn(opacity, duration),
  ]);
};

/**
 * Animation pour input focus (glow effect)
 */
export const inputFocus = (
  scale: Animated.Value,
  borderColor: Animated.Value,
  duration: number = ANIMATION_DURATION.FAST
) => {
  return Animated.parallel([
    Animated.timing(scale, {
      toValue: 1.02,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(borderColor, {
      toValue: 1,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
      useNativeDriver: false, // borderColor ne peut pas utiliser native driver
    }),
  ]);
};

/**
 * Animation pour input blur
 */
export const inputBlur = (
  scale: Animated.Value,
  borderColor: Animated.Value,
  duration: number = ANIMATION_DURATION.FAST
) => {
  return Animated.parallel([
    Animated.timing(scale, {
      toValue: 1,
      duration,
      easing: ANIMATION_EASING.EASE_IN,
      useNativeDriver: true,
    }),
    Animated.timing(borderColor, {
      toValue: 0,
      duration,
      easing: ANIMATION_EASING.EASE_IN,
      useNativeDriver: false,
    }),
  ]);
};

/**
 * Animation de transition de thème (crossfade)
 */
export const themeTransition = (
  opacity: Animated.Value,
  duration: number = ANIMATION_DURATION.SLOW
) => {
  return Animated.sequence([
    Animated.timing(opacity, {
      toValue: 0,
      duration: duration / 2,
      easing: ANIMATION_EASING.EASE_IN_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: duration / 2,
      easing: ANIMATION_EASING.EASE_IN_OUT,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animation de rotation subtile (pour les icônes)
 */
export const rotate = (
  animatedValue: Animated.Value,
  from: number = 0,
  to: number = 360,
  duration: number = ANIMATION_DURATION.NORMAL
) => {
  animatedValue.setValue(from);
  return Animated.timing(animatedValue, {
    toValue: to,
    duration,
    easing: ANIMATION_EASING.EASE_IN_OUT,
    useNativeDriver: true,
  });
};

// ============================================
// HOOKS UTILITAIRES
// ============================================

// Note: Les hooks seront créés directement dans les composants qui en ont besoin

