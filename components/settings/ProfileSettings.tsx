
import * as React from 'react';
import { useAuraStore } from '../../store';

export const ProfileSettings: React.FC = () => {
  const { userProfile, setUserProfile, setVoice, manualLocation, setManualLocation, loadWeather } = useAuraStore();
  const [status, setStatus] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    fullName: userProfile?.fullName || 'Usuário',
    nickname: userProfile?.nickname || 'Você',
    occupation: userProfile?.occupation || '',
    ageRange: userProfile?.ageRange || '',
    language: userProfile?.language || 'pt-BR',
    location: manualLocation || '',
  });

  React.useEffect(() => {
    setForm({
      fullName: userProfile?.fullName || 'Usuário',
      nickname: userProfile?.nickname || 'Você',
      occupation: userProfile?.occupation || '',
      ageRange: userProfile?.ageRange || '',
      language: userProfile?.language || 'pt-BR',
      location: manualLocation || '',
    });
  }, [userProfile, manualLocation]);

  const handleSave = async () => {
    const payload = {
      id: userProfile?.id || 'local-user',
      fullName: form.fullName || 'Usuário',
      nickname: form.nickname || 'Você',
      occupation: form.occupation,
      ageRange: form.ageRange,
      language: form.language as 'pt-BR' | 'en-US',
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(payload);
    setVoice({ locale: payload.language });
    setManualLocation(form.location || null);
    
    // Trigger a weather reload with the new location settings
    loadWeather();

    setStatus('Perfil salvo localmente.');
  };

  return (
    <div className="space-y-4 text-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Perfil local</h3>
          <p className="text-sm text-gray-500">Personalize como a AURA fala com você.</p>
        </div>
        <span className="text-xs text-gray-500">Dados no dispositivo</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-gray-500">Nome completo</span>
          <input
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Nome"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-500">Como devo te chamar?</span>
          <input
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
            value={form.nickname}
            onChange={(e) => setForm((prev) => ({ ...prev, nickname: e.target.value }))}
            placeholder="Apelido"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-500">O que você faz da vida?</span>
          <input
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
            value={form.occupation}
            onChange={(e) => setForm((prev) => ({ ...prev, occupation: e.target.value }))}
            placeholder="Profissão / ocupação"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-500">Localização Manual (Cidade)</span>
          <input
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Ex: São Paulo, BR"
          />
          <span className="text-[10px] text-gray-400">Deixe vazio para usar GPS automático.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-gray-500">Faixa de idade</span>
            <input
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
              value={form.ageRange}
              onChange={(e) => setForm((prev) => ({ ...prev, ageRange: e.target.value }))}
              placeholder="Ex: 25-34"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-gray-500">Idioma</span>
            <select
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:border-blue-500 outline-none"
              value={form.language}
              onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value as 'pt-BR' | 'en-US' }))}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
            </select>
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-colors"
      >
        Salvar alterações
      </button>

      {status && <p className="text-xs text-green-600">{status}</p>}
      {userProfile?.updatedAt && (
        <p className="text-[11px] text-gray-500">
          Última atualização: {new Date(userProfile.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
