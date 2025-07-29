import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack
          screenOptions={{
            headerShown: false,
            statusBarStyle: 'dark',
            statusBarBackgroundColor: '#ffffff',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen 
            name="list/[id]" 
            options={{ 
              headerShown: false,
              presentation: 'card'
            }} 
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}