import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen 
              name="list/[id]" 
              options={{ 
                headerShown: false,
                presentation: 'card'
              }} 
            />
            <Stack.Screen name="stores/index" options={{ headerShown: false }} />
            <Stack.Screen name="stores/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="stores/new" options={{ headerShown: false }} />
            <Stack.Screen name="stores/price-search" options={{ headerShown: false }} />
            <Stack.Screen name="stores/sessions/[storeId]" options={{ headerShown: false }} />
            <Stack.Screen name="stores/session/[sessionId]" options={{ headerShown: false }} />
            <Stack.Screen name="stores/search-history/[storeId]" options={{ headerShown: false }} />
            <Stack.Screen name="product/index" options={{ headerShown: false }} />
            <Stack.Screen name="product/new" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="categories/index" options={{ headerShown: false }} />
          </Stack>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}