import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadScreen() {
  const [video, setVideo] = useState<any>(null);

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
    });

    if (result.assets && result.assets.length > 0) {
      setVideo(result.assets[0]);
    }
  };

  const uploadVideo = async () => {
    if (!video) {
      Alert.alert('Primero seleccioná un video');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: video.uri,
      name: video.name || 'video.mp4',
      type: video.mimeType || 'video/mp4',
    });

    try {
      const response = await fetch('http://192.168.18.8:8000/api/video/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await response.json();
      Alert.alert('Resultado', JSON.stringify(json, null, 2));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un problema al subir el video');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Subí un video para analizar</Text>
      <Button title="Seleccionar video" onPress={pickVideo} />
      {video && <Text style={{ marginTop: 10 }}>{video.name}</Text>}
      <View style={{ height: 20 }} />
      <Button title="Subir video" onPress={uploadVideo} />
    </View>
  );
}
