import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ResultsScreen() {
  const { summary, timeline } = useLocalSearchParams();

  // Decodificar y procesar los parámetros
  const parsedSummary = summary ? JSON.parse(summary as string) : null;
  const parsedTimeline = timeline ? JSON.parse(timeline as string) : null;

  if (!parsedSummary || !parsedTimeline) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se pudieron cargar los resultados. Por favor, intenta nuevamente.
        </Text>
      </View>
    );
  }

  // Datos para gráfico de barras
  const barChartData = {
    labels: Object.keys(parsedSummary),
    datasets: [{ data: Object.values(parsedSummary) }],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resultados de la emoción</Text>

      <Text style={styles.subtitle}>Resumen de emociones</Text>
      <BarChart
        data={barChartData}
        width={screenWidth - 40}
        height={220}
        fromZero
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(240, 82, 25, ${opacity})`,
          labelColor: () => '#000',
        }}
        style={styles.chart}
      />

      <Text style={styles.subtitle}>Evolución emocional en el tiempo</Text>
      <View style={styles.timelineContainer}>
        {Object.entries(parsedTimeline).map(([time, emotion], index) => (
          <Text key={index} style={styles.timelineItem}>
            {time}s: {emotion}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timelineContainer: {
    marginTop: 16,
  },
  timelineItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});