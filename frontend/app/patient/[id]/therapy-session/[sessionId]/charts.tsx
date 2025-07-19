import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPatientDetails } from '@/services/api';

export default function SessionChartsScreen() {
  const params = useLocalSearchParams();
  const results = JSON.parse(params.results as string);
  const patientId = params.id;
  const [patient, setPatient] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (patientId) {
      getPatientDetails(patientId).then(res => setPatient({ name: res.data.name })).catch(() => setPatient(null));
    }
  }, [patientId]);

  // Timeline data for line chart
  const timelineKeys = Object.keys(results.timeline);
  const timelineLabels = timelineKeys.filter((_, i) => i % 5 === 0).map(t => `${t}s`); // show every 5th label
  const timelineData = {
    labels: timelineLabels,
    datasets: [
      {
        data: timelineKeys.map((t) => emotionToY(results.timeline[t])),
        color: (opacity = 1) => `rgba(240, 82, 25, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Pie/Donut chart data
  const total = Object.values(results.emotion_summary).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(results.emotion_summary).map(([emotion, count]) => ({
    name: emotion,
    count: count,
    color: getEmotionColor(emotion),
    legendFontColor: '#7F7F7F',
    legendFontSize: 13,
    emoji: getEmotionEmoji(emotion),
    percent: Math.round((count / total) * 100),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F6F6', paddingTop: 0 }}>
      {/* Header limpio */}
      <View style={{ backgroundColor: '#fff', paddingTop: 16, paddingBottom: 8, paddingHorizontal: 0, marginBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, marginBottom: 2, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={28} color="#F05219" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#222', marginLeft: 16, marginTop: 2 }}>Detailed Charts</Text>
        {patient && (
          <Text style={{ fontSize: 15, color: '#888', marginLeft: 16, marginTop: 2 }}>{patient.name}</Text>
        )}
      </View>
      {/* Card: Line chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Emotional evolution during the session</Text>
        <LineChart
          data={timelineData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(240, 82, 25, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(120,120,120,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: '#F05219',
            },
          }}
          bezier
          withInnerLines={false}
          withOuterLines={false}
          segments={6}
          formatYLabel={y => emotionFromY(Number(y))}
          formatXLabel={(x, i) => (i % 2 === 0 ? x : '')}
          style={styles.chart}
          getDotProps={(value, index) => ({
            onPress: () => alert(`Time: ${timelineKeys[index]}s\nEmotion: ${emotionFromY(value)}`),
          })}
        />
      </View>
      <View style={{ height: 18 }} />
      {/* Card: Donut chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Emotional percentage distribution</Text>
        <PieChart
          data={pieData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[0, 0]}
          hasLegend={false}
          absolute
        />
        {/* Leyenda custom con emoji y porcentaje */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, justifyContent: 'center' }}>
          {pieData.map((item, idx) => (
            <View key={item.name} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 18, marginRight: 4 }}>{item.emoji}</Text>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: 4 }} />
              <Text style={{ color: '#444', fontWeight: 'bold', marginRight: 2 }}>{item.percent}%</Text>
              <Text style={{ color: '#888', fontSize: 13 }}>{capitalize(item.name)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function emotionToY(emotion: string): number {
  const map: { [key: string]: number } = {
    'happy': 1,
    'sad': 2,
    'angry': 3,
    'neutral': 4,
    'fear': 5,
    'disgust': 6
  };
  return map[emotion] || 0;
}
function emotionFromY(y: number): string {
  const map: { [key: number]: string } = {
    1: 'happy',
    2: 'sad',
    3: 'angry',
    4: 'neutral',
    5: 'fear',
    6: 'disgust'
  };
  return map[y] || '';
}
function getEmotionColor(emotion: string): string {
  const colors: { [key: string]: string } = {
    'happy': '#FFD700', // yellow
    'sad': '#4169E1', // blue
    'angry': '#FF4500', // orange-red
    'neutral': '#808080', // gray
    'fear': '#8e24aa', // violet
    'disgust': '#43a047' // green
  };
  return colors[emotion] || '#000000';
}
function getEmotionEmoji(emotion: string): string {
  const map: { [key: string]: string } = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'neutral': '😐',
    'fear': '😱',
    'disgust': '🤢'
  };
  return map[emotion] || '❓';
}
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
  chartCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 10,
    marginLeft: 2,
  },
}); 