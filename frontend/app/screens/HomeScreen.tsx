import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView variant="card" style={styles.card}>
        <ThemedText type="title" style={styles.title}>Welcome to EmotionAI</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>Your emotion assistant</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  card: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 320,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#687076',
  },
});
