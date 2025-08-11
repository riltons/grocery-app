import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para as tabs
    router.replace('/(tabs)/home');
  }, []);

  return null;
}