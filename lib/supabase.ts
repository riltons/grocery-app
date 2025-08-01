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

export type Category = {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
};

export type GenericProduct = {
  id: string;
  name: string;
  category: string | null | undefined; // UUID referencing categories table
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
  default_unit?: string; // Unidade padrão do produto
  barcode?: string; // Código de barras do produto
  barcode_type?: string; // Tipo do código de barras (EAN13, UPC, etc.)
  external_id?: string; // ID do produto em APIs externas
  data_source?: string; // Fonte dos dados (local, cosmos, openfoodfacts, manual)
  confidence_score?: number; // Pontuação de confiança dos dados
  last_external_sync?: string; // Última sincronização com APIs externas
  created_at: string;
  user_id: string;
};

// Tipo para cache de códigos de barras
export type BarcodeCache = {
  id: string;
  barcode: string;
  barcode_type: string;
  product_data: any; // JSON com dados do produto
  source: string; // Fonte dos dados
  confidence_score?: number;
  created_at: string;
  expires_at?: string;
  user_id: string;
};

export type List = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_shared?: boolean;
  share_settings?: {
    allowInvites: boolean;
    defaultPermission: 'view' | 'edit' | 'admin';
  };
};

export type ListItem = {
  id: string;
  list_id: string;
  quantity: number;
  unit: string;
  checked: boolean;
  price?: number; // Price of the item when marked as purchased
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

// Tipos para compartilhamento de listas
export type SharePermission = 'view' | 'edit' | 'admin';

export type ListShare = {
  id: string;
  list_id: string;
  user_id: string;
  permission: SharePermission;
  created_at: string;
  created_by: string;
};

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type Invitation = {
  id: string;
  list_id: string;
  inviter_user_id: string;
  invitee_email: string;
  invitee_user_id?: string;
  permission: SharePermission;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  responded_at?: string;
};

export type ShareLink = {
  id: string;
  list_id: string;
  token: string;
  permission: SharePermission;
  expires_at: string;
  max_uses?: number;
  current_uses: number;
  created_by: string;
  created_at: string;
  is_active: boolean;
};