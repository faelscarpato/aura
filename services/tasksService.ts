
import { supabase } from './supabaseClient';
import { Task } from '../types';

const mapTaskRow = (row: any): Task => ({
  id: row.id,
  title: row.title,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
});

export const tasksService = {
  async loadTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar tarefas', error);
      throw new Error(error.message);
    }
    return (data || []).map(mapTaskRow);
  },

  async addTask(title: string): Promise<Task> {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      throw new Error('O título da tarefa não pode estar vazio.');
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: cleanTitle, completed: false })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar tarefa', error);
      throw new Error(error.message);
    }
    return mapTaskRow(data);
  },

  async toggleTaskCompleted(id: string, currentCompleted: boolean): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !currentCompleted })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alternar tarefa', error);
      throw new Error(error.message);
    }
    return mapTaskRow(data);
  },

  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover tarefa', error);
      throw new Error(error.message);
    }
    return true;
  },
};
