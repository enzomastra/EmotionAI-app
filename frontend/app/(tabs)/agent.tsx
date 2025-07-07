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
      <ThemedView style={styles.headerWrapper}>
        <ThemedText type="title" style={styles.header}>Agent</ThemedText>
      </ThemedView>
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
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  headerWrapper: {
    backgroundColor: '#fff',
    paddingTop: 36,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  header: {
    marginBottom: 0,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 0,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 220,
    backgroundColor: '#fff',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    margin: 24,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#F05219',
    fontWeight: '600',
    fontSize: 18,
    opacity: 0.85,
  },
});