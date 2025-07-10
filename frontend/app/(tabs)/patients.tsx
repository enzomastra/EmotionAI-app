import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPatients, getPatientLastDominantEmotion } from '../../services/api';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

interface Patient {
  id: number;
  name: string;
  age: number;
}

interface PatientWithEmotion extends Patient {
  dominantEmotion?: string | null;
}

const FILTERS = [
  { key: 'name', label: 'Buscar por nombre' },
  { key: 'age', label: 'Buscar por edad' },
];

export default function PatientsScreen() {
  const [patients, setPatients] = useState<PatientWithEmotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'name' | 'age'>('name');
  const [searchAge, setSearchAge] = useState('');
  const [searching, setSearching] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const router = useRouter();

  const loadPatients = async (params?: { name?: string; age?: number }) => {
    setLoading(true);
    try {
      const response = await getPatients(params);
      const patientsData: Patient[] = response.data;
      // Obtener la última emoción dominante para cada paciente
      const withEmotions = await Promise.all(
        patientsData.map(async (p) => {
          try {
            const res = await getPatientLastDominantEmotion(p.id);
            return { ...p, dominantEmotion: res.data.dominant_emotion };
          } catch {
            return { ...p, dominantEmotion: null };
          }
        })
      );
      setPatients(withEmotions);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const handleAddPatient = () => {
    router.push('/patient/new');
  };

  const handlePatientPress = (patientId: number) => {
    router.push(`/patient/${patientId}`);
  };

  const handleSearch = () => {
    setSearching(true);
    loadPatients({
      name: filter === 'name' ? search.trim() || undefined : undefined,
      age: filter === 'age' && search ? Number(search) : undefined,
    }).finally(() => setSearching(false));
  };

  const handleFilterChange = (newFilter: 'name' | 'age') => {
    setFilter(newFilter);
    setSearch('');
    setTimeout(() => {
      loadPatients({
        name: newFilter === 'name' ? undefined : undefined,
        age: newFilter === 'age' ? undefined : undefined,
      });
    }, 0);
  };

  const renderPatient = ({ item }: { item: PatientWithEmotion }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handlePatientPress(item.id)}
      activeOpacity={0.85}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="account-circle" size={38} color="#F05219" />
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>Age: {item.age}</Text>
        {item.dominantEmotion && (
          <View style={styles.emotionRow}>
            <MaterialCommunityIcons name="emoticon-happy-outline" size={18} color="#F79C65" style={{ marginRight: 4 }} />
            <Text style={styles.dominantEmotion}>
              Last dominant expression: <Text style={{ fontWeight: 'bold', color: '#F05219' }}>{item.dominantEmotion}</Text>
            </Text>
          </View>
        )}
      </View>
      <FontAwesome name="chevron-right" size={22} color="#F05219" style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPatient}
            onPressIn={() => setShowTooltip(true)}
            onPressOut={() => setTimeout(() => setShowTooltip(false), 1200)}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={22} color="#fff" />
          </TouchableOpacity>
          {showTooltip && (
            <View style={styles.tooltipBubble}>
              <Text style={styles.tooltipText}>Add Patient</Text>
              <View style={styles.tooltipArrow} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          {filter === 'name' ? (
            <FontAwesome name="search" size={18} color="#F05219" style={{ marginRight: 6 }} />
          ) : (
            <FontAwesome name="user" size={16} color="#F05219" style={{ marginRight: 6 }} />
          )}
          <TextInput
            style={styles.searchInput}
            placeholder={filter === 'name' ? 'Search by name...' : 'Search by age...'}
            placeholderTextColor="#bbb"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            keyboardType={filter === 'age' ? (Platform.OS === 'ios' ? 'number-pad' : 'numeric') : 'default'}
            maxLength={filter === 'age' ? 3 : undefined}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          <FontAwesome name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterRowBelow}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <FontAwesome name="sliders" size={18} color="#F05219" />
            <Text style={styles.filterButtonText}>Filtros</Text>
          </TouchableOpacity>
          <Modal
            visible={showFilterModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFilterModal(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
              <View style={styles.filterModalDropdown}>
                {FILTERS.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterOption, filter === f.key && styles.filterOptionActive]}
                    onPress={() => {
                      handleFilterChange(f.key as 'name' | 'age');
                      setShowFilterModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterOptionText, filter === f.key && styles.filterOptionTextActive]}>{f.label}{filter === f.key && '  ✓'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>
        </View>
      </View>
      <View style={styles.listSpacer} />
      {patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No patients found</Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first patient by clicking the + button
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.2,
  },
  addButton: {
    backgroundColor: '#F05219',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  tooltipBubble: {
    position: 'absolute',
    top: -44,
    right: -16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#F05219',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderTopColor: '#fff',
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: 'transparent',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#FAFAFA',
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginRight: 8,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  searchButton: {
    backgroundColor: '#F05219',
    borderRadius: 18,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 8,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#F05219',
    borderColor: '#F05219',
    shadowColor: '#F05219',
    shadowOpacity: 0.10,
  },
  filterChipText: {
    marginLeft: 6,
    color: '#F05219',
    fontWeight: '600',
    fontSize: 15,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
    paddingTop: 8,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#F05219',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240,82,25,0.07)',
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    color: '#222',
    letterSpacing: 0.1,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dominantEmotion: {
    fontSize: 14,
    color: '#F05219',
    marginLeft: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#F05219',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {
    color: '#F05219',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 80,
    marginRight: 24,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  filterOptionActive: {
    backgroundColor: '#F05219',
  },
  filterOptionText: {
    marginLeft: 10,
    color: '#F05219',
    fontWeight: '600',
    fontSize: 15,
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterRowBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 0,
    marginBottom: 10,
  },
  listSpacer: {
    height: 18,
  },
  filterModalDropdown: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 2,
    marginLeft: 0,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    position: 'absolute',
    left: 0,
    top: 44,
    zIndex: 20,
  },
}); 