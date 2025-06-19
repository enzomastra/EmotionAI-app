import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import PatientSessionSelector from '../../components/PatientSessionSelector';
import ChatInterface from '../../components/ChatInterface';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';

export default function AgentScreen() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);

  const refreshScreen = () => {
    setRefreshing(true);
    setSelectedPatient(null);
    setSelectedSession(null);
    setSelectedPatientName('');
    setKey(prev => prev + 1);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshScreen();
  }, []);

  const handleSelect = (patientId: number, patientName: string, sessionId?: number) => {
    setSelectedPatient(patientId);
    setSelectedPatientName(patientName);
    setSelectedSession(sessionId || null);
  };

  return (
    <ThemedView key={key} style={styles.container}>
      <ThemedText type="title" style={styles.header}>Agent</ThemedText>
      <ThemedView style={styles.content}>
        <PatientSessionSelector onSelect={handleSelect} showSessionSelector={true} />
        {selectedPatient ? (
          <ChatInterface
            key={`chat-${selectedPatient}-${selectedSession}`}
            patientId={selectedPatient}
            patientName={selectedPatientName}
          />
        ) : (
          <ThemedView variant="card" style={styles.placeholderContainer}>
            <ThemedText type="subtitle" style={styles.placeholderText}>
              Select a patient to start chatting with the agent
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 8,
  },
  header: {
    marginBottom: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#687076',
  },
});