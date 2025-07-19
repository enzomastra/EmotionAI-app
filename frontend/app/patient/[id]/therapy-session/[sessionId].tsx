import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getSessionDetails, updateSessionObservations, getPatientDetails } from '@/services/api';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';

interface SessionResults {
  timeline: {
    [key: string]: string;
  };
  emotion_summary: {
    [key: string]: number;
  };
}

export default function TherapySessionDetailsScreen() {
  const params = useLocalSearchParams();
  const patientId = Number(params.id);
  const sessionId = Number(params.sessionId);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [observations, setObservations] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<{ name: string; age: number } | null>(null);

  useEffect(() => {
    if (isNaN(patientId) || isNaN(sessionId)) {
      console.error('Invalid patient or session ID');
      return;
    }
    loadSessionDetails();
    loadPatientInfo();
  }, [patientId, sessionId]);

  const loadSessionDetails = async () => {
    try {
      const response = await getSessionDetails(patientId, sessionId);
      console.log('Session response:', response.data);
      // Parsear el string JSON de results
      const parsedResults = JSON.parse(response.data.results.replace(/'/g, '"'));
      setResults(parsedResults);
      setObservations(response.data.observations || '');
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientInfo = async () => {
    try {
      const response = await getPatientDetails(patientId);
      setPatient({ name: response.data.name, age: response.data.age });
    } catch (error) {
      setPatient(null);
    }
  };

  const handleSaveObservations = async () => {
    try {
      setSaving(true);
      await updateSessionObservations(patientId, sessionId, observations);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving observations:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleViewCharts = () => {
    router.push({
      pathname: `/patient/${patientId}/therapy-session/${sessionId}/charts`,
      params: { results: JSON.stringify(results) }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  if (!results) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No results available</Text>
      </View>
    );
  }

  // Convertir el resumen de emociones a un array para facilitar el renderizado
  const emotionSummaryArray = Object.entries(results.emotion_summary || {}).map(([emotion, count]) => ({
    emotion,
    count
  }));

  // Convertir la línea de tiempo a un array para facilitar el renderizado
  const timelineArray = Object.entries(results.timeline || {}).map(([timestamp, emotion]) => ({
    timestamp,
    emotion
  }));

  function getEmotionInfo(emotion) {
    const e = emotion.toLowerCase();
    if (["happy", "surprised", "excited", "content"].includes(e)) return { color: '#4CAF50', emoji: '🙂' };
    if (["sad", "angry"].includes(e)) return { color: '#F44336', emoji: '😔' };
    if (e === 'fear') return { color: '#F44336', emoji: '😨' };
    if (e === 'disgust') return { color: '#F44336', emoji: '🤢' };
    if (["neutral", "calm"].includes(e)) return { color: '#FFC107', emoji: '😐' };
    return { color: '#BDBDBD', emoji: '❓' };
  }

  function EmotionChip({ emotion, count }) {
    const { color, emoji } = getEmotionInfo(emotion);
    return (
      <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color }]}> 
        <Text style={{ fontSize: 18, marginRight: 4 }}>{emoji}</Text>
        <Text style={{ fontWeight: 'bold', color }}>{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</Text>
        <View style={[styles.chipBadge, { backgroundColor: color }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{count}</Text>
        </View>
      </View>
    );
  }

  function TimelineVisual({ timeline }) {
    // Agrupa emociones consecutivas
    const grouped = [];
    let last = null;
    timeline.forEach(({ timestamp, emotion }, idx) => {
      if (!last || last.emotion !== emotion) {
        last = { emotion, start: Number(timestamp), end: Number(timestamp) };
        grouped.push(last);
      } else {
        last.end = Number(timestamp);
      }
    });
    return (
      <View style={styles.timelineContainer}>
        {grouped.map((item, idx) => {
          const { color, emoji } = getEmotionInfo(item.emotion);
          return (
            <View key={idx} style={styles.timelineRow}>
              {/* Línea vertical */}
              <View style={[styles.timelineBar, idx === 0 && { opacity: 0 }]} />
              {/* Chip */}
              <View style={[styles.timelineChip, { backgroundColor: color + '22', borderColor: color }]}> 
                <Text style={{ fontSize: 16, marginRight: 4 }}>{emoji}</Text>
                <Text style={{ fontWeight: 'bold', color }}>{item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1)}</Text>
                <Text style={{ color: '#888', marginLeft: 8, fontSize: 13 }}>{item.start}s - {item.end}s</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F6F6F6' }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingTop: 16, paddingBottom: 8, paddingHorizontal: 0, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => router.replace(`/patient/${patientId}`)} style={{ marginLeft: 16, marginBottom: 2, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={28} color="#F05219" />
        </TouchableOpacity>
        {patient && (
          <View style={{ marginLeft: 16, marginTop: 2 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222' }}>{patient.name}</Text>
            <Text style={{ fontSize: 15, color: '#888', marginTop: 2 }}>Age: {patient.age}</Text>
          </View>
        )}
      </View>
      {/* Clinical Observations */}
      <TouchableOpacity
        style={styles.obsCardImproved}
        activeOpacity={0.85}
        onPress={() => setIsEditing(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <MaterialCommunityIcons name="notebook-edit-outline" size={22} color="#F05219" style={{ marginRight: 10 }} />
          <Text style={styles.obsTitleImproved}>Clinical Observations</Text>
        </View>
        {isEditing ? (
          <View style={{ marginTop: 8 }}>
            <TextInput
              style={styles.obsInput}
              value={observations}
              onChangeText={setObservations}
              multiline
              placeholder="Add relevant clinical comments..."
            />
            <View style={styles.obsEditActions}>
              <TouchableOpacity style={[styles.obsEditBtn2, { backgroundColor: '#F05219' }]} onPress={handleSaveObservations} disabled={saving}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.obsEditBtn2, { backgroundColor: '#eee' }]} onPress={() => setIsEditing(false)} disabled={saving}>
                <Text style={{ color: '#F05219', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.obsTextImproved}>
            {observations ? observations : <Text style={{ color: '#bbb' }}>No observations yet, add relevant clinical comments</Text>}
          </Text>
        )}
      </TouchableOpacity>
      {/* Visual separation */}
      <View style={{ height: 18 }} />
      {/* Emotion Summary Chips */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Emotion Summary</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {emotionSummaryArray
            .sort((a, b) => b.count - a.count)
            .map((item, idx) => (
              <EmotionChip key={item.emotion} emotion={item.emotion} count={item.count} />
            ))}
        </View>
        <TouchableOpacity style={[styles.chartsBtn, { backgroundColor: '#F05219' }]} onPress={handleViewCharts}>
          <MaterialCommunityIcons name="chart-bar" size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>View detailed charts</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 18 }} />
      {/* Timeline visual */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {timelineArray.length > 0 ? (
          <TimelineVisual timeline={timelineArray} />
        ) : (
          <Text style={styles.noDataText}>No timeline data available</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 5,
  },
  emotionName: {
    fontSize: 16,
    color: '#333',
  },
  emotionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F05219',
  },
  timelineItem: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  observationsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  editButton: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartButton: {
    backgroundColor: '#9C27B0',
  },
  obsCard: {
    backgroundColor: '#F3F3F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  obsTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
    flex: 1,
  },
  obsEditBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 4,
    borderRadius: 16,
  },
  obsText: {
    color: '#444',
    fontSize: 15,
    marginTop: 10,
  },
  obsInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 60,
    color: '#222',
  },
  obsEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  obsEditBtn2: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipBadge: {
    marginLeft: 8,
    backgroundColor: '#F05219',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContainer: {
    marginTop: 8,
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#F05219',
    paddingLeft: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  timelineBar: {
    position: 'absolute',
    left: -14,
    top: -10,
    width: 2,
    height: 30,
    backgroundColor: '#F05219',
    zIndex: 0,
  },
  timelineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
    borderColor: '#F05219',
    marginBottom: 2,
  },
  chartsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A259FF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnTop: {
    marginLeft: 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  obsCardImproved: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 10,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  obsTitleImproved: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
  },
  obsEditBtnImproved: {
    marginLeft: 8,
    marginTop: 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  obsTextImproved: {
    color: '#444',
    fontSize: 15,
    marginTop: 10,
    marginLeft: 4,
  },
}); 