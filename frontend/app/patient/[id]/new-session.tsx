import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { analyzeAndSaveSession } from '../../../services/api';

export default function NewSessionScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVideoUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const video = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: video.uri,
        name: video.name,
        type: video.mimeType || 'video/mp4',
      } as any);

      setLoading(true);
      const response = await analyzeAndSaveSession(id as string, formData);
      
      // Navigate to session details
      router.push({
        pathname: `/patient/${id}/session/${response.data.id}`,
        params: { results: JSON.stringify(response.data.results) }
      });
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to analyze video'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Session</Text>
      <Text style={styles.subtitle}>
        Upload a video to analyze the patient's emotions during the session
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVideoUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Select Video</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#F05219',
    padding: 15,
    borderRadius: 8,
    width: '100%',
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