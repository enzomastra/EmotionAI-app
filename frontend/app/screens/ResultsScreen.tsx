import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResultsScreen() {
  const { summary, timeline } = useLocalSearchParams();

  const emotionSummary = summary ? JSON.parse(decodeURIComponent(summary)) : {};
  const timelineData = timeline ? JSON.parse(decodeURIComponent(timeline)) : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Resultados del análisis</Text>

      <Text style={styles.sectionTitle}>Resumen de emociones</Text>
      {Object.entries(emotionSummary).map(([emotion, count]) => (
        <View key={emotion} style={styles.summaryItem}>
          <Text style={styles.emotion}>{emotion}</Text>
          <Text style={styles.count}>{count}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Línea de tiempo</Text>
      {timelineData.map((entry, index) => (
        <View key={index} style={styles.timelineItem}>
          <Text style={styles.time}>{entry.timestamp}</Text>
          <Text style={styles.emotion}>{entry.emotion}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  timelineItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
  },
  emotion: {
    fontSize: 16,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: '#555',
  },
});
