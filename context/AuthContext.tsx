import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthService } from '../lib/auth';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual quando o componente é montado
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data } = await AuthService.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error('Erro ao carregar sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configura o listener para mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // Limpa o listener quando o componente é desmontado
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Função para login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await AuthService.signIn(email, password);
      return { error };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { error };
    }
  };

  // Função para registro
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await AuthService.signUp(email, password);
      return { error };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { error };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      const { error } = await AuthService.signOut();
      return { error };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};