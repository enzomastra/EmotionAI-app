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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectorButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  patientsList: {
    paddingBottom: 16,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#f5f5f5',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: '#F05219',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  sessionsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  sessionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sessionsList: {
    paddingBottom: 16,
  },
  sessionItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: '#333',
  },
}); 