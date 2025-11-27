/**
 * Bannière d'erreur réseau élégante et moderne
 * Design premium médical inspiré de Apple Health, Notion
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';
import * as Haptics from 'expo-haptics';

interface NetworkErrorBannerProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  visible: boolean;
}

export default function NetworkErrorBanner({
  message,
  onDismiss,
  onRetry,
  visible,
}: NetworkErrorBannerProps) {
  const slideAnim = React.useRef(new Animated.Value(-200)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Extraire les points de vérification du message
  const lines = message.split('\n');
  const title = lines[0] || 'Erreur de connexion';
  const checkPoints = lines.slice(1).filter(line => line.trim().startsWith('•'));
  const urlLine = lines.find(line => line.includes('URL configurée'));

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onRetry) {
      onRetry();
    }
    onDismiss();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.banner}>
        {/* Icône et titre */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline" size={24} color={Colors.error} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Points de vérification */}
        {checkPoints.length > 0 && (
          <View style={styles.checkPointsContainer}>
            {checkPoints.map((point, index) => (
              <View key={index} style={styles.checkPoint}>
                <Ionicons
                  name="ellipse"
                  size={4}
                  color={Colors.textSecondary}
                  style={styles.bullet}
                />
                <Text style={styles.checkPointText}>
                  {point.replace('•', '').trim()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* URL configurée */}
        {urlLine && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>URL configurée :</Text>
            <Text style={styles.urlText} numberOfLines={1}>
              {urlLine.split(':').slice(1).join(':').trim()}
            </Text>
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          {onRetry && (
            <TouchableOpacity
              onPress={handleRetry}
              style={styles.retryButton}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  banner: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.text,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  checkPointsContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bullet: {
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  checkPointText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  urlContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  urlLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  urlText: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
    gap: Spacing.xs,
  },
  retryButtonText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dismissButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

