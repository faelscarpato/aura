import * as React from 'react';
import { useAuraStore } from '../store';
import { useGeminiLive } from '../services/geminiLive';

export const SilentModeInput: React.FC = () => {
  const {
    isSilentMode,
    silentInput,
    setSilentMode,
    setSilentInput,
    addTranscriptMessage,
    registerActivity,
    isConnected,
  } = useAuraStore();

  const { currentSessionRef, currentInputRef } = useGeminiLive();

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isSilentMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSilentMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = silentInput.trim();

    if (!text || !isConnected) return;

    // Adicionar mensagem do usuário ao transcript
    addTranscriptMessage('user', text);
    registerActivity();

    // Salvar na memória (sem await, apenas fire-and-forget)
    const { memoryService } = await import('../services/memoryService');
    memoryService.addMemory('user', text).catch(console.error);

    // Enviar texto para a sessão ativa
    if (currentSessionRef.current) {
      try {
        currentSessionRef.current.sendRealtimeInput({
          text: text,
        });
        console.log('✅ Mensagem enviada:', text);
      } catch (err) {
        console.error('❌ Erro ao enviar mensagem:', err);
      }
    }

    // Limpar input
    setSilentInput('');
  };

  const toggleSilentMode = () => {
    setSilentMode(!isSilentMode);
    if (!isSilentMode) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (!isSilentMode) {
    // Botão flutuante para ativar modo silencioso
    return (
      <button
        onClick={toggleSilentMode}
        title="Ativar modo silencioso (texto)"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-yellow-400 hover:bg-yellow-500 shadow-lg transition-all flex items-center justify-center text-gray-800 font-bold text-lg"
      >
        🔇
      </button>
    );
  }

  // Input em modo silencioso
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-yellow-400 p-4">
      <div className="max-w-2xl mx-auto flex gap-3">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={silentInput}
            onChange={(e) => setSilentInput(e.target.value)}
            placeholder={isConnected ? "Digite sua mensagem..." : "Conecte primeiro para enviar..."}
            disabled={!isConnected}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!silentInput.trim() || !isConnected}
            className="px-6 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-500 text-gray-900 font-semibold transition-colors disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>

        <button
          onClick={toggleSilentMode}
          title="Sair do modo silencioso"
          className="px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
