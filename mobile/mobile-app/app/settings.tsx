/**
 * Écran des paramètres - Configuration de l'application
 * Design premium avec toggle Mode Sombre
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModernHeader from '@/components/ModernHeader';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { fadeIn, slideUp, ANIMATION_DURATION } from '@/utils/animations';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setThemeMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
  }, []);

  const handleToggleTheme = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTheme();
  };

  const handleSetThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setThemeMode(mode);
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.background },
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }],
        },
      ]}
    >
      <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
      <ModernHeader
        title="Paramètres"
        subtitle="Configuration de l'application"
        icon="settings"
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Apparence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Apparence</Text>
          
          {/* Toggle Mode Sombre */}
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}
            onPress={handleToggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons 
                  name={theme.resolved === 'dark' ? 'moon' : 'sunny'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Mode sombre
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {theme.resolved === 'dark' ? 'Activé' : 'Désactivé'}
                </Text>
              </View>
            </View>
            <Switch
              value={theme.resolved === 'dark'}
              onValueChange={handleToggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.backgroundCard}
              ios_backgroundColor={theme.colors.border}
            />
          </TouchableOpacity>

          {/* Options de thème */}
          <View style={[styles.themeOptions, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}>
            <TouchableOpacity
              style={[styles.themeOption, theme.mode === 'light' && styles.themeOptionActive]}
              onPress={() => handleSetThemeMode('light')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="sunny" 
                size={20} 
                color={theme.mode === 'light' ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[styles.themeOptionText, { 
                color: theme.mode === 'light' ? theme.colors.primary : theme.colors.textSecondary 
              }]}>
                Clair
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.themeOption, theme.mode === 'dark' && styles.themeOptionActive]}
              onPress={() => handleSetThemeMode('dark')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="moon" 
                size={20} 
                color={theme.mode === 'dark' ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[styles.themeOptionText, { 
                color: theme.mode === 'dark' ? theme.colors.primary : theme.colors.textSecondary 
              }]}>
                Sombre
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.themeOption, theme.mode === 'system' && styles.themeOptionActive]}
              onPress={() => handleSetThemeMode('system')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="phone-portrait" 
                size={20} 
                color={theme.mode === 'system' ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[styles.themeOptionText, { 
                color: theme.mode === 'system' ? theme.colors.primary : theme.colors.textSecondary 
              }]}>
                Système
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Informations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Version
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  1.0.0
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  themeOptions: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginTop: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

