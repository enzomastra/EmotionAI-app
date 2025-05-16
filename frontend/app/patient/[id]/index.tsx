import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function PatientDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const navigateToAnalytics = () => {
    router.push(`/patient/${id}/analytics`);
  };

  return (
    <View style={styles.container}>
      {/* Existing patient details content */}
      
      <TouchableOpacity 
        style={styles.analyticsButton}
        onPress={navigateToAnalytics}
      >
        <FontAwesome name="bar-chart" size={24} color="white" />
        <Text style={styles.analyticsButtonText}>View Emotion History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 