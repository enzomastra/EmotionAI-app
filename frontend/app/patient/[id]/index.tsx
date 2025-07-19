import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Modal, ScrollView } from 'react-native';
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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getDominantEmotion(results: any) {
  // results puede ser string JSON o objeto
  let parsed = results;
  if (typeof results === 'string') {
    try {
      parsed = JSON.parse(results);
    } catch {
      return { emotion: 'Neutral', color: '#FFC107', emoji: '😐' };
    }
  }
  // Buscar emotion_summary o timeline
  let emotion = 'Neutral';
  let emoji = '😐';
  let color = '#FFC107'; // Amarillo por defecto
  if (parsed?.emotion_summary) {
    const entries = Object.entries(parsed.emotion_summary);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      emotion = entries[0][0];
    }
  }
  // Asignar color y emoji según emoción
  if (["Happy", "Surprised", "Excited", "Content"].includes(emotion)) {
    color = '#4CAF50'; // Verde
    emoji = '😊';
  } else if (["Sad", "Angry", "Disgusted", "Fearful"].includes(emotion)) {
    color = '#F44336'; // Rojo
    emoji = '😔';
  } else {
    color = '#FFC107'; // Amarillo
    emoji = '😐';
  }
  return { emotion, color, emoji };
}

function getEmotionSummary(results: any) {
  let parsed = results;
  if (typeof results === 'string') {
    try {
      parsed = JSON.parse(results);
    } catch {
      return 'Sin datos emocionales';
    }
  }
  if (parsed?.emotion_summary) {
    const summary = Object.entries(parsed.emotion_summary)
      .map(([emo, count]) => `${emo} (${count})`)
      .join(', ');
    return `Emociones predominantes: ${summary}`;
  }
  return 'Sin datos emocionales';
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' - ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getDominantEmotionInfo(results: any) {
  let parsed = results;
  if (typeof results === 'string') {
    try { parsed = JSON.parse(results); } catch { return { emotion: 'Neutral', color: '#FFC107', emoji: '😐', count: 0 }; }
  }
  let emotion = 'Neutral', emoji = '😐', color = '#FFC107', count = 0;
  if (parsed?.emotion_summary) {
    const entries = Object.entries(parsed.emotion_summary);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      emotion = entries[0][0];
      count = entries[0][1] as number;
    }
  }
  if (["Happy", "Surprised", "Excited", "Content"].includes(emotion)) { color = '#4CAF50'; emoji = '🙂'; }
  else if (["Sad", "Angry", "Disgusted", "Fearful"].includes(emotion)) { color = '#F44336'; emoji = '😔'; }
  else { color = '#FFC107'; emoji = '😐'; }
  return { emotion, color, emoji, count, summary: parsed?.emotion_summary };
}

