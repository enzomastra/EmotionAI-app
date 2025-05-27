import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPatients } from '../../services/api';
import { FontAwesome } from '@expo/vector-icons';

interface Patient {
  id: number;
  name: string;
  age: number;
}

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error: any) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // Recargar la lista cuando la pantalla recibe el foco
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

  const renderPatient = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => handlePatientPress(item.id)}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientAge}>Age: {item.age}</Text>
      </View>
      <FontAwesome name="chevron-right" size={20} color="#F05219" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F05219" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPatient}>
          <FontAwesome name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {patients.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No patients yet</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#F05219',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 20,
  },
  patientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 