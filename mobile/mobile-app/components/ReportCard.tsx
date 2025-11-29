/**
 * Composant ReportCard réutilisable - Design uniforme pour tous les écrans
 * Utilisé dans Home, Rapports et autres écrans
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '@/services/reportApi';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeSlideUp, scalePress, scaleRelease, getCascadeDelay, ANIMATION_DURATION } from '@/utils/animations';
import { Spacing, BorderRadius, Shadows, Typography } from '@/constants/design';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onShare?: () => void;
  onMenu?: () => void;
  index?: number;
  showPatientName?: boolean; // Option pour afficher ou non le nom du patient
}

export default function ReportCard({
  report,
  onPress,
  onShare,
  onMenu,
  index = 0,
  showPatientName = false,
}: ReportCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(12)).current;

  // Animation d'apparition premium : fade + slide-up avec délai en cascade
  React.useEffect(() => {
    const delay = getCascadeDelay(index, 40);
    fadeSlideUp(opacityAnim, translateYAnim, 12, ANIMATION_DURATION.CARD_APPEAR, delay).start();
  }, []);

  // Animations de press premium
  const handlePressIn = () => {
    scalePress(scaleAnim, 0.96).start();
  };

  const handlePressOut = () => {
    scaleRelease(scaleAnim, 1).start();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'final':
        return {
          color: theme.colors.success,
          bgColor: theme.colors.successLight,
          label: 'Finalisé',
          icon: 'checkmark-circle' as const,
        };
      case 'draft':
        return {
          color: theme.colors.warning,
          bgColor: theme.colors.warningLight,
          label: 'Brouillon',
          icon: 'document-text' as const,
        };
      case 'trash':
        return {
          color: theme.colors.error,
          bgColor: theme.colors.errorLight,
          label: 'Corbeille',
          icon: 'trash' as const,
        };
      default:
        return {
          color: theme.colors.textMuted,
          bgColor: theme.colors.backgroundSecondary,
          label: status,
          icon: 'ellipse' as const,
        };
    }
  };

  const getReportSummary = (report: Report): string => {
    const soapie = (report as any).structured_json?.soapie || report.soapie;
    
    // Priorité 1: Motif de consultation
    if (soapie?.S) {
      const s = String(soapie.S).trim();
      return s.length > 100 ? s.substring(0, 100) + '...' : s;
    }
    
    // Priorité 2: Évaluation clinique
    if (soapie?.A) {
      const a = String(soapie.A).trim();
      return a.length > 100 ? a.substring(0, 100) + '...' : a;
    }
    
    // Priorité 3: Plan de soins
    if (soapie?.P) {
      const p = String(soapie.P).trim();
      return p.length > 100 ? p.substring(0, 100) + '...' : p;
    }
    
    // Par défaut: Texte générique
    return 'Note médicale de consultation';
  };

  const getReportTitle = (): string => {
    const soapie = (report as any).structured_json?.soapie || report.soapie;
    
    // Priorité 1: Utiliser le motif de consultation pour un titre descriptif
    if (soapie?.S) {
      const s = String(soapie.S).trim();
      // Prendre jusqu'à 100 caractères pour un titre complet et visible
      if (s.length <= 100) {
        return s;
      } else {
        return s.substring(0, 97) + '...';
      }
    }
    
    // Priorité 2: Utiliser l'évaluation clinique si disponible
    if (soapie?.A) {
      const a = String(soapie.A).trim();
      if (a.length <= 100) {
        return a;
      } else {
        return a.substring(0, 97) + '...';
      }
    }
    
    // Priorité 3: Utiliser le plan de soins si disponible
    if (soapie?.P) {
      const p = String(soapie.P).trim();
      if (p.length <= 100) {
        return p;
      } else {
        return p.substring(0, 97) + '...';
      }
    }
    
    // Priorité 4: Nom du patient si disponible
    if (report.patient?.full_name) {
      return `Consultation - ${report.patient.full_name}`;
    }
    
    // Par défaut: Titre générique mais informatif
    return 'Rapport de consultation médicale';
  };

  const statusConfig = getStatusConfig(report.status || 'final');
  const summary = getReportSummary(report);
  const title = getReportTitle();

  // Extraire les signes vitaux uniquement
  const soapie = (report as any).structured_json?.soapie || report.soapie;
  const vitals = soapie?.O?.vitals;

  // Vérifier si des signes vitaux sont disponibles
  const hasVitals = vitals && (
    (vitals.temperature && vitals.temperature.trim() !== '') ||
    (vitals.blood_pressure && vitals.blood_pressure.trim() !== '') ||
    (vitals.heart_rate && vitals.heart_rate.trim() !== '') ||
    (vitals.respiratory_rate && vitals.respiratory_rate.trim() !== '') ||
    (vitals.spo2 && vitals.spo2.trim() !== '') ||
    (vitals.glycemia && vitals.glycemia.trim() !== '')
  );

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.reportCard, { 
          backgroundColor: theme.colors.backgroundCard, 
          borderColor: theme.colors.borderCard 
        }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
      >
        {/* Contenu principal avec alignement cohérent */}
        <View style={styles.cardContent}>
          {/* Section principale du contenu */}
          <View style={styles.cardMainContent}>
            {/* Header avec badges alignés */}
            <View style={styles.cardHeaderTop}>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                <Ionicons name={statusConfig.icon} size={11} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
              {report.pdf_url && (
                <View style={[styles.pdfIndicatorSmall, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="document-text" size={11} color={theme.colors.primary} />
                  <Text style={[styles.pdfTextSmall, { color: theme.colors.primary }]}>PDF</Text>
                </View>
              )}
            </View>

            {/* Titre principal - Aligné à gauche, bien visible */}
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={3}>
              {title}
            </Text>

            {/* Informations patient - Design compact et aligné */}
            {report.patient?.full_name && (
              <View style={[styles.patientInfo, { 
                backgroundColor: theme.colors.primaryLight, 
                borderColor: theme.colors.primary + '20' 
              }]}>
                <View style={[styles.patientIconWrapper, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="person" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.patientDetails}>
                  <Text style={[styles.patientName, { color: theme.colors.text }]} numberOfLines={1}>
                    {report.patient.full_name}
                  </Text>
                  {(report.patient.age || report.patient.room_number || report.patient.unit) && (
                    <View style={styles.patientMeta}>
                      {report.patient.age && (
                        <View style={styles.patientMetaItem}>
                          <Ionicons name="calendar-outline" size={11} color={theme.colors.textMuted} />
                          <Text style={[styles.patientMetaText, { color: theme.colors.textSecondary }]}>{report.patient.age}</Text>
                        </View>
                      )}
                      {report.patient.room_number && (
                        <View style={styles.patientMetaItem}>
                          <Ionicons name="bed-outline" size={11} color={theme.colors.textMuted} />
                          <Text style={[styles.patientMetaText, { color: theme.colors.textSecondary }]}>Ch. {report.patient.room_number}</Text>
                        </View>
                      )}
                      {report.patient.unit && (
                        <View style={styles.patientMetaItem}>
                          <Ionicons name="business-outline" size={11} color={theme.colors.textMuted} />
                          <Text style={[styles.patientMetaText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{report.patient.unit}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Signes vitaux uniquement */}
            {hasVitals && (
              <View style={styles.vitalsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pulse" size={14} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Signes vitaux</Text>
                </View>
                <View style={styles.vitalsGrid}>
                  {vitals.temperature && vitals.temperature.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="thermometer" size={14} color="#FF9500" />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
                        {vitals.temperature.trim()}{!vitals.temperature.includes('°') && '°C'}
                      </Text>
                    </View>
                  )}
                  {vitals.blood_pressure && vitals.blood_pressure.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="pulse" size={14} color="#FF3B30" />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>{vitals.blood_pressure.trim()}</Text>
                    </View>
                  )}
                  {vitals.heart_rate && vitals.heart_rate.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="heart" size={14} color="#FF3B30" />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
                        {vitals.heart_rate.trim()}{!vitals.heart_rate.toLowerCase().includes('bpm') && ' bpm'}
                      </Text>
                    </View>
                  )}
                  {vitals.respiratory_rate && vitals.respiratory_rate.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="fitness" size={14} color="#5AC8FA" />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
                        {vitals.respiratory_rate.trim()}{!vitals.respiratory_rate.includes('/') && ' /min'}
                      </Text>
                    </View>
                  )}
                  {vitals.spo2 && vitals.spo2.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="water" size={14} color={theme.colors.primary} />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
                        SpO₂ {vitals.spo2.trim()}{!vitals.spo2.includes('%') && '%'}
                      </Text>
                    </View>
                  )}
                  {vitals.glycemia && vitals.glycemia.trim() !== '' && (
                    <View style={[styles.vitalItem, { 
                      backgroundColor: theme.colors.backgroundSecondary, 
                      borderColor: theme.colors.border 
                    }]}>
                      <Ionicons name="flask" size={14} color="#FF9500" />
                      <Text style={[styles.vitalValue, { color: theme.colors.text }]}>
                        {vitals.glycemia.trim()}{!vitals.glycemia.toLowerCase().includes('g/l') && ' g/L'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

          </View>

          {/* Footer avec date - Toujours en bas */}
          <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
            <View style={styles.cardDateContainer}>
              <Ionicons name="time-outline" size={13} color={theme.colors.textMuted} />
              <Text style={[styles.cardDate, { color: theme.colors.textMuted }]}>{formatDate(report.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Actions rapides - Alignées verticalement à droite */}
        {report.pdf_url && (onShare || onMenu) && (
          <View style={styles.cardActions}>
            {onShare && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.actionButtonInner, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            {onMenu && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onMenu();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={[styles.actionButtonInner, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: Spacing.screenPadding, // 24px selon Design System
    marginBottom: Spacing.lg, // 16px selon Design System
  },
  reportCard: {
    borderRadius: BorderRadius.card, // 20px selon Design System
    padding: Spacing.cardPadding, // 20px selon Design System
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    ...Shadows.lg, // Ombre plus visible selon Design System
    backgroundColor: '#FFFFFF', // Blanc pur selon Design System
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    width: '100%',
  },
  cardMainContent: {
    flex: 1,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm, // 8px
    paddingVertical: 6,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    gap: Spacing.xs, // 4px
    alignSelf: 'flex-start',
  },
  statusText: {
    ...Typography.captionSmall, // 11px, 400 weight selon Design System
    fontSize: 11,
    fontWeight: '600', // Semi-bold pour badges
    letterSpacing: 0.2,
  },
  pdfIndicatorSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs, // 4px
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: BorderRadius.badge, // 12px selon Design System
    alignSelf: 'flex-start',
  },
  pdfTextSmall: {
    ...Typography.captionSmall, // 11px selon Design System
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    ...Typography.h4, // 20px, 600 weight selon Design System
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
    marginBottom: Spacing.md, // 12px
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md, // 12px
    paddingVertical: Spacing.sm + 2, // 10px
    paddingHorizontal: Spacing.md, // 12px
    borderRadius: BorderRadius.input, // 12px selon Design System
    borderWidth: 1,
  },
  patientIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  patientDetails: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    ...Typography.bodySmall, // 15px, 400 weight selon Design System
    fontSize: 15,
    fontWeight: '600', // Semi-bold pour nom
    marginBottom: Spacing.sm, // 8px
    letterSpacing: -0.1,
  },
  patientMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  patientMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  patientMetaText: {
    ...Typography.caption, // 12px, 400 weight selon Design System
    fontSize: 12,
    fontWeight: '500',
  },
  vitalsSection: {
    marginBottom: Spacing.md, // 12px
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2, // 6px
    marginBottom: Spacing.sm + 2, // 10px
  },
  sectionTitle: {
    ...Typography.labelSmall, // 13px, 500 weight selon Design System
    fontSize: 13,
    fontWeight: '600', // Semi-bold pour titre de section
    letterSpacing: 0.1,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: -10,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 7,
    paddingHorizontal: Spacing.md, // 12px
    paddingVertical: Spacing.sm, // 8px
    borderRadius: BorderRadius.input, // 12px selon Design System (arrondi à 10px pour cohérence)
    borderWidth: 1,
    width: '48%',
    marginBottom: Spacing.sm + 2, // 10px
  },
  vitalValue: {
    ...Typography.labelSmall, // 13px, 500 weight selon Design System
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.md, // 12px
    borderTopWidth: 1,
    marginTop: Spacing.xs, // 4px
  },
  cardDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardDate: {
    ...Typography.caption, // 12px, 400 weight selon Design System
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
    paddingTop: 0,
    alignSelf: 'flex-start',
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  actionButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
});

