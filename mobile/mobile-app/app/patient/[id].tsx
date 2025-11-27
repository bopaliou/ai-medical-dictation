/**
 * Page de détail du patient avec possibilité de modification
 * Design premium médical moderne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { patientsApiService, Patient, CreatePatientData } from '@/services/patientsApi';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { fadeIn, slideUp, inputFocus, inputBlur, ANIMATION_DURATION } from '@/utils/animations';

export default function PatientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<CreatePatientData | null>(null);
  
  // Animations d'écran : fade + slide-up
  const screenOpacity = React.useRef(new Animated.Value(0)).current;
  const screenTranslateY = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      fadeIn(screenOpacity, ANIMATION_DURATION.SCREEN_TRANSITION),
      slideUp(screenTranslateY, 20, ANIMATION_DURATION.SCREEN_TRANSITION),
    ]).start();
  }, []);

  // État du formulaire
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    age: '',
    gender: '',
    room_number: '',
    unit: '',
    dob: '',
  });

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setIsLoading(true);
      const foundPatient = await patientsApiService.getPatientById(id);
      
      if (!foundPatient) {
        Alert.alert('Erreur', 'Patient non trouvé', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      setPatient(foundPatient);
      const initialData = {
        full_name: foundPatient.full_name || '',
        age: foundPatient.age || '',
        gender: foundPatient.gender || '',
        room_number: foundPatient.room_number || '',
        unit: foundPatient.unit || '',
        dob: foundPatient.dob || '',
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement du patient:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger le patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!patient) return;

    // Validation
    if (!formData.full_name || formData.full_name.trim().length === 0) {
      Alert.alert('Erreur', 'Le nom du patient est requis');
      return;
    }

    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updatedPatient = await patientsApiService.updatePatient(patient.id, formData);
      setPatient(updatedPatient);
      
      // Mettre à jour les données originales après sauvegarde
      setOriginalFormData({ ...formData });
      setHasChanges(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Patient modifié avec succès', [{ text: 'OK' }]);
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier le patient');
    } finally {
      setIsSaving(false);
    }
  };

  // Vérifier si des changements ont été faits
  const checkForChanges = (newData: CreatePatientData) => {
    if (!originalFormData) return false;
    return (
      newData.full_name !== originalFormData.full_name ||
      newData.age !== originalFormData.age ||
      newData.gender !== originalFormData.gender ||
      newData.room_number !== originalFormData.room_number ||
      newData.unit !== originalFormData.unit ||
      newData.dob !== originalFormData.dob
    );
  };

  const handleFieldChange = (field: keyof CreatePatientData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setHasChanges(checkForChanges(newData));
  };

  const handleCancel = () => {
    if (!originalFormData) return;
    setFormData({ ...originalFormData });
    setHasChanges(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Patient non trouvé</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.colors.primary }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      {/* Header moderne et élégant */}
      <View
        style={[
          styles.headerGradient, 
          { 
            backgroundColor: theme.colors.backgroundCard,
            borderBottomColor: theme.colors.border,
            paddingTop: insets.top 
          }
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={[styles.backButtonCircle, { 
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.border,
            }]}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {patient.full_name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {hasChanges ? 'Modifications en cours' : 'Informations personnelles'}
            </Text>
          </View>
          
          {hasChanges && (
            <TouchableOpacity
              style={styles.saveHeaderButton}
              onPress={handleSave}
              disabled={isSaving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.saveHeaderButtonCircle, { backgroundColor: theme.colors.success }]}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
          {!hasChanges && <View style={styles.editButton} />}
        </View>
      </View>
      
      <SafeAreaView style={[styles.contentContainer, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Formulaire moderne avec cartes */}
          <View style={styles.formContainer}>
            {/* Section Informations personnelles */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations personnelles</Text>
              </View>

              {/* Nom complet */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Nom complet <Text style={[styles.required, { color: theme.colors.error }]}>*</Text>
                  </Text>
                </View>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border,
                    }]}
                    value={formData.full_name}
                    onChangeText={(text) => handleFieldChange('full_name', text)}
                    placeholder="Nom complet"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!isSaving}
                  />
                </View>
              </View>

              {/* Âge */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Âge</Text>
                </View>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border,
                    }]}
                    value={formData.age}
                    onChangeText={(text) => handleFieldChange('age', text)}
                    placeholder="Ex: 45 ans"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!isSaving}
                    keyboardType="default"
                  />
                </View>
              </View>

              {/* Genre */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Genre</Text>
                </View>
                <View style={styles.genderContainer}>
                  {(['M', 'F', 'Autre', 'Non précisé'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                    style={[
                      styles.genderButton,
                      { 
                        backgroundColor: formData.gender === gender 
                          ? theme.colors.primary 
                          : theme.colors.backgroundSecondary, 
                        borderColor: formData.gender === gender 
                          ? theme.colors.primary 
                          : theme.colors.border 
                      },
                      isSaving && styles.genderButtonDisabled,
                    ]}
                    onPress={() => {
                      if (!isSaving) {
                        handleFieldChange('gender', gender);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    disabled={isSaving}
                    >
                      <Ionicons
                        name={gender === 'F' ? 'female' : gender === 'M' ? 'male' : 'person-outline'}
                        size={16}
                        color={formData.gender === gender ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.genderButtonText,
                          { color: formData.gender === gender ? '#FFFFFF' : theme.colors.textSecondary },
                        ]}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date de naissance */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Date de naissance</Text>
                </View>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border,
                    }]}
                    value={formData.dob}
                    onChangeText={(text) => handleFieldChange('dob', text)}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>

            {/* Section Informations hospitalières */}
            <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons name="business" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations hospitalières</Text>
              </View>

              {/* Numéro de chambre */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="bed-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Numéro de chambre</Text>
                </View>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border,
                    }]}
                    value={formData.room_number}
                    onChangeText={(text) => handleFieldChange('room_number', text)}
                    placeholder="Ex: 101"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!isSaving}
                  />
                </View>
              </View>

              {/* Unité/Service */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Ionicons name="medical-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.label, { color: theme.colors.text }]}>Unité / Service</Text>
                </View>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.backgroundSecondary, 
                  borderColor: theme.colors.border 
                }]}>
                  <TextInput
                    style={[styles.input, { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border,
                    }]}
                    value={formData.unit}
                    onChangeText={(text) => handleFieldChange('unit', text)}
                    placeholder="Ex: Cardiologie"
                    placeholderTextColor={theme.colors.textMuted}
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>

            {/* Informations supplémentaires */}
            {patient.created_at && (
              <View style={[styles.sectionCard, { backgroundColor: theme.colors.backgroundCard, borderColor: theme.colors.borderCard }]}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <Ionicons name="information-circle" size={20} color={theme.colors.textMuted} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Informations système</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date de création</Text>
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>
                      {new Date(patient.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Boutons d'action - Affichés uniquement s'il y a des changements */}
            {hasChanges && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, { 
                    backgroundColor: theme.colors.backgroundCard, 
                    borderColor: theme.colors.borderCard 
                  }]}
                  onPress={handleCancel}
                  disabled={isSaving}
                  onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={theme.colors.text} />
                  <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSave}
                  disabled={isSaving}
                  onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Enregistrer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    // backgroundColor et borderBottomColor appliqués dynamiquement
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 56,
  },
  backButtonHeader: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    // backgroundColor appliqué dynamiquement
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: -0.3,
    maxWidth: '100%',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '100%',
  },
  editButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 24,
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor appliqué dynamiquement
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
    // color appliqué dynamiquement
  },
  formGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    // color appliqué dynamiquement
  },
  required: {
    // color appliqué dynamiquement
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '400',
    // backgroundColor, borderColor et color appliqués dynamiquement
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 90,
    justifyContent: 'center',
    // backgroundColor et borderColor appliqués dynamiquement
  },
  genderButtonActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    // backgroundColor, borderColor et shadowColor appliqués dynamiquement
  },
  genderButtonDisabled: {
    opacity: 0.5,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    // color appliqué dynamiquement
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    // color appliqué dynamiquement
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    minHeight: 56,
  },
  cancelButton: {
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  saveButton: {
    // backgroundColor appliqué dynamiquement
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

