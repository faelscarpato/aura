
import { supabase } from './supabaseClient';
import { AgendaItem, AgendaItemType } from '../types';

const mapAgendaRow = (row: any): AgendaItem => ({
  id: row.id,
  title: row.title,
  type: row.type as AgendaItemType,
  time: row.time,
  eventDate: row.event_date || new Date().toISOString().slice(0, 10),
  createdAt: row.created_at,
});

// The 'input' for addAgendaItem needs a type definition.
// Let's create a partial type for it.
export type AgendaItemInput = Omit<AgendaItem, 'id' | 'createdAt'>;

export const agendaService = {
  async loadAgenda(): Promise<AgendaItem[]> {
    const { data, error } = await supabase
      .from('agenda')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar agenda', error);
      throw new Error(error.message);
    }
    return (data || []).map(mapAgendaRow);
  },

  async addAgendaItem(input: AgendaItemInput): Promise<AgendaItem> {
    const payload = {
      title: input.title,
      type: input.type,
      event_date: input.eventDate || new Date().toISOString().slice(0, 10),
      time: input.time,
    };
    const { data, error } = await supabase
      .from('agenda')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar agenda', error);
      throw new Error(error.message);
    }
    return mapAgendaRow(data);
  },

  async deleteAgendaItem(id: string): Promise<boolean> {
    const { error } = await supabase.from('agenda').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover evento', error);
      throw new Error(error.message);
    }
    return true;
  },
};
