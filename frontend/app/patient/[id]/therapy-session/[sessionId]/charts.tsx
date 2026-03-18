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
  const patientId = Number(params.id);
  const [patient, setPatient] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (patientId) {
      getPatientDetails(patientId).then(res => setPatient({ name: res.data.name })).catch(() => setPatient(null));
    }
  }, [patientId]);

  // Timeline data for line chart
  const timelineKeys = Object.keys(results.timeline);
  const maxLabels = 6;
  const stepCount = Math.ceil(timelineKeys.length / maxLabels);
  
  const timelineLabels = timelineKeys.map((t, i) => {
    if (i === 0 || i === timelineKeys.length - 1 || i % stepCount === 0) {
      return `${t}s`;
    }
    return '';
  });
  
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
  const total = Object.values(results.emotion_summary as { [key: string]: number }).reduce((a: number, b: number) => a + b, 0);
  const pieData = Object.entries(results.emotion_summary as { [key: string]: number }).map(([emotion, count]) => ({
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
            labelColor: (opacity = 1) => `rgba(100,100,100,${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '3',
              strokeWidth: '1.5',
              stroke: '#F05219',
            },
            propsForBackgroundLines: {
              strokeDasharray: '4 4',
              stroke: 'rgba(0, 0, 0, 0.05)',
              strokeWidth: 1,
            },
          }}
          withInnerLines={true}
          withOuterLines={false}
          segments={6}
          formatYLabel={y => emotionFromY(Math.round(Number(y)))}
          style={{ marginVertical: 8, borderRadius: 16 }}
          getDotProps={(value, index) => ({
            onPress: () => alert(`Time: ${timelineKeys[index]}s\nEmotion: ${emotionFromY(Math.round(Number(value)))}`),
          })}
        />
      </View>
      <View style={{ height: 18 }} />
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Emotional percentage distribution</Text>
        <PieChart
          data={pieData}
          width={Dimensions.get('window').width - 40}
          height={180}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft={((Dimensions.get('window').width - 40) / 4).toString()} // Counteract legend bug
          center={[0, 0]}
          hasLegend={false}
          absolute
        />
        {/* Leyenda en formato Grid de Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, justifyContent: 'flex-start', gap: 8 }}>
          {pieData.map((item) => (
            <View 
              key={item.name} 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: item.color + '1A', // 10% opacity
                borderColor: item.color,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: '31.5%', // 3 columns
                justifyContent: 'center'
              }}
            >
              <Text style={{ fontSize: 20, marginRight: 6 }}>{item.emoji}</Text>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 15 }}>{item.percent}%</Text>
                <Text style={{ color: '#666', fontSize: 11, fontWeight: '600' }}>{capitalize(item.name)}</Text>
              </View>
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
    'disgust': 6,
    'surprise': 7
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
    6: 'disgust',
    7: 'surprise'
  };
  return map[y] || '';
}
function getEmotionColor(emotion: string): string {
  const colors: { [key: string]: string } = {
    'happy': '#FFD54F',    // Ámbar cálido
    'sad': '#42A5F5',      // Azul moderno
    'angry': '#EF5350',    // Rojo Coral
    'neutral': '#B0BEC5',  // Gris Azulado
    'fear': '#AB47BC',     // Púrpura
    'disgust': '#66BB6A',  // Verde Esmeralda
    'surprise': '#26C6DA'  // Cian
  };
  return colors[emotion] || '#B0BEC5';
}
function getEmotionEmoji(emotion: string): string {
  const map: { [key: string]: string } = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'neutral': '😐',
    'fear': '😱',
    'disgust': '🤢',
    'surprise': '😲'
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