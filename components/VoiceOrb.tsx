import * as React from 'react';
import { useAuraStore } from '../store';

export const VoiceOrb: React.FC = () => {
  const { isConnected, isSpeaking, isListening } = useAuraStore();

  const getOrbStyle = () => {
    if (!isConnected) return "border-gray-300 opacity-20 scale-90 grayscale shadow-none";
    
    if (isSpeaking) {
        return "border-cyan-400 shadow-[0_0_80px_rgba(34,211,238,0.6)] scale-110";
    }
    
    if (isListening) {
        return "border-purple-400 shadow-[0_0_60px_rgba(192,132,252,0.5)] scale-100";
    }

    return "border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse-slow";
  };

  const getCoreColor = () => {
    if (!isConnected) return "bg-gray-200";
    if (isSpeaking) return "bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.8)]";
    if (isListening) return "bg-purple-200 shadow-[0_0_30px_rgba(233,213,255,0.8)]";
    return "bg-blue-600";
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64 transition-all duration-700 ease-in-out">
      
      {/* Speaking Ripple (Ping) */}
      {isSpeaking && (
        <>
          <div className="absolute w-full h-full rounded-full border-2 border-cyan-400/30 animate-wave1"></div>
          <div className="absolute w-full h-full rounded-full border-2 border-cyan-400/30 animate-wave2"></div>
          <div className="absolute w-full h-full rounded-full border-2 border-cyan-400/30 animate-wave3"></div>
        </>
      )}

      {/* Listening Ripple (Expansion) */}
      {isListening && (
        <div className="absolute w-56 h-56 rounded-full border border-purple-400/30 animate-pulse"></div>
      )}

      {/* Outer Glow Ring (State-based) */}
      <div className={`absolute w-48 h-48 rounded-full border-2 transition-all duration-500 ease-out ${getOrbStyle()}`}></div>
      
      {/* Rotating Spinner - Only visible when connected */}
      <div className={`absolute w-40 h-40 rounded-full border-t border-b border-transparent transition-all duration-1000 
          ${isConnected ? 'opacity-60 animate-spin-slow' : 'opacity-0'}
          ${isListening ? 'border-purple-400' : 'border-blue-400'}
          ${isSpeaking ? 'border-cyan-400 duration-75' : ''}
      `}></div>

      {/* Counter-Spin Ring */}
      <div className={`absolute w-32 h-32 rounded-full border-r border-l border-transparent transition-all duration-1000
          ${isConnected ? 'opacity-40 animate-spin-slow' : 'opacity-0'}
          ${isSpeaking ? 'border-cyan-200' : 'border-blue-300'}
      `} style={{ animationDirection: 'reverse', animationDuration: isSpeaking ? '3s' : '12s' }}></div>

      {/* Core */}
      <div className={`relative w-20 h-20 rounded-full transition-all duration-300 ${getCoreColor()} shadow-inner flex items-center justify-center overflow-hidden z-10`}>
         <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
         {/* Inner Core Pulse */}
         {isSpeaking && <div className="absolute inset-0 bg-white/50 animate-pulse"></div>}
      </div>

      {/* Status Label */}
      <div className={`absolute -bottom-16 text-center w-64 transition-opacity duration-500 ${isConnected ? 'opacity-100' : 'opacity-40'}`}>
         <span className={`text-[10px] uppercase tracking-[0.3em] font-medium transition-colors duration-300
            ${isSpeaking ? 'text-cyan-500 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : isListening ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(216,180,254,0.8)]' : 'text-gray-500'}
         `}>
            {isConnected ? (isSpeaking ? "Voz Ativa" : isListening ? "Ouvindo..." : "Online") : "Sistema Offline"}
         </span>
      </div>
    </div>
  );
};
