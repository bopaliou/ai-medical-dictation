/**
 * Écran d'onboarding - Design moderne et élégant
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Onboarding1Svg, Onboarding2Svg, Onboarding3Svg } from '@/components/OnboardingIllustrations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  Illustration: React.ComponentType<{ width?: number; height?: number }>;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Gagnez du temps, soignez mieux',
    description: 'Documentez vos notes médicales en quelques secondes grâce à la dictée vocale intelligente.',
    Illustration: Onboarding1Svg,
  },
  {
    id: 2,
    title: 'Votre voix devient votre documentation',
    description: 'Enregistrez vos observations et laissez l\'IA structurer automatiquement vos notes selon le format SOAPIE.',
    Illustration: Onboarding2Svg,
  },
  {
    id: 3,
    title: 'Des notes fiables, des soins améliorés',
    description: 'Générez des PDFs professionnels et accédez à l\'historique complet de vos patients en un instant.',
    Illustration: Onboarding3Svg,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { markOnboardingAsSeen } = useOnboarding();

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await markOnboardingAsSeen();
    await new Promise(resolve => setTimeout(resolve, 100));
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.illustrationContainer}>
              <slide.Illustration
                width={SCREEN_WIDTH * 0.75}
                height={SCREEN_WIDTH * 0.75}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.indicators}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={() => {
              scrollViewRef.current?.scrollTo({
                x: (currentIndex - 1) * SCREEN_WIDTH,
                animated: true,
              });
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.nextButton,
            currentIndex === slides.length - 1 && styles.finishButton,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          {currentIndex < slides.length - 1 && (
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
    paddingBottom: 12,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#6E6E73',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingBottom: 40,
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH - 64,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#007AFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
    gap: 16,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButton: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
