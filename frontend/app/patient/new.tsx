import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getPatientDetails, createPatient, updatePatient } from '../../services/api';

export default function NewPatientScreen() {
  const params = useLocalSearchParams();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;
  const editMode = !!patientId;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (editMode) {
      setLoading(true);
      getPatientDetails(patientId)
        .then(res => {
          setName(res.data.name);
          setAge(res.data.age.toString());
          setObservations(res.data.observations || '');
        })
        .finally(() => setLoading(false));
    }
  }, [editMode, patientId]);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return false;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (editMode) {
        await updatePatient(Number(patientId), name.trim(), parseInt(age), observations.trim());
      } else {
        await createPatient(
          name.trim(),
          parseInt(age),
          observations.trim()
        );
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || (editMode ? 'Failed to update patient' : 'Failed to create patient')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{editMode ? 'Edit Patient' : 'New Patient'}</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          editable={!loading}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Observations"
          value={observations}
          onChangeText={setObservations}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{editMode ? 'Save Changes' : 'Create Patient'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    gap: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 15,
  },
  button: {
    backgroundColor: '#F05219',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 