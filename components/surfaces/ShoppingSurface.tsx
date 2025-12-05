import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuraStore } from '../../store';
import { Check, ShoppingCart, Plus, Trash2 } from 'lucide-react';

export const ShoppingSurface: React.FC = () => {
  const { shoppingList, toggleShoppingItem, deleteShoppingItem, addShoppingItem, loadShoppingList } = useAuraStore();
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const handleAdd = async () => {
    await addShoppingItem(newItem);
    setNewItem('');
  };

  return (
    <div className="w-full h-full flex flex-col text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
                <ShoppingCart className="text-orange-600 w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium tracking-wide">Lista de Compras</h2>
        </div>
        <span className="text-sm text-gray-500">{shoppingList.length} itens</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Adicionar item"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-orange-400 hover:bg-orange-500 text-black font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Incluir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {shoppingList.map((item) => (
          <div 
            key={item.id}
            onClick={() => toggleShoppingItem(item.id)}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer
              ${item.checked 
                ? 'bg-gray-100 border-transparent opacity-60' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                 ${item.checked ? 'bg-orange-500 border-orange-500' : 'border-gray-400 group-hover:border-orange-400'}
              `}>
                {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-base ${item.checked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {item.name}
                </span>
                <span className="text-[11px] text-gray-500">Criado em {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteShoppingItem(item.id);
              }}
              className="p-2 rounded-full hover:bg-black/10 text-gray-400 hover:text-gray-800 transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <span>Sincronizado com Supabase (shopping_list)</span>
        <span>Itens ativos: {shoppingList.filter((i) => !i.checked).length}</span>
      </div>
    </div>
  );
};
