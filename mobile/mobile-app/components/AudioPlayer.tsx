/**
 * Composant Audio Player Premium
 * Lecteur audio élégant avec Play/Pause et barre de progression
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

interface AudioPlayerProps {
  audioUri: string;
  onError?: (error: string) => void;
}

export default function AudioPlayer({ audioUri, onError }: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const player = useAudioPlayer(audioUri, {
    updateInterval: 100, // Mises à jour toutes les 100ms pour une barre fluide
  });
  const status = useAudioPlayerStatus(player);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status.isLoaded) {
      setIsLoading(false);
    }
  }, [status.isLoaded]);

  // Animer la barre de progression
  useEffect(() => {
    if (status.duration > 0) {
      const progress = status.currentTime / status.duration;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [status.currentTime, status.duration]);

  const togglePlayPause = () => {
    if (status.isLoaded) {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de l'audio...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.playerCard}>
        {/* Bouton Play/Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          activeOpacity={0.7}
        >
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Zone de progression */}
        <View style={styles.progressContainer}>
          {/* Barre de progression totale */}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Temps */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {formatTime(status.currentTime)}
            </Text>
            <Text style={styles.timeSeparator}>/</Text>
            <Text style={styles.timeText}>
              {formatTime(status.duration || 0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#006CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  progressContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#006CFF',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 13,
    color: '#8E8E93',
    marginHorizontal: 4,
  },
});

