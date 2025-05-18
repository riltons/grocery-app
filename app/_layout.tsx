import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Componente para controle de acesso baseado em autenticação
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    // Verifica se a rota atual é 'login' ou 'register'.
    // Isso assume que 'login' e 'register' são rotas de primeiro nível (ex: /login, /register).
    const currentTopLevelSegment = segments.length > 0 ? segments[0] : null;
    const isAuthScreen = currentTopLevelSegment === 'login' || currentTopLevelSegment === 'register';

    // Se o usuário não estiver autenticado E NÃO estiver em uma tela de autenticação (login/register) E NÃO estiver em um grupo de autenticação (auth),
    // então redireciona para a tela de login.
    if (!user && !isAuthScreen && !inAuthGroup) {
      router.replace('/login');
    }
    // Se o usuário ESTIVER autenticado E (estiver em uma tela de autenticação (login/register) OU estiver em um grupo de autenticação (auth)),
    // então redireciona para a tela principal ('/').
    // A condição `inAuthGroup` aqui sugere que rotas dentro de `(auth)` são para usuários não autenticados.
    else if (user && (isAuthScreen || inAuthGroup)) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#f5f5f5',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Lista de Compras',
          headerShown: true,
        }}
      />
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
      <Stack.Screen
        name="product/index"
        options={{
          title: 'Produtos',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="product/[id]"
        options={{
          title: 'Detalhes do Produto',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="product/new"
        options={{
          title: 'Novo Produto',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Componente principal que envolve a aplicação com o provedor de autenticação
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}