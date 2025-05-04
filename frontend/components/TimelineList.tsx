import { View, Text } from 'react-native';
import React from 'react';

export default function TimelineList({ timeline }: { timeline: Record<string, string> }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Detalle segundo a segundo</Text>
      {Object.entries(timeline).map(([second, emotion]) => (
        <Text key={second} style={{ fontSize: 14 }}>
          Segundo {second}: {emotion}
        </Text>
      ))}
    </View>
  );
}
