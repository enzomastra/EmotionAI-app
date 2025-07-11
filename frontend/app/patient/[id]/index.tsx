import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { getPatientDetails, getPatientSessions, updatePatientObservations, getPatientNotes, createPatientNote, deletePatientNote } from '@/services/api';
import { AppRoutes } from '@/app/types';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { PatientNoteResponse } from '@/types';

interface Session {
  id: number;
  date: string;
  results: string;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  observations?: string;
}

export default function PatientDetailsScreen() {
  const params = useLocalSearchParams<AppRoutes['/patient/[id]']>();
  const patientId = Number(params.id);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedObservations, setEditedObservations] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState<PatientNoteResponse[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    if (isNaN(patientId)) {
      Alert.alert('Error', 'Invalid patient ID');
      router.back();
      return;
    }
    loadPatientDetails();
    loadSessions();
    loadNotes();
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [patientId])
  );

  const loadPatientDetails = async () => {
    try {
      const response = await getPatientDetails(patientId);
      setPatient(response.data);
      setEditedObservations(response.data.observations || '');
    } catch (error: any) {
      console.error('Error loading patient details:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Patient not found');
        router.back();
      }
    }
  };

  const loadSessions = async () => {
    try {
      const response = await getPatientSessions(patientId);
      setSessions(response.data);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    setNotesLoading(true);
    try {
      const response = await getPatientNotes(patientId);
      setNotes(response.data);
    } catch (error) {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleSaveObservations = async () => {
    if (!patient) return;
    
    setIsSaving(true);
    try {
      const response = await updatePatientObservations(patient.id, editedObservations);
      setPatient(response.data);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update observations');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewSession = () => {
    router.push(`/patient/${patientId}/new-session`);
  };

  const handleViewAnalytics = () => {
    router.push(`/patient/${patientId}/analytics`);
  };

  const handleSessionPress = (sessionId: number) => {
    router.push(`/patient/${patientId}/therapy-session/${sessionId}`);
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      await createPatientNote(patientId, newNoteText.trim());
      setShowAddNoteModal(false);
      setNewNoteText('');
      loadNotes();
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deletePatientNote(patientId, noteId);
          loadNotes();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete note');
        }
      }}
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.replace('/patients')} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#F05219" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{patient?.name || 'Patient'}</Text>
        <Text style={styles.subtitle}>Age: {patient?.age || 'N/A'}</Text>
        <View style={styles.observationsContainer}>
          <View style={styles.observationsHeader}>
            <Text style={styles.observationsTitle}>Observations:</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <FontAwesome name="edit" size={20} color="#F05219" />
            </TouchableOpacity>
          </View>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.observationsInput}
                value={editedObservations}
                onChangeText={setEditedObservations}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton]} 
                  onPress={() => {
                    setIsEditing(false);
                    setEditedObservations(patient?.observations || '');
                  }}
                >
                  <Text style={styles.editButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.saveButton]} 
                  onPress={handleSaveObservations}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.editButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.observationsText}>
              {patient?.observations || 'No observations yet'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
          <FontAwesome name="bar-chart" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowNotesModal(true)}>
          <FontAwesome name="sticky-note" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Notes</Text>
        </TouchableOpacity>
      </View>
      {/* FAB for New Session */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabButton} onPress={handleNewSession}>
          <FontAwesome name="video-camera" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.notesModalBox}>
            <View style={styles.notesModalHeader}>
              <Text style={styles.notesModalTitle}>Notes</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <FontAwesome name="close" size={22} color="#F05219" />
              </TouchableOpacity>
            </View>
            <View style={styles.notesHeader}>
              <TouchableOpacity style={styles.addNoteButton} onPress={() => setShowAddNoteModal(true)}>
                <FontAwesome name="plus" size={18} color="#fff" />
                <Text style={styles.addNoteButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>
            {notesLoading ? (
              <ActivityIndicator color="#F05219" />
            ) : notes.length === 0 ? (
              <Text style={styles.emptyStateSubtext}>No notes yet</Text>
            ) : (
              <FlatList
                data={notes}
                keyExtractor={note => note.id.toString()}
                renderItem={({ item: note }) => (
                  <TouchableOpacity
                    style={[styles.noteCard, expandedNoteId === note.id && styles.noteCardExpanded]}
                    onPress={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.noteHeaderRow}>
                      <Text style={styles.noteDate}>{new Date(note.created_at).toLocaleString()}</Text>
                      <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                        <FontAwesome name="trash" size={18} color="#F05219" />
                      </TouchableOpacity>
                    </View>
                    {expandedNoteId === note.id && (
                      <Text style={styles.noteText}>{note.text}</Text>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 24 }}
              />
            )}
          </View>
        </View>
      </Modal>
      {/* Add Note Modal */}
      <Modal
        visible={showAddNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddNoteModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.addNoteModalBox}>
            <Text style={styles.addNoteModalTitle}>Add Note</Text>
            <TextInput
              style={styles.addNoteInput}
              placeholder="Write your clinical note..."
              value={newNoteText}
              onChangeText={setNewNoteText}
              multiline
              editable={!addingNote}
            />
            <View style={styles.addNoteModalActions}>
              <TouchableOpacity
                style={styles.addNoteCancel}
                onPress={() => setShowAddNoteModal(false)}
                disabled={addingNote}
              >
                <Text style={styles.addNoteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addNoteConfirm}
                onPress={handleAddNote}
                disabled={addingNote || !newNoteText.trim()}
              >
                <Text style={styles.addNoteConfirmText}>{addingNote ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F05219',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  observationsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  observationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  observationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  observationsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  editContainer: {
    gap: 10,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#F05219',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notesSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addNoteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  noteCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  noteCardExpanded: {
    backgroundColor: '#fff',
    shadowOpacity: 0.12,
    elevation: 3,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteDate: {
    color: '#F05219',
    fontWeight: '600',
    fontSize: 13,
  },
  noteText: {
    color: '#333',
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    minWidth: 260,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  addNoteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F05219',
    marginBottom: 10,
  },
  addNoteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    width: 220,
    marginBottom: 18,
    backgroundColor: '#FAFAFA',
  },
  addNoteModalActions: {
    flexDirection: 'row',
    gap: 18,
  },
  addNoteCancel: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  addNoteCancelText: {
    color: '#F05219',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addNoteConfirm: {
    backgroundColor: '#F05219',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  addNoteConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    zIndex: 20,
    alignItems: 'center',
  },
  fabButton: {
    backgroundColor: '#F05219',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  notesModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    minWidth: 320,
    minHeight: 320,
    maxHeight: '80%',
    width: '90%',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  notesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notesModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F05219',
  },
}); 