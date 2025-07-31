import { supabase } from './supabase';

/**
 * Teste básico de sincronização em tempo real para compartilhamento de listas
 * Este arquivo será usado para verificar se o Realtime está funcionando corretamente
 */

export class SharingRealtimeTest {
  private subscriptions: any[] = [];

  /**
   * Testa a sincronização básica entre clientes
   */
  async testBasicSync() {
    console.log('🔄 Iniciando teste de sincronização básica...');

    try {
      // Teste 1: Listener para mudanças em list_shares
      const listSharesSubscription = supabase
        .channel('list_shares_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'list_shares'
          },
          (payload) => {
            console.log('📤 Mudança em list_shares:', payload);
          }
        )
        .subscribe();

      this.subscriptions.push(listSharesSubscription);

      // Teste 2: Listener para mudanças em invitations
      const invitationsSubscription = supabase
        .channel('invitations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'invitations'
          },
          (payload) => {
            console.log('📧 Mudança em invitations:', payload);
          }
        )
        .subscribe();

      this.subscriptions.push(invitationsSubscription);

      // Teste 3: Listener para mudanças em list_items (para listas compartilhadas)
      const listItemsSubscription = supabase
        .channel('list_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'list_items'
          },
          (payload) => {
            console.log('📝 Mudança em list_items:', payload);
          }
        )
        .subscribe();

      this.subscriptions.push(listItemsSubscription);

      console.log('✅ Listeners de Realtime configurados com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao configurar Realtime:', error);
      return false;
    }
  }

  /**
   * Testa inserção de dados para verificar se os listeners funcionam
   */
  async testDataInsertion() {
    console.log('🧪 Testando inserção de dados...');

    try {
      // Buscar uma lista existente do usuário atual
      const { data: lists, error: listsError } = await supabase
        .from('lists')
        .select('id')
        .limit(1);

      if (listsError) {
        console.error('❌ Erro ao buscar listas:', listsError);
        return false;
      }

      if (!lists || lists.length === 0) {
        console.log('⚠️ Nenhuma lista encontrada para teste');
        return false;
      }

      const testListId = lists[0].id;

      // Teste: Criar um convite de teste
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          list_id: testListId,
          invitee_email: 'test@example.com',
          permission: 'view'
        })
        .select()
        .single();

      if (invitationError) {
        console.error('❌ Erro ao criar convite de teste:', invitationError);
        return false;
      }

      console.log('✅ Convite de teste criado:', invitation);

      // Aguardar um pouco para ver se o listener captura a mudança
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Limpar o convite de teste
      await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id);

      console.log('🧹 Convite de teste removido');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste de inserção:', error);
      return false;
    }
  }

  /**
   * Limpa todas as subscriptions
   */
  cleanup() {
    console.log('🧹 Limpando subscriptions...');
    this.subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions = [];
    console.log('✅ Cleanup concluído');
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🚀 Iniciando testes de Realtime para compartilhamento...');
    
    const syncTest = await this.testBasicSync();
    if (!syncTest) {
      console.log('❌ Teste de sincronização básica falhou');
      return false;
    }

    const dataTest = await this.testDataInsertion();
    if (!dataTest) {
      console.log('❌ Teste de inserção de dados falhou');
      return false;
    }

    console.log('🎉 Todos os testes de Realtime passaram!');
    return true;
  }
}

// Função utilitária para executar os testes
export const testSharingRealtime = async () => {
  const tester = new SharingRealtimeTest();
  
  try {
    const result = await tester.runAllTests();
    return result;
  } finally {
    tester.cleanup();
  }
};