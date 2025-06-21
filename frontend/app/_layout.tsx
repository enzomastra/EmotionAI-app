import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { Tabs } from 'expo-router';
import { IconSymbol } from '../components/ui/IconSymbol';
import { ThemeProvider } from './contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      {!isAuthenticated ? (
        // Auth screens
        <>
          <Stack.Screen
            name="(auth)/login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)/register"
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        // App screens
        <>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="patient/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="patient/[id]/session/[sessionId]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="patient/[id]/analytics"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="patient/[id]/new-session"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="patient/new"
            options={{
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack>
  );
}

export function Layout() {
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
        name="(tabs)/agent"
        options={{
          title: 'Agent',
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