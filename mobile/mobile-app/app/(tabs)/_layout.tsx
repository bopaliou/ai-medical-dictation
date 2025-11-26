/**
 * Tab Bar Layout - Design premium médical moderne
 * Inspiré de : Apple Health, Notion, Calm, Ada Health
 * Tab bar élégante, épurée et professionnelle
 */

import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import FloatingActionButton from '@/components/FloatingActionButton';
import { Colors, Shadows, BorderRadius } from '@/constants/design';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Couleurs premium pour la tab bar
const TAB_BAR_COLORS = {
  background: '#FFFFFF',
  backgroundBlur: '#F8FAFC',
  active: '#0A84FF',
  inactive: '#9CA3AF',
  textActive: '#0A84FF',
  textInactive: '#6B7280',
  border: '#E5E7EB',
};

// Composant d'icône animée pour la tab bar
function AnimatedTabIcon({ 
  name, 
  focused, 
  size = 26 
}: { 
  name: keyof typeof Ionicons.glyphMap; 
  focused: boolean; 
  size?: number;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons 
        name={name} 
        size={size} 
        color={focused ? TAB_BAR_COLORS.active : TAB_BAR_COLORS.inactive} 
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // Calculer le padding bottom en tenant compte uniquement de la safe area
  // Le FAB est positionné au-dessus de la tab bar, donc pas besoin d'espace supplémentaire
  const getPaddingBottom = () => {
    const basePadding = 8; // Padding de base minimal
    const safeAreaBottom = insets.bottom; // Safe area insets (boutons système Android)
    
    // Sur Android, on doit ajouter la safe area pour les boutons système
    // Sur iOS, la safe area est déjà gérée mais on l'ajoute quand même pour cohérence
    if (Platform.OS === 'android') {
      // Sur Android, minimum 8px si pas de boutons système, sinon utiliser la safe area
      return basePadding + Math.max(safeAreaBottom, 8);
    } else {
      // Sur iOS, utiliser la safe area (généralement 34px sur iPhone avec encoche)
      return basePadding + safeAreaBottom;
    }
  };

  // Calculer la hauteur totale de la tab bar
  const getTabBarHeight = () => {
    const baseHeight = 56; // Hauteur de base (icônes + labels) - réduite
    const paddingTop = 8;
    const paddingBottom = getPaddingBottom();
    return baseHeight + paddingTop + paddingBottom;
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: TAB_BAR_COLORS.textActive,
          tabBarInactiveTintColor: TAB_BAR_COLORS.textInactive,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: TAB_BAR_COLORS.background,
            borderTopWidth: 0.5,
            borderTopColor: TAB_BAR_COLORS.border,
            height: getTabBarHeight(),
            paddingTop: 8,
            paddingBottom: getPaddingBottom(),
            paddingHorizontal: 8,
            elevation: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
            letterSpacing: 0.2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon 
                name={focused ? 'home' : 'home-outline'} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="rapports"
          options={{
            title: 'Rapports',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon 
                name={focused ? 'document-text' : 'document-text-outline'} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon 
                name={focused ? 'people' : 'people-outline'} 
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon 
                name={focused ? 'person' : 'person-outline'} 
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
      <FloatingActionButton />
    </View>
  );
}
