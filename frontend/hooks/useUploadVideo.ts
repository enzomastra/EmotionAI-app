import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { analyzeVideo } from '../services/api';
import { useState } from 'react';

export const useUploadVideo = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickAndUploadVideo = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (file.canceled || !file.assets?.length) return;

      const video = file.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: video.uri,
        name: video.name,
        type: video.mimeType || 'video/mp4',
      } as any);

      setLoading(true);
      const response = await analyzeVideo(formData);
      const data = response.data;

      router.push({
        pathname: '/results',
        params: {
          summary: JSON.stringify(data.emotion_summary),
          timeline: JSON.stringify(data.timeline),
        },
      });
    } catch (error: any) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Hubo un problema al analizar el video');
    } finally {
      setLoading(false);
    }
  };

  return { pickAndUploadVideo, loading };
};