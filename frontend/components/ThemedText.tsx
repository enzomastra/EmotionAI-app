import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { FONT } from '../constants/DesignTokens';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'secondary';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'secondary' ? styles.secondary : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: FONT.size.body,
    lineHeight: 24,
    fontFamily: FONT.regular,
  },
  defaultSemiBold: {
    fontSize: FONT.size.body,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: FONT.bold,
  },
  title: {
    fontSize: FONT.size.title,
    fontWeight: '700',
    lineHeight: 34,
    fontFamily: FONT.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.size.subtitle,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: FONT.bold,
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: 30,
    fontSize: FONT.size.body,
    color: '#0a7ea4',
    fontFamily: FONT.bold,
  },
  secondary: {
    fontSize: FONT.size.small,
    color: '#687076',
    fontFamily: FONT.regular,
  },
});
