import * as React from 'react';
import { useAuraStore } from '../../store';
import { Check, ListChecks, Plus, Trash2 } from 'lucide-react';

export const TasksSurface: React.FC = () => {
  const { tasks, loadTasks, addTask, toggleTaskCompleted, deleteTask } = useAuraStore();
  const [title, setTitle] = React.useState('');

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdd = async () => {
    await addTask(title);
    setTitle('');
  };

  return (
    <div className="w-full h-full flex flex-col text-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <ListChecks className="text-green-600 w-6 h-6" />
          </div>
          <h2 className="text-xl font-medium tracking-wide">Tarefas</h2>
        </div>
        <span className="text-sm text-gray-500">{tasks.length} itens</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Adicionar tarefa"
          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-green-500 outline-none"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 rounded-lg bg-green-500/80 hover:bg-green-500 text-black font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Incluir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTaskCompleted(task.id)}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer
              ${task.completed ? 'bg-gray-100 border-transparent opacity-60' : 'bg-white border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-400 group-hover:border-green-400'}`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {task.title}
                </span>
                <span className="text-[11px] text-gray-500">
                  Criada em {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
              className="p-2 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
