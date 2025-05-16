import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../../../services/api';

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

const emotionColors = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF4500',
  surprised: '#9370DB',
  fearful: '#808080',
  disgusted: '#228B22',
  neutral: '#A9A9A9',
};

export default function PatientAnalytics() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [sessionData, setSessionData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        api.get(`/analytics/patient/${id}/emotions/summary`),
        api.get(`/analytics/patient/${id}/emotions/by-session`)
      ]);

      setSummary(summaryRes.data);
      setSessionData(sessionsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const preparePieChartData = (data) => {
    return data.map((item) => ({
      name: item.emotion,
      count: item.count,
      color: emotionColors[item.emotion.toLowerCase()] || '#000000',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const prepareBarChartData = (sessionId) => {
    const session = sessionData[sessionId];
    if (!session) return null;

    const emotions = session.emotions.reduce((acc, curr) => {
      acc[curr.emotion] = curr.count;
      return acc;
    }, {});

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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Overall Emotion Distribution</Text>
      {summary.length > 0 && (
        <PieChart
          data={preparePieChartData(summary)}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      )}

      <Text style={styles.title}>Emotions by Session</Text>
      {Object.entries(sessionData).map(([sessionId, session]) => (
        <View key={sessionId} style={styles.sessionContainer}>
          <Text style={styles.sessionTitle}>
            Session {sessionId} - {new Date(session.date).toLocaleDateString()}
          </Text>
          <BarChart
            data={prepareBarChartData(sessionId)}
            width={screenWidth - 32}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
          />
        </View>
      ))}
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
}); 