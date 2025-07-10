import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import Button from '../../components/Button';
import { CARD_RADIUS, FONT } from '../../constants/DesignTokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  useEffect(() => {
    const checkSessionExpired = async () => {
      const expired = await AsyncStorage.getItem('sessionExpired');
      if (expired) {
        setSessionExpired(true);
        await AsyncStorage.removeItem('sessionExpired');
      }
    };
    checkSessionExpired();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), password.trim());
      const { access_token } = response.data;
      await signIn(access_token);
      router.replace('/(tabs)/patients');
    } catch (error: any) {
      let errorMessage = 'Invalid credentials';
      if (error.response?.data) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          // Si detail es un array (ej. de errores de validación de FastAPI)
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ');
        } else if (error.response.data.message) {
          // Si hay un campo 'message' directamente en la respuesta de error
          errorMessage = error.response.data.message;
        }
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>EmotionAI</ThemedText>
      <ThemedView variant="card" style={styles.card}>
        {sessionExpired && (
          <ThemedText style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
            Session expired. You need to login again
          </ThemedText>
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          placeholderTextColor="#B0B0B0"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#B0B0B0"
        />
        <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} />
        <ThemedText type="secondary" style={styles.registerText} onPress={() => router.push('/register')}>
          Don't have an account? <ThemedText type="link">Register</ThemedText>
        </ThemedText>
        {loading && <ActivityIndicator style={{ marginTop: 12 }} color="#F05219" />}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 32,
    color: '#F05219',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 36,
    paddingHorizontal: 28,
    gap: 18,
    alignItems: 'stretch',
    borderRadius: CARD_RADIUS,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    padding: 16,
    fontSize: FONT.size.body,
    backgroundColor: '#FAFAFA',
    marginBottom: 2,
    fontFamily: FONT.regular,
  },
  registerText: {
    marginTop: 10,
    textAlign: 'center',
  },
}); 