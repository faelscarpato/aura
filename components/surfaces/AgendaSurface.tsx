import * as React from 'react';
import { useAuraStore } from '../../store';
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

export const AgendaSurface: React.FC = () => {
  const { agenda, loadAgenda, addAgendaItem, deleteAgendaItem } = useAuraStore();
  const [title, setTitle] = React.useState('');
  const [time, setTime] = React.useState('');
  const [type, setType] = React.useState<'meeting' | 'reminder' | 'task'>('meeting');
  const [eventDate, setEventDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    loadAgenda();
  }, [loadAgenda]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addAgendaItem({ title, time, type, eventDate });
    setTitle('');
    setTime('');
  };

  return (
    <div className="w-full h-full flex flex-col text-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Calendar className="text-purple-600 w-6 h-6" />
        </div>
        <h2 className="text-xl font-medium tracking-wide">Agenda</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do evento"
          className="md:col-span-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-purple-500 outline-none"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-purple-500 outline-none"
        />
        <div className="flex gap-2">
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="HH:MM"
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-purple-500 outline-none"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="bg-white border border-gray-300 rounded-lg px-2 text-gray-800 focus:border-purple-500 outline-none"
          >
            <option value="meeting">Reunião</option>
            <option value="task">Tarefa</option>
            <option value="reminder">Lembrete</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {agenda.map((event, index) => (
          <div key={event.id} className="relative pl-6 border-l border-gray-200 pb-6 last:pb-0">
            <div
              className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white 
                    ${index === 0 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-gray-400'}`}
            ></div>

            <div className="bg-white hover:bg-gray-50 transition-colors p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-medium text-gray-800">{event.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full 
                            ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' : 
                              event.type === 'task' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                >
                  {event.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {event.time || 'Sem horário'}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.eventDate}</span>
                </div>
              </div>
              <button
                onClick={() => deleteAgendaItem(event.id)}
                className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
