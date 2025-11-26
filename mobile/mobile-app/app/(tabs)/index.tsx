/**
 * Écran Dashboard Home - Design médical moderne
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import PatientSelectionModal, { PatientSelectionResult } from '@/components/PatientSelectionModal';
import { notesApiService, Note } from '@/services/notesApi';

interface RecentFileItemProps {
  note: Note;
  onPress?: () => void;
}

function RecentFileItem({ note, onPress }: RecentFileItemProps) {
  // Formater le nom du fichier depuis l'URL PDF ou créer un nom par défaut
  const getFileName = () => {
    if (note.pdf_url) {
      const urlParts = note.pdf_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return fileName || 'Note.pdf';
    }
    // Créer un nom basé sur la date
    const date = new Date(note.created_at);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '_');
    return `Note_${dateStr}.pdf`;
  };

  // Formater la date relative
  const getRelativeDate = () => {
    const now = new Date();
    const noteDate = new Date(note.created_at || note.recorded_at || now);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    // Format date complète si plus ancien
    return noteDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const patientName = note.patients?.full_name || 'Patient inconnu';

  return (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fileIconContainer}>
        <Ionicons name="document-text" size={24} color="#007AFF" />
      </View>
      <View style={styles.fileContent}>
        <Text style={styles.fileName} numberOfLines={1}>
          {getFileName()}
        </Text>
        <Text style={styles.filePatient}>{patientName}</Text>
        <Text style={styles.fileDate}>{getRelativeDate()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const firstName = user?.full_name?.split(' ')[0] || '';

  // Fonction pour charger les notes récentes
  const loadRecentNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const notes = await notesApiService.getRecentNotes(10);
      setRecentNotes(notes);
    } catch (error: any) {
      console.error('Erreur lors du chargement des notes récentes:', error);
      // En cas d'erreur, on garde un tableau vide
      setRecentNotes([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Charger les notes récentes au montage et quand l'écran est focus
  useEffect(() => {
    loadRecentNotes();
  }, []);

  // Recharger quand l'écran est focus (pour éviter d'afficher des rapports supprimés)
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      loadRecentNotes();
    });
    return unsubscribe;
  }, [router]);

  const handleNotePress = (note: Note) => {
    // Vérifier que la note a un PDF (c'est un rapport généré)
    if (!note.pdf_url) {
      console.warn('⚠️ Note sans PDF - impossible d\'ouvrir les détails');
      Alert.alert(
        'Rapport non disponible',
        'Ce rapport n\'a pas encore été généré. Veuillez générer le PDF depuis l\'écran d\'édition.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigation vers l'écran de détails du rapport
    if (note.id) {
      router.push({
        pathname: '/report/details',
        params: { reportId: note.id },
      });
    } else if (note.pdf_url) {
      // Fallback: ouvrir le PDF directement si pas d'ID
      console.log('Ouverture du PDF:', note.pdf_url);
      router.push({
        pathname: '/pdf-viewer',
        params: { pdf_url: note.pdf_url, report_id: note.id || '' },
      });
    }
  };

  const handleNewDictation = () => {
    setShowPatientModal(true);
  };

  const handlePatientSelected = (result: PatientSelectionResult) => {
    console.log('🔵 handlePatientSelected appelé avec:', result);
    setShowPatientModal(false);
    
    // Construire les paramètres de route
    const params: Record<string, string> = {
      patientId: result.patientId || '',
      skip: result.skip ? 'true' : 'false',
    };
    
    if (result.patientData) {
      params.patientData = JSON.stringify(result.patientData);
    }
    
    console.log('🔵 Navigation vers /record avec params:', params);
    
    // Utiliser un délai pour s'assurer que le modal est fermé
    setTimeout(() => {
      try {
        // Construire l'URL avec les paramètres de requête
        const queryString = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        
        const fullPath = `/record?${queryString}`;
        console.log('🔵 Chemin complet:', fullPath);
        
        // Essayer avec router.push et un chemin absolu
        router.push(fullPath as any);
        console.log('✅ Navigation effectuée avec router.push');
      } catch (error) {
        console.error('❌ Erreur lors de la navigation:', error);
        // Fallback: essayer avec router.replace
        try {
          router.replace({
            pathname: '/record',
            params,
          } as any);
          console.log('✅ Navigation effectuée avec router.replace (fallback)');
        } catch (error2) {
          console.error('❌ Erreur avec router.replace aussi:', error2);
        }
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          {firstName && (
            <Text style={styles.subtitle}>Bonjour, {firstName}</Text>
          )}
        </View>

        {/* Bouton Nouvelle Dictée */}
        <TouchableOpacity
          style={styles.newDictationButton}
          onPress={handleNewDictation}
          activeOpacity={0.8}
        >
          <View style={styles.newDictationContent}>
            <View style={styles.micIconContainer}>
              <Ionicons name="mic" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.newDictationText}>NOUVELLE DICTÉE</Text>
          </View>
        </TouchableOpacity>

        {/* Section Recent Files */}
        <View style={styles.recentFilesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent files</Text>
            <TouchableOpacity
              onPress={() => router.push('/notes' as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filesList}>
            {isLoadingNotes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement des notes...</Text>
              </View>
            ) : recentNotes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyText}>Aucune note récente</Text>
                <Text style={styles.emptySubtext}>Créez votre première dictée</Text>
              </View>
            ) : (
              recentNotes
                .filter((note) => note.pdf_url) // Filtrer uniquement les notes avec PDF (rapports générés)
                .map((note) => (
                  <RecentFileItem
                    key={note.id}
                    note={note}
                    onPress={() => handleNotePress(note)}
                  />
                ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de sélection de patient */}
      <PatientSelectionModal
        visible={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSelect={handlePatientSelected}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 8 : 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E73',
    marginTop: 4,
  },
  newDictationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 32,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newDictationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIconContainer: {
    marginRight: 12,
  },
  newDictationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  recentFilesSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  filesList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  filePatient: {
    fontSize: 14,
    color: '#6E6E73',
    marginBottom: 2,
  },
  fileDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#6E6E73',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
});
