import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import Button from '../../components/Button';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '../../services/api';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  useEffect(() => {
    getCurrentUser()
      .then(res => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      {/* Profile Section as clickable */}
      <TouchableOpacity onPress={() => router.push('/screens/settings/profile')}>
        <ThemedView variant="card" style={styles.cardClickable}>
          <ThemedText type="title" style={styles.sectionTitle}>Profile</ThemedText>
          {loading ? (
            <ActivityIndicator color="#F05219" />
          ) : profile ? (
            <>
              <ThemedText type="subtitle" style={styles.profileName}>{profile.name}</ThemedText>
              <ThemedText type="secondary" style={[styles.profileEmail, { color: text }]}>{profile.email}</ThemedText>
            </>
          ) : (
            <ThemedText type="secondary">Could not load profile</ThemedText>
          )}
        </ThemedView>
      </TouchableOpacity>
      {/* App Preferences Button */}
      <Button title="App Preferences" onPress={() => router.push('/screens/settings/preferences')} />
      {/* Privacy & Security Button */}
      <Button title="Privacy & Security" onPress={() => router.push('/screens/settings/privacy')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 20,
  },
  cardClickable: {
    padding: 24,
    marginBottom: 8,
    gap: 12,
    alignItems: 'flex-start',
    minWidth: 320,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  sectionTitle: {
    marginBottom: 8,
    fontSize: 20,
  },
  profileName: {
    marginBottom: 2,
  },
  profileEmail: {
    marginBottom: 2,
  },
});