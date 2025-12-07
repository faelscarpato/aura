import * as React from 'react';
import { useAuraStore } from '../store';

export const SilentMessageOverlay: React.FC = () => {
  const { isSilentMode, silentMessage, setSilentMessage, silentInput } = useAuraStore();
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    if (silentMessage && isSilentMode) {
      setIsVisible(true);

      // Limpar timeout anterior se houver
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Desaparecer automaticamente após 8 segundos ou quando o usuário digitar
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setSilentMessage(null), 300); // Aguardar fade out
      }, 8000);
    }
  }, [silentMessage, isSilentMode, setSilentMessage]);

  // Desaparecer quando o usuário começar a digitar
  React.useEffect(() => {
    if (silentInput && silentMessage) {
      setIsVisible(false);
      setTimeout(() => setSilentMessage(null), 300);
    }
  }, [silentInput, silentMessage, setSilentMessage]);

  if (!silentMessage || !isSilentMode) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Caixa de mensagem */}
      <div
        className={`relative max-w-lg mx-4 px-8 py-6 rounded-2xl bg-white shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Ícone AURA */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-xl font-bold text-gray-800">
            🤖
          </div>
        </div>

        {/* Texto da mensagem */}
        <p className="text-gray-800 text-center text-lg leading-relaxed whitespace-pre-wrap">
          {silentMessage}
        </p>

        {/* Indicador de animação */}
        <div className="flex justify-center gap-1 mt-6">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Instrução */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Digite para fechar e responder...
        </p>
      </div>
    </div>
  );
};