function SessionCard({ session, onAnalytics, onPress }) {
  const [expanded, setExpanded] = useState(false);
  const { emotion, color, emoji, summary } = getDominantEmotionInfo(session.results);
  return (
    <View style={styles.sessionCardModern}>
      {/* Barra/círculo de color */}
      <View style={[styles.sessionColorBar, { backgroundColor: color }]} />
      {/* Card clickeable excepto el icono de estadísticas */}
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionDateModern}>{formatShortDate(session.date)}</Text>
            <Text style={styles.sessionSubtitle}>{emoji} Emoción predominante: {emotion}</Text>
            {expanded && summary && (
              <View style={{ marginTop: 4 }}>
                {Object.entries(summary).map(([emo, count]) => (
                  <Text key={emo} style={styles.sessionDetailText}>• {emo}: {count}</Text>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.sessionExpandBtn} activeOpacity={0.7}>
              <Text style={styles.sessionExpandText}>{expanded ? 'Ocultar detalles ▲' : 'Ver detalles ▼'}</Text>
            </TouchableOpacity>
          </View>
          {/* Emoji grande */}
          <Text style={styles.sessionBigEmoji}>{emoji}</Text>
        </View>
      </TouchableOpacity>
      {/* Ícono de gráfico */}
      <TouchableOpacity
        style={styles.sessionAnalyticsIcon}
        onPress={onAnalytics}
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: 18 }}>📊</Text>
      </TouchableOpacity>
    </View>
  );
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
  const [sessionsError, setSessionsError] = useState<string | null>(null);

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
    setSessionsError(null);
    try {
      const response = await getPatientSessions(patientId);
      setSessions(response.data);
    } catch (error: any) {
      setSessionsError(error?.message || 'Error loading sessions');
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

  // Obtener fecha de última sesión
  const lastSessionDate = sessions.length > 0 ? sessions[sessions.length - 1].date : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F6F6' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Botón de volver */}
        <TouchableOpacity onPress={() => router.replace('/patients')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#F05219" />
        </TouchableOpacity>
        {/* Encabezado del paciente */}
        <View style={[styles.cardElevated, { marginTop: 8 }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(patient?.name || '')}</Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.title}>{patient?.name || 'Patient'}</Text>
              <Text style={styles.subtitle}>Edad: {patient?.age || 'N/A'}</Text>
            </View>
          </View>
          {lastSessionDate && (
            <Text style={styles.lastSessionText}>
              Última sesión: {formatDate(lastSessionDate)}
            </Text>
          )}
        </View>

        {/* Observaciones */}
        <View style={[styles.cardElevated, { marginTop: 16 }]}> 
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
                  <Text style={styles.editButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.observationsText}>{patient?.observations || 'No observations yet'}</Text>
          )}
        </View>

        {/* Botones de acción tipo pill */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.pillButton} onPress={handleViewAnalytics}>
              <Ionicons name="bar-chart" size={20} color="#F05219" style={{ marginRight: 8 }} />
              <Text style={styles.pillButtonText}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={() => setShowNotesModal(true)}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F05219" style={{ marginRight: 8 }} />
              <Text style={styles.pillButtonText}>Notes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Lista de sesiones moderna */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Sesiones</Text>
          {sessions.length === 0 ? (
            <Text>No sessions yet</Text>
          ) : (
            sessions.map((item, idx) => (
              <SessionCard
                key={item.id || idx}
                session={item}
                onAnalytics={() => handleSessionPress(item.id)}
                onPress={() => handleSessionPress(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
      {/* FAB para nueva sesión */}
      <TouchableOpacity style={styles.fab} onPress={handleNewSession} activeOpacity={0.85}>
        <View style={styles.fabInner}>
          <Ionicons name="videocam" size={28} color="#fff" />
          <View style={styles.fabPlus}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>+</Text>
          </View>
        </View>
      </TouchableOpacity>
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
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  analyticsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  notesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  sessionItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionDate: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#F05219',
  },
  sessionResults: {
    color: '#333',
    marginTop: 2,
  },
  cardElevated: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F05219',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
  },
  lastSessionText: {
    marginTop: 10,
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5D0',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  pillButtonText: {
    color: '#F05219',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
    minHeight: 64,
  },
  sessionIndicator: {
    width: 8,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    height: '100%',
  },
  sessionContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sessionDate: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#F05219',
  },
  sessionSummary: {
    color: '#333',
    marginTop: 2,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabInner: {
    backgroundColor: '#F05219',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabPlus: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 64,
    position: 'relative',
  },
  sessionColorBar: {
    width: 8,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    alignSelf: 'flex-start',
  },
  sessionDateModern: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#F05219',
  },
  sessionSubtitle: {
    color: '#333',
    fontSize: 14,
    marginTop: 2,
  },
  sessionBigEmoji: {
    fontSize: 32,
    marginLeft: 12,
    marginRight: 2,
  },
  sessionAnalyticsIcon: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    backgroundColor: '#FFE5D0',
    borderRadius: 16,
    padding: 4,
    elevation: 1,
  },
  sessionExpandBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  sessionExpandText: {
    color: '#F05219',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sessionDetailText: {
    color: '#666',
    fontSize: 13,
    marginLeft: 4,
  },
}); 