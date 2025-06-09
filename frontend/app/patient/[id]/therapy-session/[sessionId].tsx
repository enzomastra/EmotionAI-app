import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getSessionDetails, updateSessionObservations } from '@/services/api';

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

  useEffect(() => {
    if (isNaN(patientId) || isNaN(sessionId)) {
      console.error('Invalid patient or session ID');
      return;
    }
    loadSessionDetails();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Observations</Text>
        {isEditing ? (
          <View>
            <TextInput
              style={styles.observationsInput}
              value={observations}
              onChangeText={setObservations}
              multiline
              placeholder="Add your observations here..."
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSaveObservations}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setIsEditing(false)}
                disabled={saving}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.observationsText}>
              {observations || 'No observations added yet'}
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.editButton]} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Observations</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emotion Summary</Text>
          <TouchableOpacity 
            style={[styles.button, styles.chartButton]} 
            onPress={handleViewCharts}
          >
            <Text style={styles.buttonText}>View Charts</Text>
          </TouchableOpacity>
        </View>
        {emotionSummaryArray.length > 0 ? (
          emotionSummaryArray.map((item, index) => (
            <View key={index} style={styles.emotionItem}>
              <Text style={styles.emotionName}>{item.emotion}</Text>
              <Text style={styles.emotionCount}>{item.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No emotion summary available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {timelineArray.length > 0 ? (
          timelineArray.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.timestamp}>Time: {item.timestamp}s</Text>
              <Text style={styles.emotionName}>Emotion: {item.emotion}</Text>
            </View>
          ))
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
}); 