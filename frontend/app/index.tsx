import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function HomeScreen() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (file.canceled) return;
      setLoading(true);
      await uploadVideo(file.assets[0]);
    } catch (error) {
      console.error('Error al seleccionar el video:', error);
    }
  };

  const uploadVideo = async (video: any) => {
    const formData = new FormData();
    formData.append('file', {
      uri: video.uri,
      name: video.name,
      type: video.mimeType || 'video/mp4',
    } as any);

    try {
      const response = await axios.post('http://192.168.18.8:8000/api/video/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (error: any) {
      console.error('Error al subir video:', error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>EmotionAI Mobile</Text>
      <Button title="Seleccionar Video" onPress={pickVideo} />
      {loading && <ActivityIndicator size="large" color="#F05219" />}
      {result && (
        <View style={styles.result}>
          <Text style={styles.sectionTitle}>Resultado:</Text>
          <Text selectable>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
