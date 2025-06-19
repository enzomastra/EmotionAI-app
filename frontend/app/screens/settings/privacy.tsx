import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import Button from '../../../components/Button';

export default function PrivacyScreen() {
  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {/* TODO: Add delete logic */} },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => {/* TODO: Add logout logic */} },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.sectionTitle}>Privacy & Security</ThemedText>
      <Button title="Delete Account" onPress={handleDeleteAccount} style={styles.button} />
      <Button title="Log Out" onPress={handleLogout} style={styles.button} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    gap: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 40,
    fontSize: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
}); 