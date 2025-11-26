/**
 * Modal de sélection/création de patient - Design Premium iOS 17
 * S'affiche avant l'enregistrement pour choisir ou créer un patient
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { patientsApiService, Patient, CreatePatientData } from '../services/patientsApi';

export interface PatientSelectionResult {
  patientId: string | null;
  patientData: CreatePatientData | null;
  skip: boolean;
}

interface PatientSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: PatientSelectionResult) => void;
}

type TabType = 'search' | 'create' | 'skip';

export default function PatientSelectionModal({
  visible,
  onClose,
  onSelect,
}: PatientSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Formulaire de création
  const [formData, setFormData] = useState<CreatePatientData>({
    full_name: '',
    age: '',
    gender: '',
    room_number: '',
    unit: '',
  });
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreatePatientData, string>>>({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Charger les patients au montage
  useEffect(() => {
    if (visible && activeTab === 'search') {
      loadPatients();
    }
  }, [visible, activeTab]);

  // Animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Recherche avec debounce
  useEffect(() => {
    if (activeTab === 'search' && visible) {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          searchPatients(searchQuery);
        } else {
          loadPatients();
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeTab, visible]);

  const loadPatients = async () => {
    try {
      setSearchLoading(true);
      const cachedPatients = await patientsApiService.getCachedPatients();
      if (cachedPatients.length > 0) {
        setPatients(cachedPatients);
      }
      
      const allPatients = await patientsApiService.getAllPatients();
      setPatients(allPatients);
    } catch (error: any) {
      console.error('Erreur lors du chargement des patients:', error);
      
      // Si le token est expiré, afficher une alerte et fermer le modal
      if (error.message === 'TOKEN_EXPIRED' || error.message?.includes('expiré')) {
        Alert.alert(
          'Session expirée',
          'Votre session a expiré. Veuillez vous reconnecter.',
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                // La redirection sera gérée automatiquement par le layout
              },
            },
          ],
          { cancelable: false }
        );
        setPatients([]);
        return;
      }
      
      // Pour les autres erreurs, utiliser le cache si disponible
      const cachedPatients = await patientsApiService.getCachedPatients();
      if (cachedPatients.length > 0) {
        setPatients(cachedPatients);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      loadPatients();
      return;
    }

    try {
      setSearchLoading(true);
      const results = await patientsApiService.searchPatients(query);
      setPatients(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    console.log('🟢 handleSelectPatient appelé pour patient:', patient.id);
    // Appeler onSelect immédiatement
    onSelect({
      patientId: patient.id,
      patientData: null,
      skip: false,
    });
    // Fermer le modal immédiatement
    onClose();
  };

  const handleCreatePatient = async () => {
    // Validation
    const errors: Partial<Record<keyof CreatePatientData, string>> = {};
    if (!formData.full_name.trim()) {
      errors.full_name = 'Le nom est requis';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setCreating(true);

    try {
      const patient = await patientsApiService.createPatient({
        ...formData,
        full_name: formData.full_name.trim(),
        age: formData.age?.trim() || undefined,
        gender: formData.gender || undefined,
        room_number: formData.room_number?.trim() || undefined,
        unit: formData.unit?.trim() || undefined,
      });

      console.log('🟢 Patient créé, appel de onSelect avec:', patient.id);
      onSelect({
        patientId: patient.id,
        patientData: null,
        skip: false,
      });
      // Fermer le modal immédiatement
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      setFormErrors({ full_name: error.message || 'Erreur lors de la création' });
    } finally {
      setCreating(false);
    }
  };

  const handleSkip = () => {
    console.log('🟢 handleSkip appelé');
    onSelect({
      patientId: null,
      patientData: null,
      skip: true,
    });
    // Fermer le modal immédiatement
    onClose();
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      age: '',
      gender: '',
      room_number: '',
      unit: '',
    });
    setFormErrors({});
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'create') {
      resetForm();
    } else if (tab === 'search') {
      loadPatients();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardView}
            >
              {/* Header Premium */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>Nouvelle dictée</Text>
                  <Text style={styles.subtitle}>Sélectionnez ou créez un patient</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={22} color="#1A1A1A" />
                </TouchableOpacity>
              </View>

              {/* Tabs Premium */}
              <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'search' && styles.tabActive]}
                    onPress={() => handleTabChange('search')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="search"
                      size={18}
                      color={activeTab === 'search' ? '#006CFF' : '#8E8E93'}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                      Rechercher
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                    onPress={() => handleTabChange('create')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="person-add"
                      size={18}
                      color={activeTab === 'create' ? '#006CFF' : '#8E8E93'}
                      style={styles.tabIcon}
                    />
                    <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                      Nouveau
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {activeTab === 'search' ? (
                  <>
                    {/* Barre de recherche Premium */}
                    <View style={styles.searchSection}>
                      <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Rechercher un patient…"
                          placeholderTextColor="#8E8E93"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close-circle" size={20} color="#8E8E93" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Liste des patients - Cards Premium */}
                    {searchLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#006CFF" />
                        <Text style={styles.loadingText}>Recherche en cours...</Text>
                      </View>
                    ) : patients.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                          <Ionicons name="people-outline" size={56} color="#C7C7CC" />
                        </View>
                        <Text style={styles.emptyTitle}>Aucun patient trouvé</Text>
                        <Text style={styles.emptyText}>
                          Créez un nouveau patient ou continuez sans patient
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.patientsList}>
                        {patients.map((patient, index) => (
                          <TouchableOpacity
                            key={patient.id}
                            style={styles.patientCard}
                            onPress={() => handleSelectPatient(patient)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.patientCardContent}>
                              <View style={styles.patientAvatar}>
                                <Ionicons name="person" size={24} color="#006CFF" />
                              </View>
                              <View style={styles.patientInfo}>
                                <Text style={styles.patientName}>{patient.full_name}</Text>
                                <View style={styles.patientMeta}>
                                  {patient.age && (
                                    <View style={styles.metaItem}>
                                      <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                                      <Text style={styles.metaText}>{patient.age} ans</Text>
                                    </View>
                                  )}
                                  {patient.room_number && (
                                    <View style={styles.metaItem}>
                                      <Ionicons name="bed-outline" size={14} color="#8E8E93" />
                                      <Text style={styles.metaText}>Ch. {patient.room_number}</Text>
                                    </View>
                                  )}
                                  {patient.unit && (
                                    <View style={styles.metaItem}>
                                      <Ionicons name="medical-outline" size={14} color="#8E8E93" />
                                      <Text style={styles.metaText}>{patient.unit}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                ) : activeTab === 'create' ? (
                  <>
                    {/* Formulaire Premium */}
                    <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
                      {/* Nom complet */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>
                          Nom complet <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={[styles.inputWrapper, formErrors.full_name && styles.inputWrapperError]}>
                          <Ionicons name="person-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Jean Dupont"
                            placeholderTextColor="#C7C7CC"
                            value={formData.full_name}
                            onChangeText={(text) => {
                              setFormData({ ...formData, full_name: text });
                              if (formErrors.full_name) {
                                setFormErrors({ ...formErrors, full_name: undefined });
                              }
                            }}
                            autoCapitalize="words"
                            autoFocus={true}
                          />
                          {formData.full_name.length > 0 && (
                            <Ionicons
                              name={formErrors.full_name ? 'close-circle' : 'checkmark-circle'}
                              size={20}
                              color={formErrors.full_name ? '#FF3B30' : '#34C759'}
                            />
                          )}
                        </View>
                        {formErrors.full_name && (
                          <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={14} color="#FF3B30" />
                            <Text style={styles.errorText}>{formErrors.full_name}</Text>
                          </View>
                        )}
                      </View>

                      {/* Ligne Âge et Genre */}
                      <View style={styles.formRow}>
                        <View style={[styles.formSection, styles.formSectionHalf]}>
                          <Text style={styles.formLabel}>Âge</Text>
                          <View style={styles.inputWrapper}>
                            <Ionicons name="calendar-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="45"
                              placeholderTextColor="#C7C7CC"
                              value={formData.age}
                              onChangeText={(text) => {
                                const numericText = text.replace(/[^0-9]/g, '');
                                setFormData({ ...formData, age: numericText });
                              }}
                              keyboardType="numeric"
                              maxLength={3}
                            />
                            {formData.age && <Text style={styles.inputSuffix}>ans</Text>}
                          </View>
                        </View>

                        <View style={[styles.formSection, styles.formSectionHalf]}>
                          <Text style={styles.formLabel}>Genre</Text>
                          <View style={styles.genderGrid}>
                            {[
                              { value: 'M', label: 'M', icon: 'male' },
                              { value: 'F', label: 'F', icon: 'female' },
                              { value: 'Autre', label: 'Autre', icon: 'person' },
                              { value: 'Non précisé', label: 'N/A', icon: 'remove-circle-outline' },
                            ].map((gender) => (
                              <Pressable
                                key={gender.value}
                                style={({ pressed }) => [
                                  styles.genderButton,
                                  formData.gender === gender.value && styles.genderButtonActive,
                                  pressed && styles.genderButtonPressed,
                                ]}
                                onPress={() => setFormData({ ...formData, gender: gender.value })}
                              >
                                <Ionicons
                                  name={gender.icon as any}
                                  size={18}
                                  color={formData.gender === gender.value ? '#FFFFFF' : '#1A1A1A'}
                                />
                                <Text
                                  style={[
                                    styles.genderButtonText,
                                    formData.gender === gender.value && styles.genderButtonTextActive,
                                  ]}
                                >
                                  {gender.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Chambre */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Numéro de chambre</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="bed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="205"
                            placeholderTextColor="#C7C7CC"
                            value={formData.room_number}
                            onChangeText={(text) => setFormData({ ...formData, room_number: text })}
                          />
                        </View>
                      </View>

                      {/* Unité */}
                      <View style={styles.formSection}>
                        <Text style={styles.formLabel}>Unité / Service</Text>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="medical-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Cardiologie, Urgences..."
                            placeholderTextColor="#C7C7CC"
                            value={formData.unit}
                            onChangeText={(text) => setFormData({ ...formData, unit: text })}
                            autoCapitalize="words"
                          />
                        </View>
                        <Text style={styles.helperText}>
                          Exemples : Cardiologie, Urgences, Chirurgie, Soins intensifs
                        </Text>
                      </View>
                    </Animated.View>
                  </>
                ) : null}
              </ScrollView>

              {/* Footer Premium */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.skipButtonText}>Continuer sans patient</Text>
                  <Text style={styles.skipButtonSubtext}>Vous pourrez l&apos;associer plus tard</Text>
                </TouchableOpacity>

                {activeTab === 'create' && (
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      creating && styles.createButtonDisabled,
                      !formData.full_name.trim() && styles.createButtonInactive,
                    ]}
                    onPress={handleCreatePatient}
                    disabled={creating || !formData.full_name.trim()}
                    activeOpacity={0.8}
                  >
                    {creating ? (
                      <>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.createButtonText}>Création...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.createButtonText}>Créer et continuer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#E3F2FD',
  },
  tabIcon: {
    marginRight: 0,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#006CFF',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  patientsList: {
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  patientMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  form: {
    padding: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionHalf: {
    flex: 1,
    marginRight: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  required: {
    color: '#FF3B30',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontStyle: 'italic',
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    gap: 6,
    minWidth: 75,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  genderButtonPressed: {
    opacity: 0.7,
  },
  genderButtonActive: {
    backgroundColor: '#006CFF',
    borderColor: '#006CFF',
    shadowColor: '#006CFF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  genderButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 2,
  },
  skipButtonSubtext: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006CFF',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#006CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonInactive: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
