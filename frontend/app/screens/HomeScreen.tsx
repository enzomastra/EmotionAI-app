import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useUploadVideo } from '../../hooks/useUploadVideo';

export default function HomeScreen() {
  const { pickAndUploadVideo, loading } = useUploadVideo();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EmotionAI Mobile</Text>
      <Button title="Seleccionar y subir video" onPress={pickAndUploadVideo} />
      {loading && <ActivityIndicator size="large" color="#F05219" style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
});
