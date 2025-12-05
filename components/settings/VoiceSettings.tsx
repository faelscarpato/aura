import * as React from 'react';
import { useAuraStore } from '../../store';

export const VoiceSettings: React.FC = () => {
  const { voice, setVoice } = useAuraStore();
  const [localVoice, setLocalVoice] = React.useState(voice);
  const [status, setStatus] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalVoice(voice);
  }, [voice]);

  const handleSave = () => {
    setVoice(localVoice);
    setStatus('Configurações de voz salvas.');
  };

  return (
    <div className="space-y-4 text-gray-800">
      <h3 className="text-lg font-semibold">Voz do agente</h3>
      <p className="text-sm text-gray-500">
        Escolha o perfil de voz. Ajustes de velocidade e tom são aplicados sempre que possível.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'female', label: 'Voz feminina', accent: 'from-purple-500 to-blue-400' },
          { id: 'male', label: 'Voz masculina', accent: 'from-blue-500 to-cyan-400' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setLocalVoice((prev) => ({ ...prev, gender: option.id as any }))}
            className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${
              localVoice.gender === option.id
                ? 'bg-blue-500/10 border-blue-500 text-gray-800'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${option.accent} block`} aria-hidden></span>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase text-gray-500 font-bold">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          {['casual', 'formal', 'focused', 'empática'].map((style) => (
            <button
              key={style}
              onClick={() =>
                setLocalVoice((prev) => ({ ...prev, style: style === 'empática' ? 'empathetic' : (style as any) }))
              }
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                localVoice.style === style || (style === 'empática' && localVoice.style === 'empathetic')
                  ? 'border-blue-400 bg-blue-500/10 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs uppercase text-gray-500 font-bold flex justify-between">
          <span>Velocidade</span>
          <span>{localVoice.rate.toFixed(1)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={localVoice.rate}
          onChange={(e) => setLocalVoice((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
          className="w-full accent-blue-500"
        />

        <label className="text-xs uppercase text-gray-500 font-bold flex justify-between">
          <span>Tom</span>
          <span>{localVoice.pitch.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="-6"
          max="6"
          step="0.5"
          value={localVoice.pitch}
          onChange={(e) => setLocalVoice((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
          className="w-full accent-blue-500"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
      >
        Salvar voz
      </button>

      {status && <p className="text-xs text-green-600">{status}</p>}
    </div>
  );
};
