import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LineChart, PieChart } from 'react-native-chart-kit';

export default function SessionChartsScreen() {
  const params = useLocalSearchParams();
  const results = JSON.parse(params.results as string);

  // Preparar datos para el gráfico de líneas (timeline)
  const timelineData = {
    labels: Object.keys(results.timeline).map(t => `${t}s`),
    datasets: [{
      data: Object.values(results.timeline).map(emotion => {
        // Convertir emociones a números para el gráfico
        const emotionMap: { [key: string]: number } = {
          'happy': 1,
          'sad': 2,
          'angry': 3,
          'neutral': 4,
          'fear': 5,
          'disgust': 6
        };
        return emotionMap[emotion] || 0;
      })
    }]
  };

  // Preparar datos para el gráfico circular (emotion summary)
  const pieData = Object.entries(results.emotion_summary).map(([emotion, count]) => ({
    name: emotion,
    count: count,
    color: getEmotionColor(emotion),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12
  }));

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <LineChart
          data={timelineData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(240, 82, 25, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
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
          style={styles.chart}
        />
      </View>
    </View>
  );
}

function getEmotionColor(emotion: string): string {
  const colors: { [key: string]: string } = {
    'happy': '#FFD700',
    'sad': '#4169E1',
    'angry': '#FF4500',
    'neutral': '#808080',
    'fear': '#800080',
    'disgust': '#228B22'
  };
  return colors[emotion] || '#000000';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  chartContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 