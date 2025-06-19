import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import React, { useRef } from 'react';
import { BUTTON_RADIUS, SHADOW, FONT } from '../constants/DesignTokens';

export default function Button({ title, onPress }: { title: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.shadow]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={styles.button}
      >
        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F05219',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: FONT.size.subtitle,
    letterSpacing: 0.2,
    fontFamily: FONT.bold,
  },
  shadow: {
    ...SHADOW,
    borderRadius: BUTTON_RADIUS,
    marginVertical: 8,
  },
});
