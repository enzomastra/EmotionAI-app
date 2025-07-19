import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, StyleSheet as RNStyleSheet, Modal, Text, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import PatientSessionSelector from '../../components/PatientSessionSelector';
import ChatInterface from '../../components/ChatInterface';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPatients } from '@/services/api';
import { getPatientLastDominantEmotion } from '../../services/api';

interface PatientWithEmotion {
  id: number;
  name: string;
  age: number;
  dominantEmotion?: string | null;
}

export default function AgentScreen() {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [key, setKey] = useState(0);
  const [showPatientMenu, setShowPatientMenu] = useState(false);
  const [patients, setPatients] = useState<PatientWithEmotion[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await getPatients();
      const patientsData = response.data;
      // Obtener la última emoción dominante para cada paciente
      const withEmotions = await Promise.all(
        patientsData.map(async (p: any) => {
          try {
            const res = await getPatientLastDominantEmotion(p.id);
            return { ...p, dominantEmotion: res.data.dominant_emotion };
          } catch {
            return { ...p, dominantEmotion: null };
          }
        })
      );
      setPatients(withEmotions);
    } catch (error) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (patientId: number, patientName: string) => {
    setSelectedPatient(patientId);
    setSelectedPatientName(patientName);
    setSelectedSession(null);
  };

  const handleChangePatient = () => {
    setSelectedPatient(null);
    setSelectedSession(null);
    setSelectedPatientName('');
    setShowPatientMenu(false);
  };

  const handleClearChat = () => {
    setKey(prev => prev + 1);
    setShowPatientMenu(false);
  };

  const renderPatient = (item: PatientWithEmotion) => (
    <TouchableOpacity
      key={item.id}
      style={styles.patientCardCompact}
      activeOpacity={0.85}
      onPress={() => handleSelect(item.id, item.name)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-circle" size={32} color="#F05219" />
      </View>
      <View style={styles.patientInfoCompact}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>Age: {item.age}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={26} color="#F05219" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agent</Text>
      </View>
      {/* Si NO hay paciente seleccionado, muestra la lista y búsqueda */}
      {!selectedPatient && <>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <FontAwesome name="search" size={18} color="#F05219" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={'Search by name...'}
              placeholderTextColor="#bbb"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => {}}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={() => {}}>
            <FontAwesome name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.filterRowBelow}>
          <TouchableOpacity style={styles.filterButton} disabled>
            <MaterialCommunityIcons name="filter-variant" size={20} color="#F05219" style={{ marginRight: 6 }} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 30 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#F05219" style={{ marginTop: 40 }} />
          ) : filteredPatients.length === 0 ? (
            <Text style={{ color: '#bbb', textAlign: 'center', marginTop: 40 }}>No patients found</Text>
          ) : (
            filteredPatients.map(renderPatient)
          )}
        </ScrollView>
      </>}
      {/* Si hay paciente seleccionado, muestra SOLO el chat ocupando toda la pantalla */}
      {selectedPatient && (
        <View style={{ flex: 1 }}>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 6,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 18,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    padding: 0,
    backgroundColor: 'transparent',
  },
  searchButton: {
    backgroundColor: '#F05219',
    borderRadius: 12,
    padding: 10,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRowBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    color: '#F05219',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
  },
  patientAge: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dominantEmotion: {
    color: '#888',
    fontSize: 14,
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
  patientCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  patientInfoCompact: {
    flex: 1,
    justifyContent: 'center',
  },
  patientIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F05219',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
  },
  patientAge: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
});