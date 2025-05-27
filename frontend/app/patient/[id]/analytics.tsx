import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { getPatientEmotionSummary, getPatientEmotionsBySession } from '@/services/api';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral';

const emotionColors: Record<EmotionType, string> = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF4500',
  surprised: '#9370DB',
  fearful: '#808080',
  disgusted: '#228B22',
  neutral: '#A9A9A9',
};

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

  const preparePieChartData = (data: EmotionSummary[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map((item) => ({
      name: item.emotion,
      count: item.count,
      color: emotionColors[item.emotion.toLowerCase() as EmotionType] || '#000000',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const prepareBarChartData = (sessionId: string) => {
    const session = sessionData[sessionId];
    if (!session || !session.emotions || session.emotions.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }

    const emotions = session.emotions.reduce((acc, curr) => {
      acc[curr.emotion] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(emotions),
      datasets: [{
        data: Object.values(emotions)
      }]
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  const pieData = preparePieChartData(summary);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Overall Emotion Distribution</Text>
      {pieData.length > 0 ? (
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      ) : (
        <Text style={styles.noDataText}>No emotion data available</Text>
      )}

      <Text style={styles.title}>Emotions by Session</Text>
      {Object.keys(sessionData).length > 0 ? (
        Object.entries(sessionData).map(([sessionId, session]) => {
          const barData = prepareBarChartData(sessionId);
          if (barData.labels.length === 0) return null;

          return (
            <View key={sessionId} style={styles.sessionContainer}>
              <Text style={styles.sessionTitle}>
                Session {sessionId} - {new Date(session.date).toLocaleDateString()}
              </Text>
              <BarChart
                data={barData}
                width={screenWidth - 32}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={30}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          );
        })
      ) : (
        <Text style={styles.noDataText}>No session data available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  sessionContainer: {
    marginVertical: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
}); 