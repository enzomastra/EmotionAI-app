import { ExternalPathString, RelativePathString } from 'expo-router';

// Define the app's route types
export type AppRoutes = {
  '/(auth)/login': undefined;
  '/(auth)/register': undefined;
  '/(tabs)': undefined;
  '/(tabs)/patients': undefined;
  '/(tabs)/profile': undefined;
  '/patient/new': undefined;
  '/patient/[id]': { id: string };
  '/patient/[id]/analytics': { id: string };
  '/patient/[id]/new-session': { id: string };
  '/patient/[id]/session/[sessionId]': { id: string; sessionId: string };
};

// Helper type for route paths
export type AppRoutePath = keyof AppRoutes | ExternalPathString | RelativePathString;

// Helper type for route params
export type AppRouteParams<T extends keyof AppRoutes> = AppRoutes[T];

// Helper type for route navigation
export type AppRouteNavigation<T extends keyof AppRoutes> = {
  pathname: T;
  params: AppRouteParams<T>;
}; 