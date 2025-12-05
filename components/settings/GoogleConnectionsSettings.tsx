import * as React from 'react';
import { useAuraStore } from '../../store';

export const GoogleConnectionsSettings: React.FC = () => {
  const { integrations, setIntegrationStatus } = useAuraStore();
  const [status, setStatus] = React.useState<string | null>(null);

  const toggle = (key: 'webSearchEnabled' | 'newsEnabled') => {
    const next = !integrations[key];
    setIntegrationStatus({ [key]: next });
    setStatus(next ? 'Ativado' : 'Desativado');
  };

  return (
    <div className="space-y-4 text-gray-800">
      <h3 className="text-lg font-semibold">Integrações</h3>
      <p className="text-sm text-gray-500">
        Controle se a AURA pode buscar na web em tempo real e montar briefing de notícias diárias. Para resultados mais relevantes, sua localização pode ser utilizada.
      </p>

      {[
        {
          id: 'webSearchEnabled' as const,
          label: 'Busca web em tempo real',
          desc: 'Permite que o modelo pesquise na web via /api/search.',
        },
        {
          id: 'newsEnabled' as const,
          label: 'Briefing de notícias do dia',
          desc: 'Permite que a AURA monte um resumo diário das principais notícias.',
        },
      ].map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50"
        >
          <div>
            <h4 className="font-medium text-gray-800">{item.label}</h4>
            <p className="text-xs text-gray-500">{item.desc}</p>
            {integrations.lastSync && (
              <p className="text-[11px] text-gray-500 mt-1">Última atualização: {integrations.lastSync}</p>
            )}
          </div>
          <button
            onClick={() => toggle(item.id)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              integrations[item.id] ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                integrations[item.id] ? 'left-7' : 'left-1'
              }`}
            ></span>
          </button>
        </div>
      ))}

      {status && <p className="text-xs text-green-600">{status}</p>}
    </div>
  );
};