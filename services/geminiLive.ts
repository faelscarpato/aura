
import * as React from 'react';
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  Type,
  FunctionDeclaration,
  Tool,
} from '@google/genai';
import { useAuraStore } from '../store';
import {
  arrayBufferToBase64,
  decodeAudioData,
  base64ToUint8Array,
} from '../utils/audioUtils';
import { SurfaceType, AuraEmotion, AuraDocType, UpdateSurfaceArgs, AddShoppingItemArgs, GetNewsArgs, CreateDocumentArgs } from '../types';
import { getSystemInstruction } from '../constants';

// Tool Definitions
const updateSurfaceTool: FunctionDeclaration = {
  name: 'updateSurface',
  description: 'Atualiza a surface visível para mostrar informações relevantes ao usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      surface: {
        type: Type.STRING,
        enum: ['SHOPPING', 'AGENDA', 'TASKS', 'NEWS', 'EDITOR', 'VISION', 'NONE'],
        description: 'Tipo de surface a abrir. Use SHOPPING para listas de compras, AGENDA para calendário/compromissos, TASKS para tarefas, NEWS para notícias, EDITOR para textos/notas, VISION para câmera.',
      },
    },
    required: ['surface'], 
  },
};

const addShoppingItemTool: FunctionDeclaration = {
  name: 'addShoppingItem',
  description: 'Adiciona um item à lista de compras do usuário.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item: {
        type: Type.STRING,
        description: 'Nome do item para adicionar.',
      },
    },
    required: ['item'],
  },
};

const checkTimeTool: FunctionDeclaration = {
  name: 'checkTime',
  description: 'Retorna a hora local do usuário para confirmar compromissos.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const getNewsTool: FunctionDeclaration = {
  name: 'getNews',
  description: 'Busca notícias recentes para briefing.',
  parameters: {
      type: Type.OBJECT,
      properties: {
          topic: {
              type: Type.STRING,
              description: 'Tema opcional para o briefing. Se o usuário não especificar, deixe vazio ou use "Brasil".'
          }
      }
  }
};

const createDocumentTool: FunctionDeclaration = {
  name: 'createDocument',
  description: 'Abre o editor de texto para criar notas, documentos ou apenas para escrever algo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      docType: {
        type: Type.STRING,
        enum: ['memo', 'letter', 'analysis', 'petition', 'resume', 'generic'],
        description: 'Tipo de documento a ser criado.',
      },
      title: { type: Type.STRING, description: 'Título inicial do documento.' },
      initialContent: { type: Type.STRING, description: 'Conteúdo inicial opcional.' },
    },
    required: ['docType'],
  },
};

const startImageAnalysisTool: FunctionDeclaration = {
  name: 'startImageAnalysis',
  description: 'Abre a interface de upload de imagem para análise.',
  parameters: { type: Type.OBJECT, properties: {}, required: [] },
};

const startVideoAnalysisTool: FunctionDeclaration = {
  name: 'startVideoAnalysis',
  description: 'Abre a interface de upload de vídeo para análise.',
  parameters: { type: Type.OBJECT, properties: {}, required: [] },
};

const startLiveVisionTool: FunctionDeclaration = {
  name: 'startLiveVision',
  description: 'Ativa a câmera para que a IA veja o ambiente em tempo real.',
  parameters: { type: Type.OBJECT, properties: {}, required: [] },
};

const mapVoiceName = (gender: string | undefined) => {
  if (gender === 'male') return 'Puck';
  if (gender === 'neutral') return 'Aoede';
  return 'Kore';
};

