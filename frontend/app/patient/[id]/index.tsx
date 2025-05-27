import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getPatientDetails, getPatientSessions } from '@/services/api';
import { AppRoutes } from '@/app/types';

interface Session {
  id: number;
  date: string;
  results: string;
}

interface Patient {
  id: number;
  name: string;
  age: number;
}

export default function PatientDetailsScreen() {
  const params = useLocalSearchParams<AppRoutes['/patient/[id]']>();
  const patientId = Number(params.id);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(patientId)) {
      Alert.alert('Error', 'Invalid patient ID');
      router.back();
      return;
    }
    loadPatientDetails();
    loadSessions();
  }, [patientId]);

  const loadPatientDetails = async () => {
    try {
      const response = await getPatientDetails(patientId);
      setPatient(response.data);
    } catch (error: any) {
      console.error('Error loading patient details:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Patient not found');
        router.back();
      }
    }
  };

  const loadSessions = async () => {
    try {
      const response = await getPatientSessions(patientId);
      setSessions(response.data);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    router.push(`/patient/${patientId}/new-session`);
  };

  const handleViewAnalytics = () => {
    router.push(`/patient/${patientId}/analytics`);
  };

  const handleSessionPress = (sessionId: number) => {
    router.push(`/patient/${patientId}/therapy-session/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

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
        <Text style={styles.title}>{patient?.name || 'Patient'}</Text>
        <Text style={styles.subtitle}>Age: {patient?.age || 'N/A'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleNewSession}>
          <FontAwesome name="video-camera" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>New Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
          <FontAwesome name="bar-chart" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sessionsContainer}>
        <Text style={styles.sectionTitle}>Sessions</Text>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No sessions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a new session to analyze emotions
            </Text>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => handleSessionPress(item.id)}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
                </View>
                <FontAwesome name="chevron-right" size={20} color="#F05219" />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.sessionsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F05219',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    color: '#333',
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