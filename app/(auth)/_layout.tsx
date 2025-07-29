import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#f5f5f5',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Entrar',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Criar Conta',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
