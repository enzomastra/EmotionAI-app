import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.8:8001',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      router.replace('/login');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const register = (name: string, email: string, password: string) =>
  api.post('/auth/register', { name, email, password });

// Patient endpoints
export const getPatients = () => api.get('/patients/');

export const getPatientDetails = async (id: string | number) => {
  return api.get(`/patients/${id}/`);
};

export const createPatient = (name: string, age: number, observations: string) =>
  api.post('/patients/', { name, age, observations });

export const updatePatientObservations = (patientId: number, observations: string) =>
  api.patch(`/patients/${patientId}/observations`, { observations });

// Therapy Session endpoints
export const getPatientSessions = (patientId: number) =>
  api.get(`/patients/${patientId}/therapy-sessions`);

export const getSessionDetails = (patientId: number, sessionId: number) =>
  api.get(`/patients/${patientId}/therapy-sessions/${sessionId}`);

export const updateSessionObservations = async (patientId: string | number, sessionId: string | number, observations: string) => {
  return api.patch(`/patients/${patientId}/therapy-sessions/${sessionId}/observations`, { observations });
};

export const analyzeAndSaveSession = async (patientId: string | number, formData: FormData) => {
  return api.post(`/patients/${patientId}/therapy-sessions/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });
};

// Analytics endpoints
export const getPatientEmotionSummary = async (patientId: string | number) => {
  return api.get(`/analytics/patient/${patientId}/emotions/summary`);
};

export const getPatientEmotionsBySession = async (patientId: string | number) => {
  return api.get(`/analytics/patient/${patientId}/emotions/by-session`);
};

// Video Analysis endpoint
export const analyzeVideo = async (videoUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: videoUri,
    type: 'video/mp4',
    name: 'video.mp4',
  } as any);

  return api.post('/video/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Agent endpoints
export const getAgentChat = async (patientId: number, sessionIds?: number[]) => {
  const params = new URLSearchParams();
  if (sessionIds && sessionIds.length > 0) {
    sessionIds.forEach(id => params.append('session_ids', id.toString()));
  }
  return api.get(`/chat/${patientId}${params.toString() ? `?${params.toString()}` : ''}`);
};

export const sendMessageToAgent = async (message: string, sessionIds?: string[], sessionEmotions?: any) => {
  return api.post('/chat', {
    message,
    session_ids: sessionIds,
    session_emotions: sessionEmotions
  });
};

export const analyzePatientData = async (patientId: number, emotionData: any) => {
  return api.post(`/analyze/${patientId}`, { emotion_data: emotionData });
};

export { api };
