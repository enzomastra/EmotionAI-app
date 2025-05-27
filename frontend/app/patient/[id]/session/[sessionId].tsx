import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getSessionDetails } from '@/services/api';

interface SessionResults {
  emotion_summary: {
    emotion: string;
    count: number;
  }[];
  timeline: {
    timestamp: string;
    emotion: string;
    confidence: number;
  }[];
}

export default function SessionDetailsScreen() {
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
      const parsedResults = JSON.parse(response.data.results);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotion Summary</Text>
        {results.emotion_summary.map((item, index) => (
          <View key={index} style={styles.emotionItem}>
            <Text style={styles.emotionName}>{item.emotion}</Text>
            <Text style={styles.emotionCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {results.timeline.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.emotionName}>{item.emotion}</Text>
            <Text style={styles.confidence}>
              Confidence: {(item.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  emotionCount: {
    fontSize: 16,
    color: '#666',
  },
  timelineItem: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 