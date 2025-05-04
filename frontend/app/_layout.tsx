import { Tabs } from 'expo-router';
import { IconSymbol } from '../components/ui/IconSymbol';

export default function Layout() {
  return (
    <Tabs>
      {/* Pestaña de Inicio */}
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" color={color} size={size} />
          ),
        }}
      />

      {/* Pestaña de Resultados */}
      <Tabs.Screen
        name="(tabs)/results"
        options={{
          title: 'Resultados',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="paperplane.fill" color={color} size={size} />
          ),
        }}
      />

      {/* Espacio para futuras funcionalidades */}
      {/* Ejemplo: Configuración */}
      <Tabs.Screen
        name="(tabs)/settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="chevron.left.forwardslash.chevron.right" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}