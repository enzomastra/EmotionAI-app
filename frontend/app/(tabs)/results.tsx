import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const summary = params.summary ? JSON.parse(decodeURIComponent(params.summary as string)) : null;
  const timeline = params.timeline ? JSON.parse(decodeURIComponent(params.timeline as string)) : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Resultados</Text>
      <Text style={styles.sectionTitle}>Resumen de emociones:</Text>
      <Text selectable style={styles.json}>{JSON.stringify(summary, null, 2)}</Text>
      <Text style={styles.sectionTitle}>Línea de tiempo:</Text>
      <Text selectable style={styles.json}>{JSON.stringify(timeline, null, 2)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  json: {
    marginTop: 4,
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
  },
});
