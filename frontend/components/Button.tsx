import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import React, { useRef } from 'react';
import { BUTTON_RADIUS, SHADOW, FONT } from '../constants/DesignTokens';

export default function Button({ title, onPress, disabled = false, small = false }: { title: string; onPress: () => void; disabled?: boolean; small?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.shadow, disabled && { opacity: 0.5 }]}>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={[styles.button, small && styles.buttonSmall, disabled && styles.buttonDisabled]}
        disabled={disabled}
      >
        <Text style={[styles.text, small && styles.textSmall]}>{title}</Text>
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
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: FONT.size.subtitle,
    letterSpacing: 0.2,
    fontFamily: FONT.bold,
  },
  textSmall: {
    fontSize: 14,
  },
  shadow: {
    ...SHADOW,
    borderRadius: BUTTON_RADIUS,
    marginVertical: 8,
  },
});
