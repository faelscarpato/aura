
import { supabase } from './supabaseClient';
import { AuraState } from '../types';

export const memoryService = {
  /**
   * Verifica se a conexão com a tabela aura_memories está funcionando.
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('aura_memories')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn('Memory Sync: Connection check failed', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Memory Sync: Connection check exception', e);
      return false;
    }
  },

  /**
   * Salva um snapshot do estado atual no Supabase.
   */
  async saveSnapshot(state: AuraState): Promise<boolean> {
    try {
      // Monta o payload com o que é relevante para a memória
      const payload = {
        transcript_summary: state.transcript.slice(-20), // Últimos 20 turnos para contexto imediato
        user_context: state.userProfile,
        shopping_list_count: state.shoppingList.length,
        tasks_active_count: state.tasks.filter(t => !t.completed).length,
        agenda_next_events: state.agenda.slice(0, 3),
        current_emotion: state.emotion,
        timestamp: new Date().toISOString(),
      };

      // Resumo simples (idealmente seria gerado por IA, mas aqui concatenamos os últimos 2 turnos)
      const lastTurn = state.transcript.slice(-2);
      const summary = lastTurn.length 
        ? `Última interação: ${lastTurn.map(t => `${t.role}: ${t.text.slice(0, 50)}...`).join(' | ')}`
        : 'Sessão iniciada';

      const { error } = await supabase
        .from('aura_memories')
        .insert({
          summary,
          payload,
          source: 'aura_web_client',
          session_id: state.userProfile?.id || 'anonymous',
        });

      if (error) {
        console.error('Memory Sync: Failed to save', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Memory Sync: Exception during save', e);
      return false;
    }
  }
};
