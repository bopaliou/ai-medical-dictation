/**
 * Écran Édition du Rapport - Design Premium iOS
 * Permet d'éditer les sections SOAPIE générées par l'IA après une dictée
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AudioPlayer from '@/components/AudioPlayer';
import { reportApiService, StructuredJson, SOAPIEStructure } from '@/services/reportApi';
import { uploadApiService } from '@/services/uploadApi';
import ModernHeader from '@/components/ModernHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface SOAPIESection {
  key: keyof SOAPIEStructure;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  isObject?: boolean;
}

const SOAPIE_SECTIONS: SOAPIESection[] = [
  {
    key: 'S',
    title: 'Motif de consultation',
    icon: 'chatbubble-ellipses-outline',
    placeholder: 'Décrivez le motif de consultation...',
  },
  {
    key: 'O',
    title: 'Examen clinique',
    icon: 'medical-outline',
    placeholder: 'Décrivez l\'examen clinique...',
    isObject: true,
  },
  {
    key: 'A',
    title: 'Évaluation',
    icon: 'analytics-outline',
    placeholder: 'Décrivez l\'évaluation...',
  },
  {
    key: 'I',
    title: 'Intervention',
    icon: 'bandage-outline',
    placeholder: 'Décrivez les interventions...',
  },
  {
    key: 'E',
    title: 'Évaluation post-intervention',
    icon: 'checkmark-circle-outline',
    placeholder: 'Décrivez l\'évaluation post-intervention...',
  },
  {
    key: 'P',
    title: 'Plan',
    icon: 'calendar-outline',
    placeholder: 'Décrivez le plan de soins...',
  },
];

export default function ReportEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const audioUri = params.audioUri as string;
  const patientId = params.patientId as string;
  const skip = params.skip === 'true';
  const patientData = params.patientData ? JSON.parse(params.patientData as string) : null;
  const structuredJsonParam = params.structured_json ? JSON.parse(params.structured_json as string) : null;

  // Initialiser structuredJson avec patientData si disponible
  // Toujours initialiser patient (même vide) pour permettre l'édition
  const [structuredJson, setStructuredJson] = useState<StructuredJson>({
    patient: patientData || structuredJsonParam?.patient || {
      full_name: '',
      age: '',
      gender: '',
      room_number: '',
      unit: ''
    },
    soapie: structuredJsonParam?.soapie || structuredJsonParam || {},
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isStructuringComplete, setIsStructuringComplete] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [noteId, setNoteId] = useState<string | null>(params.note_id as string || null);

  // État pour suivre si les données ont été initialisées
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser les données depuis les paramètres ou upload
  useEffect(() => {
    // Éviter la réinitialisation si déjà initialisé
    if (isInitialized) {
      return;
    }

    const initializeData = async () => {
      // Si structured_json est déjà fourni, l'utiliser
      if (structuredJsonParam) {
        console.log('📋 Utilisation du structured_json fourni');
        console.log('📋 Structured JSON complet:', JSON.stringify(structuredJsonParam, null, 2));
        
        // Fusionner : patientData a priorité si full_name existe
        let finalPatient = structuredJsonParam.patient || {};
        if (patientData && patientData.full_name && patientData.full_name.trim()) {
          finalPatient = {
            ...finalPatient,
            full_name: patientData.full_name, // Priorité
            ...(patientData.age && { age: patientData.age }),
            ...(patientData.gender && { gender: patientData.gender }),
            ...(patientData.room_number && { room_number: patientData.room_number }),
            ...(patientData.unit && { unit: patientData.unit }),
          };
        }
        
        // Extraire les données SOAPIE en préservant toutes les sous-sections
        const soapieData = structuredJsonParam.soapie || structuredJsonParam || {};
        
        // S'assurer que la section O contient toutes les sous-sections (vitals, exam, labs, medications)
        const objectiveData = soapieData.O || {};
        const finalObjective = {
          vitals: objectiveData.vitals || {},
          exam: objectiveData.exam || '',
          labs: objectiveData.labs || '',
          medications: Array.isArray(objectiveData.medications) ? objectiveData.medications : (objectiveData.medications || []),
        };
        
        const finalSoapie = {
          ...soapieData,
          O: finalObjective,
        };
        
        console.log('📋 SOAPIE final avec vitals:', JSON.stringify(finalSoapie, null, 2));
        
        setStructuredJson({
          patient: finalPatient && Object.keys(finalPatient).length > 0 ? finalPatient : undefined,
          soapie: finalSoapie,
        });
        if (structuredJsonParam.transcription) {
          setTranscription(structuredJsonParam.transcription);
        }
        setIsInitialized(true);
        return;
      }

      // Si on a l'audio mais pas de structured_json, uploader pour obtenir les données
      if (audioUri && !structuredJsonParam && !noteId) {
        console.log('📤 Upload automatique de l\'audio pour obtenir structured_json...');
        console.log('📁 URI audio:', audioUri);
        console.log('👤 Patient ID:', patientId || 'aucun');
        setIsUploading(true);
        
        try {
          const uploadResponse = await uploadApiService.uploadAudio(audioUri, {
            patientId: patientId || null,
            patientData: patientData || null,
          });

          console.log('✅ Upload réussi, structured_json reçu:', uploadResponse.structured_json);
          console.log('📋 Structure complète de la réponse:', JSON.stringify(uploadResponse, null, 2));

          // Mettre à jour les données avec la réponse de l'upload
          if (uploadResponse.structured_json) {
            // Le structured_json peut avoir deux formats :
            // 1. { patient: {...}, soapie: {...} } (nouveau format)
            // 2. { soapie: {...} } (ancien format)
            const structuredData = uploadResponse.structured_json;
            
            // Extraire les données SOAPIE
            const soapieData = structuredData.soapie || structuredData;
            
            // Vérifier si les données SOAPIE sont vides
            const hasSOAPIEData = soapieData && (
              soapieData.S?.trim() ||
              soapieData.A?.trim() ||
              (Array.isArray(soapieData.I) && soapieData.I.length > 0) ||
              soapieData.E?.trim() ||
              soapieData.P?.trim() ||
              soapieData.O?.exam?.trim() ||
              soapieData.O?.labs?.trim() ||
              (Array.isArray(soapieData.O?.medications) && soapieData.O.medications.length > 0)
            );
            
            if (!hasSOAPIEData) {
              console.warn('⚠️ ATTENTION: Les données SOAPIE sont vides dans la réponse');
              console.warn('📝 Transcription reçue:', uploadResponse.transcription?.substring(0, 200));
              console.warn('📋 Structured JSON complet:', JSON.stringify(structuredData, null, 2));
            }
            
            // Fusionner les données patient : patientData a priorité si full_name existe
            let finalPatient = structuredData.patient || uploadResponse.patient || {};
            
            // Si patientData a un full_name, l'utiliser (priorité)
            if (patientData && patientData.full_name && patientData.full_name.trim()) {
              finalPatient = {
                ...finalPatient,
                full_name: patientData.full_name, // Priorité au full_name de patientData
                ...(patientData.age && { age: patientData.age }),
                ...(patientData.gender && { gender: patientData.gender }),
                ...(patientData.room_number && { room_number: patientData.room_number }),
                ...(patientData.unit && { unit: patientData.unit }),
              };
              console.log('✅ PatientData fusionné avec priorité sur full_name:', finalPatient.full_name);
            } else if (finalPatient && Object.keys(finalPatient).length > 0) {
              // Utiliser les données de l'IA si patientData n'a pas de full_name
              console.log('✅ Patient depuis IA:', finalPatient.full_name || '(vide)');
            } else if (patientData) {
              // Utiliser patientData même s'il n'a pas de full_name
              finalPatient = patientData;
              console.log('✅ Patient depuis patientData (sans full_name)');
            }
            
            setStructuredJson({
              patient: finalPatient && Object.keys(finalPatient).length > 0 ? finalPatient : undefined,
              soapie: soapieData || {},
            });
            
            console.log('📝 Données SOAPIE extraites:', soapieData);
            console.log('👤 Données patient extraites:', structuredData.patient || uploadResponse.patient);
            console.log('✅ Données SOAPIE présentes:', hasSOAPIEData);
          } else {
            console.error('❌ ERREUR: structured_json est manquant dans la réponse');
            console.error('📋 Réponse complète:', JSON.stringify(uploadResponse, null, 2));
          }

          if (uploadResponse.transcription) {
            setTranscription(uploadResponse.transcription);
          } else if (uploadResponse.note?.transcription_text) {
            setTranscription(uploadResponse.note.transcription_text);
          }

          if (uploadResponse.note?.id) {
            setNoteId(uploadResponse.note.id);
          }

          // Stocker aussi le patient_id de la note pour utilisation ultérieure
          if (uploadResponse.note?.patient_id) {
            console.log('✅ Patient ID récupéré depuis la note:', uploadResponse.note.patient_id);
          }

          console.log('✅ Données initialisées depuis l\'upload');
          setIsInitialized(true);
          setIsStructuringComplete(true);
          setIsUploading(false);
        } catch (error: any) {
          console.error('❌ Erreur lors de l\'upload automatique:', error);
          console.error('📡 Détails de l\'erreur:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
          });
          setIsUploading(false);
          
          // Afficher un message d'erreur plus informatif
          const errorMessage = error.message || 'Erreur inconnue';
          const isNetworkError = errorMessage.includes('connexion') || errorMessage.includes('réseau') || errorMessage.includes('Network') || error.code === 'ERR_NETWORK';
          
          Alert.alert(
            isNetworkError ? 'Erreur de connexion' : 'Erreur lors de l\'upload',
            isNetworkError
              ? 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré et accessible sur http://192.168.1.13:3000'
              : `Impossible de télécharger l'audio: ${errorMessage}. Vous pouvez toujours éditer manuellement les champs SOAPIE.`,
            [
              {
                text: 'Réessayer',
                onPress: () => {
                  // Réessayer l'upload en réinitialisant les données
                  const retryInit = async () => {
                    setIsUploading(true);
                    try {
                      const uploadResponse = await uploadApiService.uploadAudio(audioUri, {
                        patientId: patientId || null,
                        patientData: patientData || null,
                      });
                      // Traiter la réponse comme dans le code initial
                      if (uploadResponse.structured_json) {
                        const structuredData = uploadResponse.structured_json;
                        const soapieData = structuredData.soapie || structuredData;
                        // Fusionner les données patient : patientData a priorité si full_name existe
                        let finalPatient = structuredData.patient || uploadResponse.patient || {};
                        
                        // Si patientData a un full_name, l'utiliser (priorité)
                        if (patientData && patientData.full_name && patientData.full_name.trim()) {
                          finalPatient = {
                            ...finalPatient,
                            full_name: patientData.full_name, // Priorité au full_name de patientData
                            ...(patientData.age && { age: patientData.age }),
                            ...(patientData.gender && { gender: patientData.gender }),
                            ...(patientData.room_number && { room_number: patientData.room_number }),
                            ...(patientData.unit && { unit: patientData.unit }),
                          };
                        } else if (finalPatient && Object.keys(finalPatient).length > 0) {
                          // Utiliser les données de l'IA si patientData n'a pas de full_name
                        } else if (patientData) {
                          // Utiliser patientData même s'il n'a pas de full_name
                          finalPatient = patientData;
                        }
                        
                        setStructuredJson({
                          patient: finalPatient && Object.keys(finalPatient).length > 0 ? finalPatient : undefined,
                          soapie: soapieData || {},
                        });
                      }
                      if (uploadResponse.transcription) {
                        setTranscription(uploadResponse.transcription);
                      }
                      if (uploadResponse.note?.id) {
                        setNoteId(uploadResponse.note.id);
                      }
                    } catch (retryError) {
                      console.error('❌ Erreur lors de la nouvelle tentative:', retryError);
                      Alert.alert(
                        'Erreur',
                        'Impossible de télécharger l\'audio. Vous pouvez continuer sans upload.',
                        [{ text: 'OK' }]
                      );
                    } finally {
                      setIsUploading(false);
                    }
                  };
                  retryInit();
                },
              },
              {
                text: 'Continuer sans upload',
                style: 'cancel',
              },
            ]
          );
        }
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuter une seule fois au montage

  const updateSOAPIESection = (key: keyof SOAPIEStructure, value: string | string[]) => {
    setStructuredJson((prev) => ({
      ...prev,
      soapie: {
        ...prev.soapie,
        [key]: value,
      },
    }));
  };

  const updateObjectiveField = (field: 'exam' | 'labs' | 'medications' | 'vitals', value: string | string[] | object) => {
    setStructuredJson((prev) => ({
      ...prev,
      soapie: {
        ...prev.soapie,
        O: {
          ...prev.soapie?.O,
          [field]: value,
        },
      },
    }));
  };

  const updateVitalField = (field: string, value: string) => {
    setStructuredJson((prev) => ({
      ...prev,
      soapie: {
        ...prev.soapie,
        O: {
          ...prev.soapie?.O,
          vitals: {
            ...prev.soapie?.O?.vitals,
            [field]: value,
          },
        },
      },
    }));
  };

  // Fonction pour mettre à jour les informations patient
  const updatePatientField = (field: 'full_name' | 'age' | 'gender' | 'room_number' | 'unit', value: string) => {
    setStructuredJson((prev) => ({
      ...prev,
      patient: {
        ...prev.patient,
        [field]: value,
      },
    }));
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);

      // Vérifier qu'on a au moins quelques données
      const hasData = structuredJson.soapie && (
        structuredJson.soapie.S ||
        structuredJson.soapie.A ||
        structuredJson.soapie.I ||
        structuredJson.soapie.E ||
        structuredJson.soapie.P ||
        structuredJson.soapie.O
      );

      if (!hasData) {
        Alert.alert(
          'Données manquantes',
          'Veuillez remplir au moins une section SOAPIE avant de générer le PDF.',
          [{ text: 'OK' }]
        );
        setIsGenerating(false);
        return;
      }

      // Si on a l'audio mais pas encore de note_id, on doit d'abord uploader
      if (audioUri && !noteId) {
        console.log('📤 Upload de l\'audio pour générer le PDF...');
        setIsUploading(true);
        
        const uploadResponse = await uploadApiService.uploadAudio(audioUri, {
          patientId: patientId || null,
          patientData: patientData || null,
        });

        setIsUploading(false);

        // Le backend génère déjà le PDF lors de l'upload
        // Mais on veut régénérer avec les données éditées
        // IMPORTANT: Récupérer l'ID du patient depuis la réponse du backend
        // car c'est là que se trouve le nouvel ID créé (ou l'ID retrouvé)
        const finalNoteId = uploadResponse.note?.id || noteId;
        
        // Priorité: 1) note.patient_id (le plus fiable), 2) patient.id (si patient créé), 3) patientId param (si fourni et non vide)
        const finalPatientId = uploadResponse.note?.patient_id 
          || uploadResponse.patient?.id 
          || (patientId && patientId.trim() ? patientId : null);

        console.log('🔍 Patient ID pour génération PDF:', {
          fromNote: uploadResponse.note?.patient_id,
          fromPatient: uploadResponse.patient?.id,
          fromParam: patientId,
          final: finalPatientId
        });

        if (!finalPatientId) {
          console.warn('⚠️ Aucun patient ID trouvé, le backend devra le récupérer depuis la note');
        }

        // VALIDATION : S'assurer que structuredJson contient les dernières données
        // Attendre un court délai pour garantir que le state est à jour
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Vérifier que structuredJson contient bien les données patient
        if (!structuredJson || !structuredJson.patient) {
          console.error('❌ structuredJson.patient manquant avant génération PDF');
          Alert.alert(
            'Erreur',
            'Les données du patient sont manquantes. Veuillez réessayer.',
            [{ text: 'OK' }]
          );
          setIsGenerating(false);
          return;
        }
        
        // Régénérer le PDF avec les données éditées
        console.log('📄 Appel de generatePDF avec:', {
          note_id: finalNoteId,
          patient_id: finalPatientId,
          hasStructuredJson: !!structuredJson,
          hasSOAPIE: !!structuredJson.soapie,
          patient: structuredJson.patient ? {
            full_name: structuredJson.patient.full_name || '(vide)',
            age: structuredJson.patient.age || '(vide)',
            gender: structuredJson.patient.gender || '(vide)',
            room_number: structuredJson.patient.room_number || '(vide)',
            unit: structuredJson.patient.unit || '(vide)'
          } : '(absent)'
        });

        const pdfResponse = await reportApiService.generatePDF({
          note_id: finalNoteId || undefined,
          patient_id: finalPatientId || undefined, // Utiliser undefined au lieu de '' pour que le backend récupère depuis la note
          structured_json: structuredJson, // Données actuelles du formulaire
          transcription: uploadResponse.transcription || transcription,
        });

        console.log('✅ PDF généré, réponse:', {
          ok: pdfResponse.ok,
          pdf_url: pdfResponse.pdf_url ? pdfResponse.pdf_url.substring(0, 50) + '...' : 'absent',
          note_id: pdfResponse.note_id
        });

        if (!pdfResponse.pdf_url) {
          throw new Error('URL du PDF non retournée par le serveur');
        }

        router.replace({
          pathname: '/report/success',
          params: {
            pdfUrl: pdfResponse.pdf_url,
            noteId: finalNoteId || pdfResponse.note_id || '',
            report_id: finalNoteId || pdfResponse.note_id || '',
          },
        } as any);
      } else {
        // Générer directement le PDF avec les données éditées
        // Si noteId existe, le backend récupérera automatiquement le patient_id depuis la note
        // Sinon, utiliser patientId seulement s'il n'est pas vide
        const finalPatientId = (patientId && patientId.trim()) ? patientId : undefined;
        
        console.log('🔍 Patient ID pour génération PDF (sans upload):', {
          fromParam: patientId,
          noteId: noteId,
          final: finalPatientId || 'sera récupéré depuis la note'
        });

        // VALIDATION : S'assurer que structuredJson contient les dernières données
        // Attendre un court délai pour garantir que le state est à jour
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Vérifier que structuredJson contient bien les données patient
        if (!structuredJson || !structuredJson.patient) {
          console.error('❌ structuredJson.patient manquant avant génération PDF');
          Alert.alert(
            'Erreur',
            'Les données du patient sont manquantes. Veuillez réessayer.',
            [{ text: 'OK' }]
          );
          setIsGenerating(false);
          return;
        }
        
        console.log('📄 Appel de generatePDF (sans upload) avec:', {
          note_id: noteId,
          patient_id: finalPatientId,
          hasStructuredJson: !!structuredJson,
          hasSOAPIE: !!structuredJson.soapie,
          patient: structuredJson.patient ? {
            full_name: structuredJson.patient.full_name || '(vide)',
            age: structuredJson.patient.age || '(vide)',
            gender: structuredJson.patient.gender || '(vide)',
            room_number: structuredJson.patient.room_number || '(vide)',
            unit: structuredJson.patient.unit || '(vide)'
          } : '(absent)'
        });

        const pdfResponse = await reportApiService.generatePDF({
          note_id: noteId || undefined,
          patient_id: finalPatientId, // undefined si vide, le backend récupérera depuis la note
          structured_json: structuredJson, // Données actuelles du formulaire
          transcription: transcription,
        });

        console.log('✅ PDF généré, réponse:', {
          ok: pdfResponse.ok,
          pdf_url: pdfResponse.pdf_url ? pdfResponse.pdf_url.substring(0, 50) + '...' : 'absent',
          note_id: pdfResponse.note_id
        });

        if (!pdfResponse.pdf_url) {
          throw new Error('URL du PDF non retournée par le serveur');
        }

        router.replace({
          pathname: '/report/success',
          params: {
            pdfUrl: pdfResponse.pdf_url,
            noteId: noteId || pdfResponse.note_id || '',
            report_id: noteId || pdfResponse.note_id || '',
          },
        } as any);
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la génération du PDF.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSOAPIESection = (section: SOAPIESection) => {
    const value = structuredJson.soapie?.[section.key];
    const displayValue = Array.isArray(value) ? value.join('\n') : (value || '');

    if (section.key === 'O' && section.isObject) {
      // Section Objective est un objet complexe
      const objective = structuredJson.soapie?.O;
      const vitals = objective?.vitals || {};
      
      return (
        <View key={section.key} style={[styles.sectionCard, { 
          backgroundColor: theme.colors.backgroundCard,
          borderColor: theme.colors.borderCard,
        }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>

          {/* Signes vitaux */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { color: theme.colors.textSecondary }]}>Signes vitaux</Text>
            <View style={styles.vitalsGrid}>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>Température (°C)</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="37.5"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.temperature || ''}
                  onChangeText={(text) => updateVitalField('temperature', text)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>Tension artérielle</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="120/80"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.blood_pressure || ''}
                  onChangeText={(text) => updateVitalField('blood_pressure', text)}
                />
              </View>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>Fréquence cardiaque (bpm)</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="72"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.heart_rate || ''}
                  onChangeText={(text) => updateVitalField('heart_rate', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>Respiration (/min)</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="16"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.respiratory_rate || ''}
                  onChangeText={(text) => updateVitalField('respiratory_rate', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>SpO₂ (%)</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="98"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.spo2 || ''}
                  onChangeText={(text) => updateVitalField('spo2', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.vitalRow}>
                <Text style={[styles.vitalLabel, { color: theme.colors.text }]}>Glycémie (g/L)</Text>
                <TextInput
                  style={[styles.vitalInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="1.0"
                  placeholderTextColor={theme.colors.textMuted}
                  value={vitals.glycemia || ''}
                  onChangeText={(text) => updateVitalField('glycemia', text)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Examen clinique */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { color: theme.colors.textSecondary }]}>Examen clinique</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }]}
              placeholder="Décrivez l'examen clinique..."
              placeholderTextColor={theme.colors.textMuted}
              value={objective?.exam || ''}
              onChangeText={(text) => updateObjectiveField('exam', text)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Laboratoires */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { color: theme.colors.textSecondary }]}>Résultats de laboratoire</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }]}
              placeholder="Résultats de laboratoire..."
              placeholderTextColor={theme.colors.textMuted}
              value={objective?.labs || ''}
              onChangeText={(text) => updateObjectiveField('labs', text)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Médicaments */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { color: theme.colors.textSecondary }]}>Médicaments</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }]}
              placeholder="Liste des médicaments (un par ligne)..."
              placeholderTextColor={theme.colors.textMuted}
              value={Array.isArray(objective?.medications) ? objective.medications.join('\n') : (objective?.medications || '')}
              onChangeText={(text) => {
                const medications = text.split('\n').filter((m) => m.trim());
                updateObjectiveField('medications', medications);
              }}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      );
    }

    return (
      <View key={section.key} style={[styles.sectionCard, { 
        backgroundColor: theme.colors.backgroundCard,
        borderColor: theme.colors.borderCard,
      }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={section.icon} size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>

        <TextInput
          style={[styles.textInput, {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          }]}
          placeholder={section.placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={displayValue}
          onChangeText={(text) => {
            if (section.key === 'I') {
              // Intervention peut être un tableau ou une string
              const interventions = text.split('\n').filter((i) => i.trim());
              updateSOAPIESection(section.key, interventions.length > 1 ? interventions : text);
            } else {
              updateSOAPIESection(section.key, text);
            }
          }}
          multiline
          numberOfLines={section.key === 'S' || section.key === 'A' ? 4 : 3}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={theme.resolved === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header moderne */}
        <ModernHeader
          title="Édition du Rapport"
          subtitle="Modification des sections SOAPIE"
          icon="create"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Audio Player */}
          {audioUri && (
            <AudioPlayer audioUri={audioUri} />
          )}

          {/* Indicateur de chargement initial */}
          {isUploading && !isStructuringComplete && (
            <View style={[styles.loadingCard, {
              backgroundColor: theme.colors.backgroundCard,
              borderColor: theme.colors.borderCard,
            }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Traitement de l&apos;audio et structuration des données...
              </Text>
            </View>
          )}

          {/* Indicateur de structuration terminée */}
          {isStructuringComplete && !isUploading && (
            <View style={[styles.successCard, {
              backgroundColor: theme.resolved === 'dark' ? theme.colors.successLight : '#E8F5E9',
              borderColor: theme.colors.success,
            }]}>
              <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
              <Text style={[styles.successText, { 
                color: theme.resolved === 'dark' ? theme.colors.success : '#1B5E20' 
              }]}>
                Structuration terminée
              </Text>
              <Text style={[styles.successSubtext, { color: theme.colors.textSecondary }]}>
                Vous pouvez maintenant modifier les données ci-dessous
              </Text>
            </View>
          )}

          {/* Section Informations Patient */}
          <View style={[styles.patientCard, {
            backgroundColor: theme.colors.backgroundCard,
            borderColor: theme.colors.borderCard,
          }]}>
            <View style={styles.patientCardHeader}>
              <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.patientCardTitle, { color: theme.colors.text }]}>Informations du Patient</Text>
            </View>
            
            <View style={styles.patientInfoGrid}>
              {/* Nom complet */}
              <View style={[styles.patientInfoRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.patientInfoLabel, { color: theme.colors.textSecondary }]}>Nom complet :</Text>
                <TextInput
                  style={[styles.patientInfoInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="Nom complet du patient"
                  placeholderTextColor={theme.colors.textMuted}
                  value={structuredJson.patient?.full_name || patientData?.full_name || ''}
                  onChangeText={(text) => updatePatientField('full_name', text)}
                />
              </View>

              {/* Âge */}
              <View style={[styles.patientInfoRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.patientInfoLabel, { color: theme.colors.textSecondary }]}>Âge :</Text>
                <TextInput
                  style={[styles.patientInfoInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="Ex: 45 ans"
                  placeholderTextColor={theme.colors.textMuted}
                  value={structuredJson.patient?.age || patientData?.age || ''}
                  onChangeText={(text) => updatePatientField('age', text)}
                  keyboardType="numeric"
                />
              </View>

              {/* Sexe */}
              <View style={[styles.patientInfoRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.patientInfoLabel, { color: theme.colors.textSecondary }]}>Sexe :</Text>
                <TextInput
                  style={[styles.patientInfoInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="Ex: Homme, Femme"
                  placeholderTextColor={theme.colors.textMuted}
                  value={structuredJson.patient?.gender || patientData?.gender || ''}
                  onChangeText={(text) => updatePatientField('gender', text)}
                />
              </View>

              {/* Chambre */}
              <View style={[styles.patientInfoRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.patientInfoLabel, { color: theme.colors.textSecondary }]}>Chambre :</Text>
                <TextInput
                  style={[styles.patientInfoInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="Ex: 12, Chambre 5"
                  placeholderTextColor={theme.colors.textMuted}
                  value={structuredJson.patient?.room_number || patientData?.room_number || ''}
                  onChangeText={(text) => updatePatientField('room_number', text)}
                />
              </View>

              {/* Unité / Service */}
              <View style={[styles.patientInfoRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.patientInfoLabel, { color: theme.colors.textSecondary }]}>Unité / Service :</Text>
                <TextInput
                  style={[styles.patientInfoInput, {
                    backgroundColor: theme.colors.backgroundSecondary,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  }]}
                  placeholder="Ex: Cardiologie, Urgences"
                  placeholderTextColor={theme.colors.textMuted}
                  value={structuredJson.patient?.unit || patientData?.unit || ''}
                  onChangeText={(text) => updatePatientField('unit', text)}
                />
              </View>
            </View>
          </View>

          {/* Sections SOAPIE */}
          {SOAPIE_SECTIONS.map((section) => renderSOAPIESection(section))}

          {/* Bouton CTA */}
          <TouchableOpacity
            style={[
              styles.generateButton, 
              { backgroundColor: theme.colors.primary },
              isGenerating && { backgroundColor: theme.colors.primary + '80' }
            ]}
            onPress={handleGeneratePDF}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateButtonText}>Génération en cours...</Text>
              </>
            ) : (
              <>
                <Ionicons name="document-text" size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Générer le rapport PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Espace en bas pour le clavier */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor appliqué dynamiquement
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color appliqué dynamiquement
  },
  subSection: {
    marginTop: 16,
  },
  subSectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    // color appliqué dynamiquement
  },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    // backgroundColor, borderColor et color appliqués dynamiquement
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32,
    gap: 10,
    // backgroundColor appliqué dynamiquement
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  patientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  patientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  patientCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    // color appliqué dynamiquement
  },
  patientInfoGrid: {
    gap: 12,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    // borderBottomColor appliqué dynamiquement
  },
  patientInfoLabel: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    // color appliqué dynamiquement
  },
  patientInfoValue: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  patientInfoInput: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    textAlign: 'right',
    minHeight: 40,
    // backgroundColor, borderColor et color appliqués dynamiquement
  },
  loadingCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    // color appliqué dynamiquement
  },
  successCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // backgroundColor et borderColor appliqués dynamiquement
  },
  successText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    // color appliqué dynamiquement
  },
  successSubtext: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    // color appliqué dynamiquement
  },
  vitalsGrid: {
    gap: 12,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
    // color appliqué dynamiquement
  },
  vitalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    flex: 1,
    minWidth: 100,
    // backgroundColor, borderColor et color appliqués dynamiquement
  },
});
