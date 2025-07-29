import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

// URL do projeto Supabase e chave anônima
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL || 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2OTc1MTAsImV4cCI6MjA2MjI3MzUxMH0.Ig6ZQo6G-UTSPHpSqUxDIcBY_hD9TpuR8uVZVZgkOAY';

// Validação das credenciais
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: As variáveis de ambiente do Supabase não estão configuradas corretamente.');
}

// Cria o cliente Supabase com configuração para React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos para as tabelas do banco de dados
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type GenericProduct = {
  id: string;
  name: string;
  category: string | null | undefined;
  created_at: string;
  user_id: string;
};

export type SpecificProduct = {
  id: string;
  generic_product_id: string;
  name: string;
  brand: string;
  description?: string; // Adicionada propriedade description
  image_url?: string;
  created_at: string;
  user_id: string;
};

export type List = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type ListItem = {
  id: string;
  list_id: string;
  quantity: number;
  unit: string;
  checked: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type ListItemProduct = {
  id: string;
  list_item_id: string;
  specific_product_id: string;
  created_at: string;
  user_id: string;
};

export type Store = {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  user_id: string;
};

export type PriceHistory = {
  id: string;
  specific_product_id: string;
  store_id: string;
  price: number;
  date: string;
  created_at: string;
  user_id: string;
};