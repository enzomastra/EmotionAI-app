import React, { useEffect, useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import Button from '../../../components/Button';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useThemeColor } from '../../../hooks/useThemeColor';

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

export default function PreferencesScreen() {
  const { theme, setTheme } = useContext(ThemeContext);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const background = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  return (
    <ThemedView style={[styles.container, { backgroundColor: background }]}>
      <ThemedText type="title" style={styles.title}>App Preferences</ThemedText>
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: text }]}>Theme</ThemedText>
        <Button
          title={themeOptions.find(opt => opt.value === theme)?.label || 'Theme'}
          onPress={() => setShowThemeOptions(!showThemeOptions)}
          small
        />
      </View>
      {showThemeOptions && (
        <View style={styles.themeOptions}>
          {themeOptions.map(opt => (
            <Button
              key={opt.value}
              title={opt.label + (theme === opt.value ? ' ✓' : '')}
              onPress={() => {
                setTheme(opt.value as any);
                setShowThemeOptions(false);
              }}
              small
              disabled={theme === opt.value}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  label: {
    fontSize: 18,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
}); 