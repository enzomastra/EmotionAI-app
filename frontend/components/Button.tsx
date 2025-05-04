import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

export default function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#F05219',
        padding: 12,
        borderRadius: 12,
        marginVertical: 10,
        alignItems: 'center',
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
    </TouchableOpacity>
  );
}
