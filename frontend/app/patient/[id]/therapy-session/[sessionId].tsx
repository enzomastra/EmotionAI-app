import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getSessionDetails } from '@/services/api';

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
    } catch (error) {
      console.error('Error loading session details:', error);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.sectionTitle}>Emotion Summary</Text>
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
}); 