export const useGeminiLive = () => {
  const {
    setConnected,
    setIsSpeaking,
    setIsListening,
    setActiveSurface,
    addShoppingItem,
    addTranscriptMessage,
    userProfile,
    voice,
    billing,
    apiKeyStatus,
    userApiKey,
    setAnalyserNode,
    setNews,
    integrations,
    location,
    setEmotion,
    registerActivity,
    openEmptyEditor,
    setCurrentDocument,
    openVisionSurface,
    setLiveSession,
  } = useAuraStore();

  const classifyEmotionFromText = (text: string): AuraEmotion => {
    const raw = text || '';
    const t = raw.toLowerCase();
    if (!t.trim()) return 'neutral';
    const exclamations = (raw.match(/!/g) || []).length;
    if (t.includes('não aguento') || exclamations >= 3) return 'stressed';
    if (t.includes('triste') || t.includes('depress')) return 'sad';
    if (t.includes('obrigado') || t.includes('maravilhoso')) return 'happy';
    if (t.includes('relax') || t.includes('calmo')) return 'calm';
    return 'neutral';
  };

  const [error, setError] = React.useState<string | null>(null);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const workletNodeRef = React.useRef<AudioWorkletNode | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionPromiseRef = React.useRef<Promise<any> | null>(null);
  const currentSessionRef = React.useRef<any>(null);
  const nextStartTimeRef = React.useRef<number>(0);
  const audioQueueRef = React.useRef<AudioBufferSourceNode[]>([]);
  const isInterruptedRef = React.useRef(false);

  const currentInputRef = React.useRef<string>('');
  const currentOutputRef = React.useRef<string>('');

  const resolveApiKey = () => {
    const systemKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!billing.usingPlatformVoice) {
      if (apiKeyStatus.hasUserKey && userApiKey) return userApiKey;
      return '';
    }
    return systemKey;
  };
  
  const stopPlayback = React.useCallback(() => {
    audioQueueRef.current.forEach((source) => { try { source.stop(); } catch (e) {} });
    audioQueueRef.current = [];
    setIsSpeaking(false);
    isInterruptedRef.current = false;
    nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
  }, [setIsSpeaking]);

  const disconnect = React.useCallback(async () => {
    if (currentSessionRef.current) {
      try { await currentSessionRef.current.close(); } catch (e) { console.error('Error closing session:', e); }
      currentSessionRef.current = null;
    }
    setLiveSession(null);
    sessionPromiseRef.current = null;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    stopPlayback();
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
    setConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    nextStartTimeRef.current = 0;
  }, [setConnected, setIsListening, setIsSpeaking, setAnalyserNode, stopPlayback, setLiveSession]);

  const connect = React.useCallback(async () => {
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) throw new Error('API Key ausente.');

      if (audioContextRef.current) await audioContextRef.current.close();
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = newAudioContext;

      if (newAudioContext) {
        const analyser = newAudioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        setAnalyserNode(analyser);
      }
      
      // Load AudioWorklet
      try {
        await newAudioContext.audioWorklet.addModule('/audio-processor.js');
      } catch (e) {
        console.error('Failed to load audio worklet', e);
        throw new Error('Falha ao carregar processador de áudio. Verifique se o arquivo audio-processor.js está na pasta public.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const systemInstruction = getSystemInstruction(userProfile, voice, billing, location);
      const voiceName = voice.preferredVoiceName || mapVoiceName(voice.gender);

      const tools: Tool[] = [
        { functionDeclarations: [updateSurfaceTool, addShoppingItemTool, checkTimeTool, getNewsTool, createDocumentTool, startImageAnalysisTool, startVideoAnalysisTool, startLiveVisionTool] }
      ];

      if (integrations.webSearchEnabled) tools.push({ googleSearch: {} });
      tools.push({ googleMaps: {} });

      const ai = new GoogleGenAI({ apiKey });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Updated to latest model
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          tools,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setError(null);
            currentInputRef.current = '';
            currentOutputRef.current = '';

            sessionPromiseRef.current?.then(session => {
                setLiveSession(session);
            });

            if (!streamRef.current) return;
            
            // AudioWorklet Setup
            const source = newAudioContext.createMediaStreamSource(streamRef.current);
            const workletNode = new AudioWorkletNode(newAudioContext, 'audio-processor');
            
            workletNode.port.onmessage = (event) => {
              const { type, buffer, rms } = event.data;
              if (type === 'audio-data') {
                setIsListening(rms > 0.01);
                
                if (isInterruptedRef.current && rms > 0.04) {
                    // Simple VAD for interruption
                     // Logic handled in worklet or here? 
                     // The original code had a counter. 
                     // We can implement counter here if needed, but for now just sending data.
                }

                const base64Data = arrayBufferToBase64(buffer);
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({
                    media: { mimeType: 'audio/pcm;rate=16000', data: base64Data },
                  });
                });
              }
            };

            source.connect(workletNode);
            workletNode.connect(newAudioContext.destination); // Keep alive
            
            sourceRef.current = source;
            workletNodeRef.current = workletNode;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const session = await sessionPromiseRef.current;
            currentSessionRef.current = session;

            if (msg.toolCall) {
              const responses = [];
              for (const fc of msg.toolCall.functionCalls) {
                let result: any = { result: 'ok' };


// ... (inside onmessage)

                if (fc.name === 'updateSurface') {
                  const args = fc.args as unknown as UpdateSurfaceArgs;
                  if (args.surface && SurfaceType[args.surface]) {
                    setActiveSurface(SurfaceType[args.surface]);
                    result = { result: `Surface updated to ${args.surface}` };
                  }
                } else if (fc.name === 'addShoppingItem') {
                  const args = fc.args as unknown as AddShoppingItemArgs;
                  if (args.item) {
                    await addShoppingItem(args.item);
                    setActiveSurface(SurfaceType.SHOPPING);
                    result = { result: `Added ${args.item} to list` };
                  }
                } else if (fc.name === 'checkTime') {
                  result = { result: new Date().toLocaleTimeString() };
                } else if (fc.name === 'getNews') {
                   const args = fc.args as unknown as GetNewsArgs;
                   const topic = args.topic || '';
                   if (!integrations.newsEnabled) { result = { error: 'Briefing de notícias desativado.' }; } 
                   else {
                      try {
                        let newsUrl = `/api/news${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`;
                        if (location) newsUrl += `${topic ? '&' : '?'}lat=${location.latitude}&lon=${location.longitude}`;
                        const newsData = await (await fetch(newsUrl)).json();
                        setNews(newsData, topic || null);
                        setActiveSurface(SurfaceType.NEWS);
                        result = { result: newsData };
                      } catch (err: any) { result = { error: err.message || 'Falha ao buscar notícias' }; }
                   }
                } else if (fc.name === 'createDocument') {
                  const args = fc.args as unknown as CreateDocumentArgs;
                  openEmptyEditor(args.docType);
                  setCurrentDocument({
                    title: args.title || 'Novo Documento',
                    content: args.initialContent || '',
                    docType: args.docType,
                  });
                  result = { result: `Editor opened` };
                } else if (fc.name === 'startImageAnalysis') {
                    openVisionSurface('image');
                    result = { result: 'Vision surface opened for image upload.' };
                } else if (fc.name === 'startVideoAnalysis') {
                    openVisionSurface('video');
                    result = { result: 'Vision surface opened for video upload.' };
                } else if (fc.name === 'startLiveVision') {
                    openVisionSurface('live');
                    result = { result: 'Vision surface opened for live camera.' };
                }

                responses.push({ id: fc.id, name: fc.name, response: result });
              }
              session.sendToolResponse({ functionResponses: responses });
            }

            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              isInterruptedRef.current = true;
              if (audioContextRef.current) {
                const audioBuffer = await decodeAudioData(base64ToUint8Array(audioData), audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                const analyser = useAuraStore.getState().analyserNode;
                if (analyser) { source.connect(analyser); analyser.connect(audioContextRef.current.destination); } 
                else { source.connect(audioContextRef.current.destination); }
                
                const currentTime = audioContextRef.current.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                audioQueueRef.current.push(source);

                source.onended = () => {
                  const index = audioQueueRef.current.indexOf(source);
                  if (index > -1) audioQueueRef.current.splice(index, 1);
                  if (audioQueueRef.current.length === 0) {
                    setIsSpeaking(false);
                    isInterruptedRef.current = false;
                    if (audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
                  }
                };
              }
            }

            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) currentInputRef.current += inputTranscript;
            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) currentOutputRef.current += outputTranscript;

            if (msg.serverContent?.turnComplete) {
              if (msg.serverContent.interrupted) stopPlayback();
              const userText = currentInputRef.current.trim();
              const modelText = currentOutputRef.current.trim();
              if (userText) {
                addTranscriptMessage('user', userText);
                setEmotion(classifyEmotionFromText(userText));
                registerActivity();
                currentInputRef.current = '';
              }
              if (modelText) {
                addTranscriptMessage('model', modelText);
                registerActivity();
                currentOutputRef.current = '';
              }
            }
          },
          onclose: (e) => { console.log('Session Closed', e); disconnect(); },
          onerror: (err) => { console.error('Session Error', err); setError(err.message); disconnect(); },
        },
      });
    } catch (err: any) {
      console.error('Connection Failed', err);
      setError(err.message || 'Failed to connect');
      setConnected(false);
    }
  }, [addShoppingItem, addTranscriptMessage, apiKeyStatus.hasUserKey, billing, disconnect, setActiveSurface, setConnected, setIsListening, setIsSpeaking, userApiKey, userProfile, voice, setAnalyserNode, setNews, integrations, stopPlayback, location, setEmotion, registerActivity, openEmptyEditor, setCurrentDocument, openVisionSurface, setLiveSession]);

  return { connect, disconnect, error };
};
