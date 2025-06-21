import { useContext } from 'react';
import { Appearance } from 'react-native';
import { ThemeContext } from '../app/contexts/ThemeContext';

export function useColorScheme() {
  const { theme } = useContext(ThemeContext);
  if (theme === 'system') {
    return Appearance.getColorScheme() ?? 'light';
  }
  return theme;
}
