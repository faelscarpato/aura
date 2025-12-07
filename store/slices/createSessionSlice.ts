import { StateCreator } from 'zustand';
import { AuraState, LiveSession } from '../../types';
import { memoryService } from '../../services/memoryService';
import { visionService } from '../../services/visionService';

export interface SessionSlice {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  
  // Memory Sync Control
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  isMemorySynced: boolean;
  
  liveSession: LiveSession | null;
  analyserNode: AnalyserNode | null;

  setConnected: (connected: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  
  checkMemoryConnection: () => Promise<boolean>;
  syncMemory: () => Promise<void>;
  
  setLiveSession: (session: LiveSession | null) => void;
  sendVisionFrame: (base64Frame: string) => void;
  analyzeVisionFile: () => Promise<void>;
  
  setAnalyserNode: (node: AnalyserNode | null) => void;
}

export const createSessionSlice: StateCreator<AuraState, [], [], SessionSlice> = (set, get) => ({
  isConnected: false,
  isSpeaking: false,
  isListening: false,
  
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isMemorySynced: false,
  
  liveSession: null,
  analyserNode: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsListening: (listening) => set({ isListening: listening }),

  checkMemoryConnection: async () => {
    const isConnected = await memoryService.checkConnection();
    set({ isMemorySynced: isConnected });
    return isConnected;
  },

  syncMemory: async () => {
    const state = get();
    if (!state.hasUnsavedChanges) return;
    
    const success = await memoryService.saveSnapshot(state);
    if (success) {
      set({ 
        hasUnsavedChanges: false, 
        lastSavedAt: new Date().toISOString(),
        isMemorySynced: true
      });
      console.log('🧠 Memória AURA sincronizada com sucesso.');
    } else {
      set({ isMemorySynced: false });
    }
  },
  
  setLiveSession: (session) => set({ liveSession: session }),

  sendVisionFrame: (base64Frame) => {
    const session = get().liveSession;
    if (session) {
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Frame,
        },
      });
    }
  },

  analyzeVisionFile: async () => {
    const { visionFile, userApiKey, billing, apiKeyStatus } = get();
    if (!visionFile) return;

    // Resolve key priority
    const systemKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    const apiKey = (!billing.usingPlatformVoice && apiKeyStatus.hasUserKey && userApiKey) 
      ? userApiKey 
      : systemKey;

    if (!apiKey) {
      set({ visionAnalysisResult: 'Erro: Chave de API não configurada.' });
      return;
    }

    set({ isVisionAnalyzing: true, visionAnalysisResult: null });

    try {
      const text = await visionService.analyzeFile(apiKey, visionFile);
      set({ visionAnalysisResult: text });
    } catch (err: any) {
      console.error('Vision analysis error', err);
      set({ visionAnalysisResult: `Erro na análise: ${err.message}` });
    } finally {
      set({ isVisionAnalyzing: false });
    }
  },
  
  setAnalyserNode: (node) => set({ analyserNode: node }),
});
