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
export const login = async (credentials: { email: string; password: string }) => {
  return api.post('/auth/login', credentials);
};

export const register = async (data: { name: string; email: string; password: string }) => {
  return api.post('/auth/register', data);
};

// Patient endpoints
export const getPatients = async () => {
  return api.get('/patients/');
};

export const getPatientDetails = async (id: string | number) => {
  return api.get(`/patients/${id}/`);
};

export const createPatient = async (patientData: { name: string; age: number }) => {
  return api.post('/patients/', patientData);
};

// Session endpoints
export const getPatientSessions = async (id: string | number) => {
  return api.get(`/patients/${id}/sessions/`);
};

export const getSessionDetails = async (patientId: string | number, sessionId: string | number) => {
  return api.get(`/patients/${patientId}/sessions/${sessionId}/`);
};

export const analyzeAndSaveSession = async (patientId: string | number, formData: FormData) => {
  return api.post(`/patients/${patientId}/sessions/analyze/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Analytics endpoints
export const getPatientEmotionSummary = async (patientId: string | number) => {
  return api.get(`/analytics/patient/${patientId}/emotions/summary/`);
};

export const getPatientEmotionsBySession = async (patientId: string | number) => {
  return api.get(`/analytics/patient/${patientId}/emotions/by-session/`);
};

// Video analysis endpoint
export const analyzeVideo = async (formData: FormData) => {
  return api.post('/video/analyze/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export { api };
