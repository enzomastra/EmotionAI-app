import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, StyleSheet as RNStyleSheet, Modal } from 'react-native';
import PatientSessionSelector from '../../components/PatientSessionSelector';
import ChatInterface from '../../components/ChatInterface';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { FontAwesome } from '@expo/vector-icons';

export default function AgentScreen() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);
  const [showPatientMenu, setShowPatientMenu] = useState(false);

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

  const handleChangePatient = () => {
    setSelectedPatient(null);
    setSelectedSession(null);
    setSelectedPatientName('');
    setShowPatientMenu(false);
  };

  const handleClearChat = () => {
    setKey(prev => prev + 1); // fuerza recarga del chat
    setShowPatientMenu(false);
  };

  return (
    <ThemedView key={key} style={styles.container}>
      <ThemedView style={styles.headerWrapper}>
        <ThemedText type="title" style={styles.header}>Agent</ThemedText>
      </ThemedView>
      <ThemedView style={styles.content}>
        {!selectedPatient ? (
          <PatientSessionSelector onSelect={handleSelect} showSessionSelector={true} />
        ) : null}
        {selectedPatient ? (
          <ChatInterface
            key={`chat-${selectedPatient}-${selectedSession}`}
            patientId={selectedPatient}
            patientName={selectedPatientName}
            patientBubble={
              <>
                <TouchableOpacity style={styles.patientBubbleButton} onPress={() => setShowPatientMenu(true)}>
                  <View style={styles.patientBubbleIconCircle}>
                    <FontAwesome name="user" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
                  <Modal
                    visible={showPatientMenu}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowPatientMenu(false)}
                  >
                    <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowPatientMenu(false)}>
                      <View style={styles.patientMenuAbsolute}>
                        <View style={styles.patientMenu}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <FontAwesome name="user" size={18} color="#F05219" style={{ marginRight: 8 }} />
                            <ThemedText style={{ color: '#222', fontWeight: 'bold', fontSize: 15 }}>{selectedPatientName}</ThemedText>
                          </View>
                          <TouchableOpacity style={styles.menuItem} onPress={handleChangePatient}>
                            <FontAwesome name="exchange" size={18} color="#F05219" style={{ marginRight: 8 }} />
                            <ThemedText style={styles.menuItemText}>Change patient</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
                            <FontAwesome name="trash" size={18} color="#F05219" style={{ marginRight: 8 }} />
                            <ThemedText style={styles.menuItemText}>Clear chat</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>
              </>
            }
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
    paddingTop: 16,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  header: {
    marginBottom: 2,
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
  patientBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 16,
  },
  patientBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 2,
  },
  patientBubbleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  patientMenu: {
    marginTop: 80,
    marginLeft: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 4,
    minWidth: 170,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  menuItemText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '500',
  },
  patientMenuAbsolute: {
    position: 'absolute',
    left: 28,
    bottom: 100,
    zIndex: 100,
  },
  patientBubbleButton: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#F05219',
    marginRight: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  patientBubbleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F05219',
    justifyContent: 'center',
    alignItems: 'center',
  },
});