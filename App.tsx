
import * as React from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { SurfaceManager } from './components/SurfaceManager';
import { SettingsPanel } from './components/SettingsPanel';
import { useGeminiLive } from './services/geminiLive';
import { useAuraStore } from './store';
import { Mic, MicOff, Power, Settings } from 'lucide-react';

function App() {
  const { connect, disconnect, error } = useGeminiLive();
  const { isConnected, isListening, toggleSettings, userProfile, billing, initializeLocation } = useAuraStore();

  React.useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="relative w-full h-screen bg-white text-gray-900 overflow-hidden flex flex-col items-center justify-center selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-white to-white pointer-events-none"></div>

      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col">
            <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-gray-800">
                AURA <span className="text-blue-500 font-bold">OS</span>
            </h1>
            <span className="text-xs text-gray-500 tracking-wider">
                {billing.tier === 'free' ? 'Home Automation System v2.5 | Texto' : 'Home Automation System v2.5 | Voz ativa'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleSettings(true)}
            className="p-3 rounded-full bg-black/5 hover:bg-black/10 text-gray-600 transition-colors border border-black/5 relative group"
            title="Configurações"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            {!userProfile && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>

          <button
            onClick={handleToggleConnection}
            className={`flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-300 backdrop-blur-md
                ${
                  isConnected
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20'
                }`}
          >
            <Power className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">{isConnected ? 'DISCONNECT' : 'INITIALIZE'}</span>
          </button>
        </div>
      </div>

      <main className="relative z-10 flex flex-col items-center gap-12">
        <div className="scale-125 md:scale-150">
          <VoiceOrb />
        </div>

        <div className="h-12 flex items-center justify-center">
          {!isConnected ? (
            <p className="text-gray-500 text-sm font-light animate-pulse">
              {userProfile
                ? `Pronto para você, ${userProfile.nickname || userProfile.fullName}.`
                : 'Configure o perfil e inicialize para começar.'}
            </p>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 border border-black/5">
              {isListening ? <Mic className="w-4 h-4 text-green-500" /> : <MicOff className="w-4 h-4 text-gray-500" />}
              <span className="text-xs text-gray-400 tracking-wider">{isListening ? 'LISTENING' : 'STANDBY'}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="absolute bottom-24 bg-red-100 border border-red-300 text-red-800 px-6 py-3 rounded-lg text-sm max-w-md text-center shadow-lg">
            {error}. Abra Configurações para revisar a API Key.
          </div>
        )}
      </main>

      <SurfaceManager />
      <SettingsPanel />

      <div className="absolute bottom-6 left-0 w-full text-center z-10 pointer-events-none">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Powered by Rafael Scarpato | Google Gemini Live API | Multimodal | Realtime
        </p>
      </div>
    </div>
  );
}

export default App;
