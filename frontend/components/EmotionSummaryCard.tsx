import { View, Text } from 'react-native';
import React from 'react';

export default function EmotionSummaryCard({ summary }: { summary: Record<string, number> }) {
  return (
    <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12, marginVertical: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Resumen de emociones</Text>
      {Object.entries(summary).map(([emotion, count]) => (
        <Text key={emotion} style={{ fontSize: 16 }}>
          {emotion}: {count}
        </Text>
      ))}
    </View>
  );
}
