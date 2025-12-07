
import { supabase } from './supabaseClient';
import { ShoppingItem } from '../types';

const mapShoppingRow = (row: any): ShoppingItem => ({
  id: row.id,
  name: row.name,
  checked: Boolean(row.checked),
  createdAt: row.created_at,
});

export const shoppingService = {
  async loadShoppingList(): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar lista de compras', error);
      throw new Error(error.message);
    }
    return (data || []).map(mapShoppingRow);
  },

  async addShoppingItem(itemName: string): Promise<ShoppingItem> {
    const name = itemName.trim();
    if (!name) {
      throw new Error('O nome do item não pode estar vazio.');
    }
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ name, checked: false })
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar item', error);
      throw new Error(error.message);
    }
    return mapShoppingRow(data);
  },

  async toggleShoppingItem(id: string, currentChecked: boolean): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from('shopping_list')
      .update({ checked: !currentChecked })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alternar item', error);
      throw new Error(error.message);
    }
    return mapShoppingRow(data);
  },

  async deleteShoppingItem(id: string): Promise<boolean> {
    const { error } = await supabase.from('shopping_list').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover item', error);
      throw new Error(error.message);
    }
    return true;
  },
};
