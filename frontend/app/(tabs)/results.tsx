import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, RefreshControl } from 'react-native';
import PatientSessionSelector from '../../components/PatientSessionSelector';
import ChatInterface from '../../components/ChatInterface';

export default function ResultsScreen() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0); // Clave para forzar el re-render

  // Función para refrescar la pantalla
  const refreshScreen = () => {
    setRefreshing(true);
    setSelectedPatient(null);
    setSelectedSession(null);
    setSelectedPatientName('');
    setKey(prev => prev + 1); // Incrementar la clave para forzar el re-render
    setRefreshing(false);
  };

  // Refrescar cuando se monta el componente
  useEffect(() => {
    refreshScreen();
  }, []);

  const onRefresh = React.useCallback(() => {
    refreshScreen();
  }, []);

  const handleSelect = (patientId: number, patientName: string, sessionId?: number) => {
    setSelectedPatient(patientId);
    setSelectedPatientName(patientName);
    setSelectedSession(sessionId || null);
  };

  return (
    <View 
      key={key} // Usar la clave para forzar el re-render
      style={styles.container}
    >
      <View style={styles.content}>
        <PatientSessionSelector
          onSelect={handleSelect}
          showSessionSelector={true}
        />
        
        {selectedPatient ? (
          <ChatInterface
            key={`chat-${selectedPatient}-${selectedSession}`} // Forzar re-render del chat
            patientId={selectedPatient}
            patientName={selectedPatientName}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Selecciona un paciente para comenzar a chatear con el agente
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});