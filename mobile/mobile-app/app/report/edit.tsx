/**
 * Écran Edition Report - Design Premium iOS
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

  const audioUri = params.audioUri as string;
  const patientId = params.patientId as string;
  const skip = params.skip === 'true';
  const patientData = params.patientData ? JSON.parse(params.patientData as string) : null;
  const structuredJsonParam = params.structured_json ? JSON.parse(params.structured_json as string) : null;

  // Initialiser structuredJson avec patientData si disponible
  const [structuredJson, setStructuredJson] = useState<StructuredJson>({
    patient: (patientData && patientData.full_name) ? patientData : undefined,
    soapie: structuredJsonParam?.soapie || structuredJsonParam || {},
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
        
        setStructuredJson({
          patient: finalPatient && Object.keys(finalPatient).length > 0 ? finalPatient : undefined,
          soapie: structuredJsonParam.soapie || structuredJsonParam || {},
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

  const updateObjectiveField = (field: 'exam' | 'labs' | 'medications', value: string | string[]) => {
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

        // Régénérer le PDF avec les données éditées
        console.log('📄 Appel de generatePDF avec:', {
          note_id: finalNoteId,
          patient_id: finalPatientId,
          hasStructuredJson: !!structuredJson,
          hasSOAPIE: !!structuredJson.soapie
        });

        const pdfResponse = await reportApiService.generatePDF({
          note_id: finalNoteId || undefined,
          patient_id: finalPatientId || undefined, // Utiliser undefined au lieu de '' pour que le backend récupère depuis la note
          structured_json: structuredJson,
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

        console.log('📄 Appel de generatePDF (sans upload) avec:', {
          note_id: noteId,
          patient_id: finalPatientId,
          hasStructuredJson: !!structuredJson,
          hasSOAPIE: !!structuredJson.soapie
        });

        const pdfResponse = await reportApiService.generatePDF({
          note_id: noteId || undefined,
          patient_id: finalPatientId, // undefined si vide, le backend récupérera depuis la note
          structured_json: structuredJson,
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
      return (
        <View key={section.key} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name={section.icon} size={20} color="#006CFF" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>

          {/* Examen clinique */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionLabel}>Examen clinique</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Décrivez l'examen clinique..."
              placeholderTextColor="#C7C7CC"
              value={objective?.exam || ''}
              onChangeText={(text) => updateObjectiveField('exam', text)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Laboratoires */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionLabel}>Résultats de laboratoire</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Résultats de laboratoire..."
              placeholderTextColor="#C7C7CC"
              value={objective?.labs || ''}
              onChangeText={(text) => updateObjectiveField('labs', text)}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Médicaments */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionLabel}>Médicaments</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Liste des médicaments (un par ligne)..."
              placeholderTextColor="#C7C7CC"
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
      <View key={section.key} style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={section.icon} size={20} color="#006CFF" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </View>

        <TextInput
          style={styles.textInput}
          placeholder={section.placeholder}
          placeholderTextColor="#C7C7CC"
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header Premium */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edition Report</Text>
          <TouchableOpacity
            style={styles.editIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="document-text-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

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
          {isUploading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#006CFF" />
              <Text style={styles.loadingText}>
                Traitement de l&apos;audio et structuration des données...
              </Text>
            </View>
          )}

          {/* Sections SOAPIE */}
          {SOAPIE_SECTIONS.map((section) => renderSOAPIESection(section))}

          {/* Bouton CTA */}
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1A1A1A',
  },
  subSection: {
    marginTop: 16,
  },
  subSectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006CFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32,
    gap: 10,
    shadowColor: '#006CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: '#A0CFFF',
    shadowOpacity: 0.1,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
