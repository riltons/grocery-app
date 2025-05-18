import { supabase } from './supabase';

/**
 * Serviço de autenticação para gerenciar operações com o Supabase Auth
 */
export const AuthService = {
  /**
   * Registra um novo usuário com email e senha
   */
  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { data: null, error };
    }
  },

  /**
   * Realiza login com email e senha
   */
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    }
  },

  /**
   * Realiza logout do usuário atual
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    }
  },

  /**
   * Recupera a sessão atual do usuário
   */
  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      return { data: null, error };
    }
  },

  /**
   * Recupera o usuário atual
   */
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Erro ao recuperar usuário atual:', error);
      return { user: null, error };
    }
  },

  /**
   * Envia email para recuperação de senha
   */
  resetPassword: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return { data: null, error };
    }
  },
};