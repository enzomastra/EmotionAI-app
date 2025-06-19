import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { CARD_RADIUS, SHADOW } from '../constants/DesignTokens';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  let variantStyle = {};
  if (variant === 'card') {
    variantStyle = {
      borderRadius: CARD_RADIUS,
      ...SHADOW,
      backgroundColor: '#fff',
    };
  }

  return <View style={[{ backgroundColor }, variantStyle, style]} {...otherProps} />;
}
