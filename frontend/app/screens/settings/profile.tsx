import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, View, ScrollView } from 'react-native';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import Button from '../../../components/Button';
import { getCurrentUser, updateCurrentUser } from '../../../services/api';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [email, setEmail] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(res => {
        setProfile(res.data);
        setName(res.data.name);
        setOriginalName(res.data.name);
        setEmail(res.data.email);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateCurrentUser({ name });
      Alert.alert('Profile updated', 'Your profile has been updated successfully.');
      setOriginalName(name);
      setTimeout(() => router.replace('/(tabs)/settingsTab'), 500);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await updateCurrentUser({ password: newPassword, current_password: currentPassword });
      Alert.alert('Password changed', 'Your password has been updated successfully.');
      setShowPasswordFields(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.replace('/(tabs)/settingsTab'), 500);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#F05219" />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>Edit Profile</ThemedText>
          <ThemedText type="subtitle">Name</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
          {nameFocused && (
            <Button
              title={saving ? 'Saving...' : 'Save name'}
              onPress={handleSaveName}
              disabled={saving || !name.trim() || name === originalName}
              small
            />
          )}
          <ThemedText type="subtitle">Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: '#eee', color: '#888' }]}
            value={email}
            editable={false}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <ThemedText style={{ color: '#888', marginBottom: 8 }}>
            Email cannot be changed. If you need to update it, please contact the administrator.
          </ThemedText>
          <Button
            title={showPasswordFields ? 'Cancel' : 'Change password'}
            onPress={() => {
              setShowPasswordFields(!showPasswordFields);
              setPasswordError('');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
          />
          {showPasswordFields && (
            <View style={{ width: '100%' }}>
              <ThemedText type="subtitle">Current password</ThemedText>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Current password"
                secureTextEntry
              />
              <ThemedText type="subtitle">New password</ThemedText>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry
              />
              <ThemedText type="subtitle">Confirm new password</ThemedText>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
              />
              {!!passwordError && (
                <ThemedText style={{ color: 'red', marginBottom: 8 }}>{passwordError}</ThemedText>
              )}
              <Button
                title={saving ? 'Saving...' : 'Save password'}
                onPress={handleChangePassword}
                disabled={saving}
              />
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    gap: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
}); 