import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPatientEmotionSummary, getPatientEmotionsBySession } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

interface EmotionSummary {
  emotion: string;
  count: number;
}

interface SessionData {
  date: string;
  emotions: EmotionSummary[];
}

interface AnalyticsData {
  [sessionId: string]: SessionData;
}

export default function PatientAnalytics() {
  const params = useLocalSearchParams();
  const patientId = Number(params.id);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EmotionSummary[]>([]);
  const [sessionData, setSessionData] = useState<AnalyticsData>({});
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    if (isNaN(patientId)) {
      console.error('Invalid patient ID');
      return;
    }
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        getPatientEmotionSummary(patientId),
        getPatientEmotionsBySession(patientId)
      ]);

      setSummary(summaryRes.data || []);
      setSessionData(sessionsRes.data || {});
    } catch (error) {
      console.error('Error loading analytics:', error);
      setSummary([]);
      setSessionData({});
    } finally {
      setLoading(false);
    }
  };

  const renderBarChart = (data: EmotionSummary[]) => {
    const maxCount = Math.max(...data.map(item => item.count));
    const barWidth = (screenWidth - 64) / data.length;

    return (
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * 200;
          return (
            <View key={index} style={styles.barContainer}>
              <View style={[styles.bar, { height: barHeight }]} />
              <Text style={styles.barLabel}>{item.emotion}</Text>
              <Text style={styles.barValue}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#F05219" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          {showCharts ? 'Emotion Charts' : 'Emotion Distribution'}
        </Text>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setShowCharts(!showCharts)}
        >
          <Ionicons 
            name={showCharts ? "list" : "bar-chart"} 
            size={24} 
            color="#F05219" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {summary.length > 0 ? (
          showCharts ? (
            renderBarChart(summary)
          ) : (
            summary.map((item, index) => (
              <View key={index} style={styles.emotionItem}>
                <Text style={styles.emotionName}>{item.emotion}</Text>
                <Text style={styles.emotionCount}>{item.count}</Text>
              </View>
            ))
          )
        ) : (
          <Text style={styles.noDataText}>No emotion data available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotions by Session</Text>
        {Object.keys(sessionData).length > 0 ? (
          Object.entries(sessionData).map(([sessionId, session]) => (
            <View key={sessionId} style={styles.sessionContainer}>
              <Text style={styles.sessionTitle}>
                Session {sessionId} - {new Date(session.date).toLocaleDateString()}
              </Text>
              {showCharts ? (
                renderBarChart(session.emotions)
              ) : (
                session.emotions.map((emotion, index) => (
                  <View key={index} style={styles.emotionItem}>
                    <Text style={styles.emotionName}>{emotion.emotion}</Text>
                    <Text style={styles.emotionCount}>{emotion.count}</Text>
                  </View>
                ))
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No session data available</Text>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  toggleButton: {
    padding: 8,
  },
  sessionContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emotionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
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
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  barContainer: {
    alignItems: 'center',
    width: 40,
  },
  bar: {
    width: 20,
    backgroundColor: '#F05219',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 