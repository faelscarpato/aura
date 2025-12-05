import * as React from 'react';
import { useAuraStore } from '../../store';
import { BillingStatus } from '../../types';
import { billingService } from '../../services/billingService';

interface Props {
  onChangeTab?: (tab: 'api' | 'voice' | 'plan' | 'connections' | 'profile') => void;
}

export const PlanSettings: React.FC<Props> = ({ onChangeTab }) => {
  const { billing, apiKeyStatus, setBilling, setApiKeyStatus } = useAuraStore();
  const [status, setStatus] = React.useState<string | null>(null);

  const handleSelect = async (tier: BillingStatus['tier']) => {
    const payload = {
      tier,
      usingPlatformVoice: tier !== 'byok',
      minutesRemaining: tier === 'usage' ? 120 : undefined,
      renewalDate: tier === 'platform_tts' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
    setBilling(payload);
    await billingService.saveStatus(payload);
    if (tier === 'byok') {
      setApiKeyStatus({
        ...apiKeyStatus,
        provider: 'user',
      });
      onChangeTab?.('api');
      setStatus('Selecione ou teste sua chave na aba API Key.');
      return;
    }
    setApiKeyStatus({
      ...apiKeyStatus,
      provider: 'platform',
      capabilities: { supportsText: true, supportsTts: true, supportsLive: tier !== 'free' },
      message: 'Usando plano AURA para TTS/voz.',
    });
    setStatus('Plano atualizado.');
  };

  return (
    <div className="space-y-4 text-gray-800">
      <h3 className="text-lg font-semibold">Plano e uso de voz</h3>
      <p className="text-sm text-gray-500">
        Escolha entre usar sua própria chave (BYOK) ou o serviço de voz da AURA. Assinaturas são simuladas nesta versão.
      </p>

      {[
        {
          id: 'free',
          title: 'Gratuito (texto)',
          desc: 'Apenas texto. Sugere voz quando chave ou plano forem adicionados.',
        },
        {
          id: 'byok',
          title: 'BYOK - Sua chave Gemini',
          desc: 'Usa sua chave para texto + voz. Requer teste na aba API Key.',
        },
        {
          id: 'platform_tts',
          title: 'Plano AURA Voz',
          desc: 'Assinatura com TTS incluso. Usa chave da plataforma.',
        },
        {
          id: 'usage',
          title: 'Pré-pago por uso',
          desc: 'Pague por minuto de voz. Consome saldo conforme uso.',
        },
      ].map((plan) => (
        <button
          key={plan.id}
          onClick={() => handleSelect(plan.id as any)}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            billing.tier === plan.id
              ? 'border-blue-500 bg-blue-500/10 text-gray-800'
              : 'border-gray-200 bg-gray-50 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">{plan.title}</h4>
              <p className="text-sm text-gray-500">{plan.desc}</p>
            </div>
            {billing.tier === plan.id && <span className="text-xs text-blue-600">Atual</span>}
          </div>
        </button>
      ))}

      {billing.tier !== 'free' && (
        <p className="text-xs text-gray-500">
          Voz ativa? {billing.usingPlatformVoice ? 'Sim (plataforma)' : 'Sim (sua chave)'}
          {billing.minutesRemaining ? ` • Minutos: ${billing.minutesRemaining}` : ''}
          {billing.renewalDate ? ` • Renova em: ${new Date(billing.renewalDate).toLocaleDateString()}` : ''}
        </p>
      )}

      {status && <p className="text-xs text-green-600">{status}</p>}
    </div>
  );
};
