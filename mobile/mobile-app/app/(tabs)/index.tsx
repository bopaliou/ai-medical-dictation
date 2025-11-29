/**
 * Écran Dashboard Home - Design premium médical moderne
 * Inspiré de : Apple Health, Ada Health, Notion, Calm
 * Tableau de bord épuré et professionnel pour professionnels de la santé
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PatientSelectionModal, { PatientSelectionResult } from '@/components/PatientSelectionModal';
import { notesApiService, Note } from '@/services/notesApi';
import { patientsApiService } from '@/services/patientsApi';
import { reportApiService, Report } from '@/services/reportApi';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/design';
import * as Haptics from 'expo-haptics';
import NetworkErrorBanner from '@/components/NetworkErrorBanner';
import ReportCard from '@/components/ReportCard';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeIn, slideUp, ANIMATION_DURATION } from '@/utils/animations';
import HomeHeader from '@/components/HomeHeader';

// Composant Mini-Card pour les statistiques récentes
interface StatMiniCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  theme: any;
  index: number;
  accentColor: string;
  isDate?: boolean;
  fullWidth?: boolean;
}

function StatMiniCard({ icon, label, value, theme, index, accentColor, isDate = false, fullWidth = false }: StatMiniCardProps) {
  // Initialiser avec les valeurs de départ pour l'animation
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(5)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Animation initiale rapide - Affichage immédiat et prioritaire
  React.useEffect(() => {
    const delay = index * 15; // Réduit de 80ms à 15ms pour affichage ultra-rapide
    // Pour le premier card (index 0), démarrer immédiatement sans délai visible
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150, // Réduit de 400ms à 150ms
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 150, // Réduit de 400ms à 150ms
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const isLightMode = theme.resolved === 'light';
  // Design premium selon Design System : fond blanc pur pour cartes
  const cardBg = '#FFFFFF'; // Blanc pur selon Design System - plus visible
  const iconBg = theme.colors.primaryLight; // Primary light selon Design System - plus visible

  return (
    <Animated.View
      style={[
        styles.statMiniCard,
        fullWidth && styles.fullWidthCard,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          backgroundColor: cardBg,
          borderColor: theme.colors.borderCard,
        },
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.statMiniCardContent}
      >
        <View style={[styles.statMiniIconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
        <Text
          style={[styles.statMiniValue, { color: theme.colors.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {value}
        </Text>
        <Text
          style={[styles.statMiniLabel, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Composant Date Picker Section
interface DatePickerSectionProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  allReports: Report[];
  theme: any;
  showCalendarModal: boolean;
  onShowCalendarModal: (show: boolean) => void;
  compact?: boolean;
  selectedPeriod: 'day' | '7days' | '30days' | 'thisWeek' | 'thisMonth';
  onPeriodChange: (period: 'day' | '7days' | '30days' | 'thisWeek' | 'thisMonth') => void;
}

function DatePickerSection({
  selectedDate,
  onDateChange,
  allReports,
  theme,
  showCalendarModal,
  onShowCalendarModal,
  compact = false,
  selectedPeriod,
  onPeriodChange,
}: DatePickerSectionProps) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [dateStats, setDateStats] = React.useState({
    reports: 0,
    dictations: 0,
    patients: 0,
  });
  const statsOpacity = React.useRef(new Animated.Value(0)).current;
  const statsTranslateY = React.useRef(new Animated.Value(20)).current;

  // Générer les dates pour le mini calendrier (30 jours avant et 30 jours après aujourd'hui)
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();
  const selectedIndex = dates.findIndex(
    (d) => d.toDateString() === selectedDate.toDateString()
  );

  // Calculer les statistiques pour la date sélectionnée - Optimisé pour réactivité
  React.useEffect(() => {
    // Calcul immédiat sans délai
    const stats = getStatsForDate(selectedDate, allReports);
    setDateStats(stats);

    // Animation rapide et fluide
    statsOpacity.setValue(0);
    statsTranslateY.setValue(10);
    Animated.parallel([
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(statsTranslateY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedDate, allReports]);

  // Scroll vers la date sélectionnée - Optimisé pour réactivité
  React.useEffect(() => {
    if (selectedIndex >= 0 && scrollViewRef.current) {
      // Scroll immédiat sans délai
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedIndex * 70 - 100,
          animated: true,
        });
      });
    }
  }, [selectedIndex]);

  const handleDateSelect = React.useCallback((date: Date) => {
    // Mise à jour immédiate sans délai - Priorité à la réactivité
    onDateChange(date);
    // Haptics en arrière-plan pour ne pas bloquer l'UI
    requestAnimationFrame(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }, [onDateChange]);

  const handleQuickPeriod = React.useCallback((period: string) => {
    // Mettre à jour la période sélectionnée
    if (period === 'today') {
      onPeriodChange('day');
      const today = new Date();
      handleDateSelect(today);
    } else if (period === '7days' || period === '30days' || period === 'thisWeek' || period === 'thisMonth') {
      // Mettre à jour la période sélectionnée
      onPeriodChange(period as '7days' | '30days' | 'thisWeek' | 'thisMonth');
      // Pour les périodes, on garde la date d'aujourd'hui comme référence
      const today = new Date();
      handleDateSelect(today);
    }
  }, [handleDateSelect, onPeriodChange]);

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatDayLabel = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).substring(0, 3);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <>
      <View style={[compact ? styles.datePickerSectionCompact : styles.datePickerSection, {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      }]}>
        {/* Header avec bouton Aujourd'hui */}
        <View style={styles.datePickerHeader}>
          <View style={styles.datePickerTitleContainer}>
            <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>
              Sélection de date
            </Text>
            <Text style={[styles.datePickerYear, { color: theme.colors.textSecondary }]}>
              {selectedDate.getFullYear()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.todayButton, {
              backgroundColor: selectedPeriod === 'day' ? theme.colors.primary : theme.colors.primaryLight,
              borderColor: theme.colors.primary,
            }]}
            onPress={() => handleQuickPeriod('today')}
            activeOpacity={0.7}
          >
            <Text style={[styles.todayButtonText, {
              color: selectedPeriod === 'day' ? '#FFFFFF' : theme.colors.primary,
              fontWeight: selectedPeriod === 'day' ? '600' : '500',
            }]}>
              Aujourd'hui
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mini calendrier horizontal scrollable */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScrollContent}
          style={styles.dateScrollView}
        >
          {dates.map((date, index) => {
            const selected = isSelected(date);
            const today = isToday(date);
            const scaleAnim = React.useRef(new Animated.Value(1)).current;

            React.useEffect(() => {
              if (selected) {
                Animated.spring(scaleAnim, {
                  toValue: 1.05,
                  useNativeDriver: true,
                  tension: 400,
                  friction: 8,
                }).start(() => {
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 400,
                    friction: 8,
                  }).start();
                });
              } else {
                scaleAnim.setValue(1);
              }
            }, [selected]);

            return (
              <TouchableOpacity
                key={index}
                style={styles.dateBubbleContainer}
                onPress={() => handleDateSelect(date)}
                activeOpacity={0.9}
                delayPressIn={0}
              >
                <Animated.View
                  style={[
                    styles.dateBubble,
                    {
                      transform: [{ scale: scaleAnim }],
                      backgroundColor: selected
                        ? theme.colors.primary
                        : today
                          ? theme.colors.primaryLight
                          : theme.resolved === 'light'
                            ? '#F2F4F7'
                            : '#26272B',
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.borderCard,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateBubbleDay,
                      {
                        color: selected
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {formatDayLabel(date)}
                  </Text>
                  <Text
                    style={[
                      styles.dateBubbleValue,
                      {
                        color: selected
                          ? '#FFFFFF'
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Périodes rapides */}
        <View style={styles.quickPeriodsContainer}>
          {[
            { key: '7days', label: '7 jours' },
            { key: '30days', label: '30 jours' },
            { key: 'thisWeek', label: 'Cette semaine' },
            { key: 'thisMonth', label: 'Ce mois' },
          ].map((period) => {
            const isSelected = selectedPeriod === period.key;
            return (
              <TouchableOpacity
                key={period.key}
                style={[styles.quickPeriodChip, {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.backgroundSecondary,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.borderCard,
                }]}
                onPress={() => handleQuickPeriod(period.key)}
                activeOpacity={0.8}
                delayPressIn={0}
                delayPressOut={0}
              >
                <Text style={[styles.quickPeriodText, {
                  color: isSelected ? '#FFFFFF' : theme.colors.text,
                  fontWeight: isSelected ? '600' : '500',
                }]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.calendarButton, {
              backgroundColor: theme.colors.primaryLight,
              borderColor: theme.colors.primary,
            }]}
            onPress={() => onShowCalendarModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistiques du jour sélectionné - Affichées uniquement si compact = false */}
      {!compact && (dateStats.reports > 0 || dateStats.dictations > 0 || dateStats.patients > 0) ? (
        <Animated.View
          style={[
            styles.dateStatsCard,
            {
              opacity: statsOpacity,
              transform: [{ translateY: statsTranslateY }],
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.borderCard,
            },
          ]}
        >
          <Text style={[styles.dateStatsTitle, { color: theme.colors.text }]}>
            Statistiques du {formatDateLabel(selectedDate)}
          </Text>
          <View style={styles.dateStatsGrid}>
            <View style={styles.dateStatItem}>
              <View style={[styles.dateStatIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="document-text" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.dateStatValue, { color: theme.colors.text }]}>
                {dateStats.reports}
              </Text>
              <Text style={[styles.dateStatLabel, { color: theme.colors.textSecondary }]}>
                Rapports
              </Text>
            </View>
            <View style={styles.dateStatItem}>
              <View style={[styles.dateStatIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="mic" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.dateStatValue, { color: theme.colors.text }]}>
                {dateStats.dictations}
              </Text>
              <Text style={[styles.dateStatLabel, { color: theme.colors.textSecondary }]}>
                Dictées
              </Text>
            </View>
            <View style={styles.dateStatItem}>
              <View style={[styles.dateStatIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="people" size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.dateStatValue, { color: theme.colors.text }]}>
                {dateStats.patients}
              </Text>
              <Text style={[styles.dateStatLabel, { color: theme.colors.textSecondary }]}>
                Patients
              </Text>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {/* Modal calendrier complet */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => onShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => onShowCalendarModal(false)}
        >
          <View
            style={[styles.calendarModalContent, {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.borderCard,
            }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.calendarModalHeader}>
              <Text style={[styles.calendarModalTitle, { color: theme.colors.text }]}>
                Sélectionner une date
              </Text>
              <TouchableOpacity
                onPress={() => onShowCalendarModal(false)}
                style={styles.calendarModalClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.calendarModalDates}>
              {Array.from({ length: 730 }, (_, i) => {
                // 730 jours = 2 ans (365 jours avant et 365 jours après aujourd'hui, incluant 2025)
                const date = new Date();
                date.setDate(date.getDate() - 365 + i);
                return date;
              })
                .reverse()
                .map((date, index) => {
                  const selected = isSelected(date);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.calendarModalDateItem, {
                        backgroundColor: selected
                          ? theme.colors.primaryLight
                          : 'transparent',
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.borderCard,
                      }]}
                      onPress={() => {
                        handleDateSelect(date);
                        onShowCalendarModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.calendarModalDateText, {
                        color: selected ? theme.colors.primary : theme.colors.text,
                        fontWeight: selected ? '700' : '500',
                      }]}>
                        {date.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// Fonction helper pour comparer deux dates (uniquement jour/mois/année, ignore l'heure)
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Fonction utilitaire pour calculer les stats d'une date
function getStatsForDate(date: Date, allReports: Report[]) {
  // Normaliser la date sélectionnée (ignorer l'heure)
  const selectedDateNormalized = new Date(date);
  selectedDateNormalized.setHours(0, 0, 0, 0);

  const reportsForDate = allReports.filter((report) => {
    if (!report.created_at) return false;

    // Créer une date à partir de created_at
    const reportDate = new Date(report.created_at);

    // Normaliser la date du rapport (ignorer l'heure)
    const reportDateNormalized = new Date(reportDate);
    reportDateNormalized.setHours(0, 0, 0, 0);

    // Comparer uniquement les dates (jour/mois/année)
    return isSameDay(selectedDateNormalized, reportDateNormalized);
  });

  const uniquePatients = new Set(
    reportsForDate.map((r) => r.patient_id).filter(Boolean)
  );

  return {
    reports: reportsForDate.length,
    dictations: reportsForDate.length, // Les rapports sont créés via dictées
    patients: uniquePatients.size,
  };
}

// Composant Sparkline Chart interactif avec slider
interface SparklineDataItem {
  date: Date;
  count: number;
  dateLabel: string;
}

interface InteractiveSparklineChartProps {
  data: SparklineDataItem[];
  theme: any;
}

function InteractiveSparklineChart({ data, theme }: InteractiveSparklineChartProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(data.length - 1);
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 70;
  const [sliderLayout, setSliderLayout] = React.useState({ x: 0, width: 0 });

  const selectedData = data[selectedIndex] || data[data.length - 1];
  const stepWidth = sliderLayout.width > 0 ? sliderLayout.width / (data.length - 1 || 1) : 0;
  const cursorPosition = selectedIndex * stepWidth;

  const handleBarPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIndex(index);
  };

  const handleTrackPress = (evt: any) => {
    if (sliderLayout.width > 0) {
      const relativeX = evt.nativeEvent.locationX;
      const newIndex = Math.round((relativeX / sliderLayout.width) * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, newIndex));
      if (clampedIndex !== selectedIndex) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIndex(clampedIndex);
      }
    }
  };

  return (
    <View style={[styles.sparklineContainer, { borderTopColor: theme.colors.border }]}>
      <View style={styles.sparklineHeader}>
        <Text style={[styles.sparklineLabel, { color: theme.colors.text }]}>
          Activité sur 7 jours
        </Text>
      </View>

      {/* Affichage de la date sélectionnée - Simple et clair */}
      {selectedData && (
        <View style={[styles.sparklineSelectedInfo, {
          backgroundColor: theme.colors.primaryLight,
          borderColor: theme.colors.primary,
        }]}>
          <Ionicons name="calendar" size={18} color={theme.colors.primary} />
          <View style={styles.sparklineSelectedInfoText}>
            <Text style={[styles.sparklineSelectedDate, { color: theme.colors.text }]}>
              {selectedData.dateLabel}
            </Text>
            <Text style={[styles.sparklineSelectedCount, { color: theme.colors.primary }]}>
              {selectedData.count} rapport{selectedData.count > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.sparklineWrapper}>
        {/* Graphique avec barres - Plus grandes et claires */}
        <View style={styles.sparklineBars}>
          {data.map((item, index) => {
            const barHeight = (item.count / maxValue) * chartHeight;
            const isSelected = index === selectedIndex;

            return (
              <TouchableOpacity
                key={index}
                style={styles.sparklineBarContainer}
                onPress={() => handleBarPress(index)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.sparklineBar,
                    {
                      height: Math.max(barHeight, 6),
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.primary,
                      opacity: isSelected ? 1 : (item.count > 0 ? 0.4 : 0.15),
                    },
                  ]}
                />
                {isSelected && (
                  <View style={[styles.sparklineBarIndicator, { backgroundColor: theme.colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slider track avec curseur - Simple et cliquable */}
        <TouchableOpacity
          style={styles.sparklineSliderTrack}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            setSliderLayout({ x, width });
          }}
          onPress={handleTrackPress}
          activeOpacity={1}
        >
          <View style={[styles.sparklineSliderLine, { backgroundColor: theme.colors.border }]} />
          {sliderLayout.width > 0 && (
            <View
              style={[
                styles.sparklineCursor,
                {
                  left: cursorPosition - 14,
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.backgroundCard,
                },
              ]}
            />
          )}
        </TouchableOpacity>

        {/* Labels de dates - Plus espacés */}
        <View style={styles.sparklineDatesRow}>
          {data.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleBarPress(index)}
              activeOpacity={0.7}
              style={styles.sparklineDateButton}
            >
              <Text
                style={[
                  styles.sparklineDateLabel,
                  {
                    color: index === selectedIndex ? theme.colors.primary : theme.colors.textMuted,
                    fontWeight: index === selectedIndex ? '700' : '500',
                  },
                ]}
              >
                {item.dateLabel.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// Composant RecentReportItem supprimé - Utilisation de ReportCard à la place

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showPatientModal, setShowPatientModal] = useState(false);

  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
  }, []);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final' | 'trash'>('all');
  const [networkError, setNetworkError] = useState<string | null>(null);

  const firstName = user?.full_name?.split(' ')[0] || '';

  // Flag pour éviter les requêtes multiples simultanées (utilise des clés pour différencier les types de chargement)
  const isLoadingRef = React.useRef<string | false>(false);

  const loadRecentReports = async () => {
    // Utiliser un ref séparé pour éviter les conflits avec loadStatistics
    const reportsLoadingKey = 'reports';
    if (isLoadingRef.current && isLoadingRef.current !== reportsLoadingKey) {
      console.log('⏸️ Autre requête en cours, attente...');
      // Attendre un peu et réessayer
      setTimeout(() => {
        loadRecentReports();
      }, 500);
      return;
    }

    try {
      isLoadingRef.current = reportsLoadingKey as string;
      setIsLoadingNotes(true);
      setNetworkError(null);
      // Charger tous les rapports récents (tous statuts) et les trier par date
      const reportsResponse = await reportApiService.getReports({ limit: 50 });
      if (reportsResponse.ok && reportsResponse.reports) {
        // Trier par date de création (plus récent en premier)
        const sortedReports = [...reportsResponse.reports].sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        setRecentReports(sortedReports);
        // Ne pas mettre à jour allReports ici - cela sera fait dans loadStatistics
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des rapports récents:', error);
      setRecentReports([]);

      // Afficher un message d'erreur clair si c'est une erreur réseau
      if (error.message && error.message.includes('Impossible de se connecter')) {
        setNetworkError(error.message);
      }
    } finally {
      setIsLoadingNotes(false);
      isLoadingRef.current = false;
    }
  };

  const loadStatistics = async () => {
    // Utiliser un ref séparé pour éviter les conflits avec loadRecentReports
    const statsLoadingKey = 'stats';
    if (isLoadingRef.current && isLoadingRef.current !== statsLoadingKey) {
      console.log('⏸️ Autre requête en cours, attente...');
      // Attendre un peu et réessayer
      setTimeout(() => {
        loadStatistics();
      }, 500);
      return;
    }

    try {
      isLoadingRef.current = statsLoadingKey as string;
      setIsLoadingStats(true);
      setNetworkError(null);
      console.log('📊 Chargement des statistiques...');

      // Charger le nombre de patients
      const patients = await patientsApiService.getAllPatients();
      setTotalPatients(patients.length);
      console.log('👥 Patients chargés:', patients.length);

      // Charger TOUS les rapports pour les statistiques (pas seulement les 50 récents)
      // Cela permet d'avoir des statistiques précises pour toutes les périodes
      const reportsResponse = await reportApiService.getReports({ limit: 1000 });
      if (reportsResponse.ok && reportsResponse.reports) {
        setAllReports(reportsResponse.reports);
        console.log('📋 Rapports chargés pour statistiques:', reportsResponse.reports.length);
      } else {
        console.log('⚠️ Aucun rapport trouvé ou réponse invalide');
        setAllReports([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      setTotalPatients(0);
      setAllReports([]); // S'assurer que allReports est un tableau vide en cas d'erreur

      // Afficher un message d'erreur clair si c'est une erreur réseau
      if (error.message && error.message.includes('Impossible de se connecter')) {
        setNetworkError(error.message);
        // Ne pas afficher d'alerte ici car elle sera déjà affichée par loadRecentReports
      }
    } finally {
      setIsLoadingStats(false);
      isLoadingRef.current = false; // Réinitialiser le ref pour permettre les prochaines requêtes
      console.log('✅ Chargement des statistiques terminé');
    }
  };


  // Calculer les statistiques détaillées pour la section premium - Toutes les données
  const calculateDetailedStats = React.useMemo(() => {
    // Utiliser tous les rapports sans filtrage de période
    const reportsForPeriod = allReports || []; // S'assurer que c'est toujours un tableau

    console.log('📊 Calcul des statistiques avec', reportsForPeriod.length, 'rapports');

    // Rapports finalisés pour la période
    const finalizedReports = reportsForPeriod.filter(report =>
      report.status === 'final'
    ).length;

    // Brouillons en cours pour la période
    const draftReports = reportsForPeriod.filter(report =>
      report.status === 'draft'
    ).length;

    // Nouveaux patients pour la période
    const newPatientsForPeriod = new Set(
      reportsForPeriod
        .filter(report => report.patient_id)
        .map(report => report.patient_id)
    ).size;

    const stats = {
      reportsThisWeek: reportsForPeriod.length,
      finalizedReports,
      draftReports,
      newPatientsThisWeek: newPatientsForPeriod,
    };

    console.log('📊 Statistiques calculées:', stats);

    return stats;
  }, [allReports]);

  // Filtrer les rapports récents par statut uniquement
  const filteredRecentReports = React.useMemo(() => {
    if (statusFilter === 'all') {
      return recentReports;
    }
    return recentReports.filter(report => report.status === statusFilter);
  }, [recentReports, statusFilter]);

  useEffect(() => {
    // Charger les données au montage avec un petit délai pour éviter les requêtes multiples
    const timer = setTimeout(() => {
      console.log('🚀 Initialisation du chargement des données...');
      // Charger les statistiques en premier car elles sont plus importantes
      loadStatistics();
      // Charger les rapports récents après un court délai
      setTimeout(() => {
        loadRecentReports();
      }, 300);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Attendre un court délai avant de charger pour éviter les requêtes multiples au focus
      const timer = setTimeout(() => {
        console.log('🔄 Rechargement des données au focus...');
        // Charger les statistiques en premier
        loadStatistics();
        // Charger les rapports récents après un court délai
        setTimeout(() => {
          loadRecentReports();
        }, 300);
      }, 300); // Délai de 300ms pour éviter les requêtes multiples

      return () => clearTimeout(timer);
    }, [])
  );

  const handleReportPress = (report: Report) => {
    if (!report.pdf_url) {
      Alert.alert(
        'Rapport non disponible',
        'Ce rapport n\'a pas encore été généré. Veuillez générer le PDF depuis l\'écran d\'édition.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (report.id) {
      router.push({
        pathname: '/report/details' as any,
        params: { reportId: report.id },
      });
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

    setTimeout(() => {
      router.push({
        pathname: '/record',
        params,
      } as any);
    }, 300);
  };

  const handleNewDictation = () => {
    setShowPatientModal(true);
  };

  const handleViewReports = () => {
    router.push('/(tabs)/rapports' as any);
  };

  const handleViewAllPatients = () => {
    router.push('/(tabs)/patients' as any);
  };

  const handleRetryConnection = () => {
    loadRecentReports();
    loadStatistics();
  };

  return (
    <Animated.View
      style={[
        { flex: 1 },
        {
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }],
        },
      ]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />

        {/* Header KadduCare - Fixe en haut */}
        <HomeHeader
          user={user}
          onMenuPress={() => console.log('Menu pressed')}
          onProfilePress={() => router.push('/(tabs)/settings' as any)}
        />

        {/* Bannière d'erreur réseau élégante */}
        <NetworkErrorBanner
          message={networkError || ''}
          visible={!!networkError}
          onDismiss={() => setNetworkError(null)}
          onRetry={handleRetryConnection}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            networkError && { paddingTop: 200 }, // Espace pour la bannière d'erreur
          ]}
          showsVerticalScrollIndicator={false}
        >

          {/* Section Statistiques récentes - Premium et épurée selon Design System */}
          {isLoadingStats ? (
            <View style={[styles.recentStatsSection, {
              backgroundColor: '#FFFFFF',
              borderColor: theme.colors.borderCard,
              minHeight: 200,
              justifyContent: 'center',
              alignItems: 'center',
            }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted, marginTop: Spacing.md }]}>
                Chargement des statistiques...
              </Text>
            </View>
          ) : (
            <View style={[styles.recentStatsSection, {
              backgroundColor: '#FFFFFF', // Blanc pur selon Design System - plus visible
              borderColor: theme.colors.borderCard,
            }]}>
              <View style={styles.recentStatsHeader}>
                <View style={styles.recentStatsTitleRow}>
                  <View style={[styles.recentStatsIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="stats-chart" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={styles.recentStatsTitleContainer}>
                    <Text style={[styles.recentStatsTitle, { color: theme.colors.text }]}>
                      Statistiques récentes
                    </Text>
                    <Text style={[styles.recentStatsSubtitle, { color: theme.colors.textMuted }]}>
                      Synthèse de vos activités de dictée
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Total rapports - Pleine largeur en haut */}
              <View style={styles.fullWidthCardContainer}>
                <StatMiniCard
                  icon="calendar"
                  label="Total des rapports"
                  value={calculateDetailedStats.reportsThisWeek}
                  theme={theme}
                  index={0}
                  accentColor={theme.colors.primary}
                  fullWidth={true}
                />
              </View>

              {/* Mini-cards de statistiques - Alignées 2 par 2 */}
              <View style={styles.statsGrid}>
                <StatMiniCard
                  icon="checkmark-circle"
                  label="Rapports finalisés"
                  value={calculateDetailedStats.finalizedReports}
                  theme={theme}
                  index={1}
                  accentColor="#34C759"
                />
                <StatMiniCard
                  icon="create-outline"
                  label="Brouillons en cours"
                  value={calculateDetailedStats.draftReports}
                  theme={theme}
                  index={2}
                  accentColor="#FF9500"
                />
              </View>

              <View style={styles.statsGrid}>
                <StatMiniCard
                  icon="people"
                  label="Patients uniques"
                  value={calculateDetailedStats.newPatientsThisWeek}
                  theme={theme}
                  index={3}
                  accentColor="#5AC8FA"
                />
              </View>

            </View>
          )}


          {/* Section Rapports récents */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rapports récents</Text>
              {filteredRecentReports.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/rapports' as any)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.seeAllText}>Tout voir</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filtres par statut */}
            <View style={styles.filterContainer}>
              {(['all', 'final', 'draft', 'trash'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: statusFilter === status ? theme.colors.primary : theme.colors.backgroundCard,
                      borderColor: statusFilter === status ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setStatusFilter(status)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: statusFilter === status ? theme.colors.backgroundCard : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {status === 'all'
                      ? 'Tous'
                      : status === 'final'
                        ? 'Finalisés'
                        : status === 'draft'
                          ? 'Brouillons'
                          : 'Corbeille'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {isLoadingNotes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
              </View>
            ) : filteredRecentReports.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.backgroundCard }]}>
                  <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  {statusFilter === 'all'
                    ? 'Aucun rapport récent'
                    : `Aucun rapport ${statusFilter === 'final' ? 'finalisé' : statusFilter === 'draft' ? 'en brouillon' : 'dans la corbeille'}`}
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>Créez votre première dictée</Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {filteredRecentReports.map((report, index) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onPress={() => handleReportPress(report)}
                    index={index}
                    showPatientName={true}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <PatientSelectionModal
          visible={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          onSelect={handlePatientSelected}
        />
      </SafeAreaView>
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
    padding: Spacing.xl,
    paddingBottom: 140, // Espace pour le FAB
  },
  // Section de bienvenue premium
  welcomeSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.section,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    ...Typography.h1,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body, // 16px, 400 weight selon Design System
    fontSize: 16,
    fontWeight: '400',
    marginTop: Spacing.xs,
    lineHeight: 24,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  // Filtres
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipActive: {
    // Styles dynamiques appliqués dans le composant
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '600',
  },
  // Section Statistiques récentes premium - Design épuré selon Design System
  recentStatsSection: {
    borderRadius: BorderRadius.card, // 20px selon Design System
    padding: Spacing.md, // 12px - réduit de 20px
    marginBottom: Spacing.lg, // 16px - réduit de 32px
    marginHorizontal: Spacing.screenPadding, // 24px selon Design System
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.lg, // Ombre plus visible selon Design System
    backgroundColor: '#FFFFFF', // Blanc pur selon Design System
    // borderColor appliqué dynamiquement
  },
  recentStatsHeader: {
    marginBottom: Spacing.sm, // 8px - réduit de 12px
  },
  recentStatsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md, // 12px
  },
  recentStatsIconContainer: {
    width: 40, // Réduit de 48px
    height: 40,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
  },
  recentStatsTitleContainer: {
    flex: 1,
  },
  recentStatsTitle: {
    ...Typography.subtitle, // 18px, 500 weight selon Design System
    fontSize: 16, // Réduit de 18px
    fontWeight: '600', // Semi-bold pour titre de section
    letterSpacing: -0.1,
    marginBottom: 0, // Supprimé
    // color appliqué dynamiquement
  },
  recentStatsSubtitle: {
    ...Typography.caption, // 12px, 400 weight selon Design System
    fontSize: 11, // Réduit de 12px
    fontWeight: '400',
    letterSpacing: 0.2,
    marginTop: 2, // Petit espacement
    // color appliqué dynamiquement
  },
  fullWidthCardContainer: {
    width: '100%',
    marginBottom: Spacing.xs / 2, // Réduit de Spacing.xs
  },
  fullWidthCard: {
    width: '100%',
    maxWidth: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2, // Réduit de Spacing.xs
    paddingHorizontal: 0,
  },
  statMiniCard: {
    flex: 1,
    borderRadius: BorderRadius.card, // 20px selon Design System
    padding: Spacing.md, // 12px - réduit de 20px
    borderWidth: 1,
    minHeight: 100, // Réduit de 140px
    ...Shadows.lg, // Ombre plus visible selon Design System
    backgroundColor: '#FFFFFF', // Blanc pur selon Design System
    // borderColor appliqué dynamiquement
  },
  statMiniCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.xs, // Réduit de Spacing.sm
  },
  statMiniIconContainer: {
    width: 36, // Réduit de 48px
    height: 36,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs, // Réduit de Spacing.md
    // backgroundColor appliqué dynamiquement
  },
  statMiniValue: {
    ...Typography.number, // 28px, 700 weight selon Design System
    fontSize: 24, // Réduit de 28px
    fontWeight: '700',
    marginBottom: 0, // Supprimé
    letterSpacing: -0.5,
    textAlign: 'center',
    width: '100%',
    // color appliqué dynamiquement
  },
  statMiniLabel: {
    ...Typography.labelSmall, // 13px, 500 weight selon Design System
    fontSize: 12, // Réduit de 13px
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
    width: '100%',
    // color appliqué dynamiquement
  },
  // Sparkline Chart interactif
  sparklineContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    // borderTopColor appliqué dynamiquement
  },
  sparklineHeader: {
    marginBottom: Spacing.md,
  },
  sparklineLabel: {
    fontSize: 16,
    fontWeight: '700',
    // color appliqué dynamiquement
  },
  sparklineSelectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  sparklineSelectedInfoText: {
    flex: 1,
  },
  sparklineSelectedDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
    // color appliqué dynamiquement
  },
  sparklineSelectedCount: {
    fontSize: 14,
    fontWeight: '700',
    // color appliqué dynamiquement
  },
  sparklineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  sparklineBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: 80,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  sparklineBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: Spacing.xs,
    position: 'relative',
  },
  sparklineBar: {
    width: 36,
    borderRadius: 18,
    minHeight: 6,
    // height, backgroundColor et opacity appliqués dynamiquement
  },
  sparklineBarIndicator: {
    position: 'absolute',
    top: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor appliqué dynamiquement
  },
  sparklineSliderTrack: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
  },
  sparklineSliderLine: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    // backgroundColor appliqué dynamiquement
  },
  sparklineCursor: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    top: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    // left, backgroundColor et borderColor appliqués dynamiquement
  },
  sparklineDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sparklineDateButton: {
    flex: 1,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  sparklineDateLabel: {
    fontSize: 13,
    // color et fontWeight appliqués dynamiquement
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  // Sections
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Medical Cards - Design moderne et informatif
  cardsList: {
    gap: Spacing.md,
  },
  // États
  loadingContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    // color appliqué dynamiquement
    marginTop: Spacing.md,
  },
  emptyContainer: {
    padding: 64, // Spacing.xxxl * 2 (32 * 2)
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    // backgroundColor appliqué dynamiquement
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    // borderColor appliqué dynamiquement
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
  // Date Picker Section
  datePickerSection: {
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  datePickerSectionCompact: {
    padding: 0,
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  datePickerTitleContainer: {
    flex: 1,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs / 2,
    // color appliqué dynamiquement
  },
  datePickerYear: {
    fontSize: 14,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  todayButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  dateScrollView: {
    marginBottom: Spacing.md,
  },
  dateScrollContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  dateBubbleContainer: {
    marginRight: Spacing.sm,
  },
  dateBubble: {
    width: 60,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    // backgroundColor, borderColor et borderWidth appliqués dynamiquement
  },
  dateBubbleDay: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
    // color appliqué dynamiquement
  },
  dateBubbleValue: {
    fontSize: 20,
    fontWeight: '700',
    // color appliqué dynamiquement
  },
  quickPeriodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickPeriodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  quickPeriodText: {
    fontSize: 13,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor et borderColor appliqués dynamiquement
  },
  // Date Stats Card
  dateStatsCard: {
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    marginHorizontal: Spacing.xl,
    borderWidth: 1,
    // backgroundColor, borderColor, opacity et transform appliqués dynamiquement
  },
  dateStatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
    // color appliqué dynamiquement
  },
  dateStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  dateStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    // backgroundColor appliqué dynamiquement
  },
  dateStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
    // color appliqué dynamiquement
  },
  dateStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  // Calendar Modal
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    // backgroundColor et borderColor appliqués dynamiquement
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  calendarModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    // color appliqué dynamiquement
  },
  calendarModalClose: {
    padding: Spacing.xs,
  },
  calendarModalDates: {
    maxHeight: 400,
  },
  calendarModalDateItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  calendarModalDateText: {
    fontSize: 15,
    // color et fontWeight appliqués dynamiquement
  },
});
