import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getPatients, getPatientSessions } from '@/services/api';

interface Patient {
  id: number;
  name: string;
  age: number;
}

interface Session {
  id: number;
  date: string;
}

interface PatientSessionSelectorProps {
  onSelect: (patientId: number, patientName: string, sessionId?: number) => void;
  showSessionSelector?: boolean;
}

export default function PatientSessionSelector({ 
  onSelect,
  showSessionSelector = true 
}: PatientSessionSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setSelectedPatient(patient);
    if (showSessionSelector) {
      setLoadingSessions(true);
      try {
        const response = await getPatientSessions(patient.id);
        setSessions(response.data);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    }
  };

  const handleSessionSelect = (sessionId: number) => {
    if (selectedPatient) {
      onSelect(selectedPatient.id, selectedPatient.name, sessionId);
      setShowModal(false);
    }
  };

  const handlePatientOnlySelect = (patient: Patient) => {
    onSelect(patient.id, patient.name);
    setShowModal(false);
  };

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={[
        styles.patientItem,
        selectedPatient?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handlePatientSelect(item)}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>Age: {item.age}</Text>
      </View>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => handlePatientOnlySelect(item)}
      >
        <Text style={styles.selectButtonText}>Select Patient</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.sessionItem}
      onPress={() => handleSessionSelect(item.id)}
    >
      <Text style={styles.sessionDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowModal(true)}
      >
        <FontAwesome name="user" size={20} color="#fff" />
        <Text style={styles.selectorButtonText}>
          {selectedPatient ? `Chat with ${selectedPatient.name}` : 'Select Patient'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Patient</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#F05219" />
            ) : (
              <FlatList
                data={patients}
                renderItem={renderPatient}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.patientsList}
              />
            )}

            {showSessionSelector && selectedPatient && (
              <View style={styles.sessionsContainer}>
                <Text style={styles.sessionsTitle}>Or select a specific session:</Text>
                {loadingSessions ? (
                  <ActivityIndicator size="small" color="#F05219" />
                ) : (
                  <FlatList
                    data={sessions}
                    renderItem={renderSession}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.sessionsList}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F05219',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  selectorButtonText: {
    color: '#fff',
    fontSize: 17,
    marginLeft: 10,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 22,
    width: '92%',
    maxHeight: '82%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  patientsList: {
    paddingBottom: 16,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240,82,25,0.07)',
    transition: 'background-color 0.2s',
  },
  selectedItem: {
    backgroundColor: 'rgba(240,82,25,0.08)',
    borderColor: '#F05219',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  patientAge: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  selectButton: {
    backgroundColor: '#F05219',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sessionsContainer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingTop: 18,
  },
  sessionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F05219',
    marginBottom: 10,
  },
  sessionsList: {
    paddingBottom: 12,
  },
  sessionItem: {
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,82,25,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionDate: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
}); 