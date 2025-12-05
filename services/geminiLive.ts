
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
  float32To16BitPCM,
  arrayBufferToBase64,
  decodeAudioData,
  base64ToUint8Array,
} from '../utils/audioUtils';
import { SurfaceType } from '../types';
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
        enum: ['SHOPPING', 'AGENDA', 'TASKS', 'NEWS', 'WEATHER', 'NONE'],
        description: 'Tipo de surface a abrir ou fechar.',
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
              description: 'Tema opcional para o briefing.'
          }
      }
  }
};

const getWeatherTool: FunctionDeclaration = {
  name: 'getWeather',
  description: 'Obtém a previsão do tempo atual e futura e exibe no painel.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
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
    setWeather,
    integrations,
    location,
  } = useAuraStore();

  const [error, setError] = React.useState<string | null>(null);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const processorRef = React.useRef<ScriptProcessorNode | null>(null);
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
      if (apiKeyStatus.hasUserKey && userApiKey) {
        return userApiKey;
      }
      return '';
    }

    return systemKey;
  };
  
  const stopPlayback = React.useCallback(() => {
    audioQueueRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        /* ignore */
      }
    });
    audioQueueRef.current = [];
    setIsSpeaking(false);
    isInterruptedRef.current = false;
    nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
  }, [setIsSpeaking]);

  const disconnect = React.useCallback(async () => {
    if (currentSessionRef.current) {
      try {
        await currentSessionRef.current.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
      currentSessionRef.current = null;
    }
    sessionPromiseRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
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
  }, [setConnected, setIsListening, setIsSpeaking, setAnalyserNode, stopPlayback]);

  const connect = React.useCallback(async () => {
    try {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        throw new Error(
          'API Key ausente. Configure uma chave Gemini nas Configurações ou defina API_KEY no seu ambiente.',
        );
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = newAudioContext;

      if (newAudioContext) {
        const analyser = newAudioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        setAnalyserNode(analyser);
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

      // Build tools
      const tools: Tool[] = [
        { functionDeclarations: [updateSurfaceTool, addShoppingItemTool, checkTimeTool, getNewsTool, getWeatherTool] }
      ];

      // Add Native Google Search if enabled in settings
      if (integrations.webSearchEnabled) {
        tools.push({ googleSearch: {} });
      }

      // Always add Google Maps for location awareness and places
      tools.push({ googleMaps: {} });

      const ai = new GoogleGenAI({ apiKey });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          tools,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setError(null);
            currentInputRef.current = '';
            currentOutputRef.current = '';

            if (!streamRef.current) return;

            const inputCtx = new (window.AudioContext ||
              (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(streamRef.current);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            let vadState = { consecutiveSilence: 0 };
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setIsListening(rms > 0.01);

              if (isInterruptedRef.current) {
                if (rms > 0.04) {
                    vadState.consecutiveSilence += 1;
                } else {
                    vadState.consecutiveSilence = 0;
                }
                if (vadState.consecutiveSilence >= 3) {
                    stopPlayback();
                    vadState.consecutiveSilence = 0;
                }
              }

              const pcm16 = float32To16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcm16);

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data,
                  },
                });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);

            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            const session = await sessionPromiseRef.current;
            currentSessionRef.current = session;

            if (msg.toolCall) {
              const responses = [];
              for (const fc of msg.toolCall.functionCalls) {
                let result: any = { result: 'ok' };

                if (fc.name === 'updateSurface') {
                  const surfaceArg = (fc.args as any).surface;
                  if (surfaceArg && SurfaceType[surfaceArg]) {
                    setActiveSurface(SurfaceType[surfaceArg]);
                    result = { result: `Surface updated to ${surfaceArg}` };
                  }
                } else if (fc.name === 'addShoppingItem') {
                  const itemArg = (fc.args as any).item;
                  if (itemArg) {
                    await addShoppingItem(itemArg);
                    setActiveSurface(SurfaceType.SHOPPING);
                    result = { result: `Added ${itemArg} to list` };
                  }
                } else if (fc.name === 'checkTime') {
                  const now = new Date();
                  result = {
                    result: new Intl.DateTimeFormat('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(now),
                  };
                } else if (fc.name === 'getNews') {
                  const topic = (fc.args as any).topic || '';
                  if (!integrations.newsEnabled) {
                    result = { error: 'Briefing de notícias desativado.' };
                  } else {
                    try {
                      let newsUrl = `/api/news${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`;
                      if (location) {
                        const separator = newsUrl.includes('?') ? '&' : '?';
                        newsUrl += `${separator}lat=${location.latitude}&lon=${location.longitude}`;
                      }
                      const newsData = await (await fetch(newsUrl)).json();
                      setNews(newsData, topic || null);
                      result = { result: newsData };
                    } catch (err: any) {
                      result = { error: err.message || 'Falha ao buscar notícias' };
                    }
                  }
                } else if (fc.name === 'getWeather') {
                  try {
                    let weatherUrl = '/api/weather';
                    // Se o usuário pedir o clima de "Londres", a IA pode passar args, mas aqui estamos usando o endpoint que resolve 'q' ou lat/lon
                    // Para simplificar, usamos a localização atual ou manual do store na chamada, a menos que a IA passe argumentos (o que exigiria atualizar a definição da ferramenta getWeather para aceitar args)
                    // Na definição atual, getWeather não tem args, então usa o contexto padrão.
                    if (useAuraStore.getState().manualLocation) {
                        weatherUrl += `?q=${encodeURIComponent(useAuraStore.getState().manualLocation || '')}`;
                    } else if (location) {
                        weatherUrl += `?lat=${location.latitude}&lon=${location.longitude}`;
                    } else {
                        // Fallback se nada estiver disponível
                        weatherUrl += `?q=São Paulo,BR`;
                    }
                    
                    const weatherData = await (await fetch(weatherUrl)).json();
                    setWeather(weatherData);
                    setActiveSurface(SurfaceType.WEATHER);
                    result = { result: weatherData };
                  } catch (err: any) {
                    result = { error: err.message || 'Falha ao buscar clima' };
                  }
                }

                responses.push({
                  id: fc.id,
                  name: fc.name,
                  response: result,
                });
              }
              session.sendToolResponse({ functionResponses: responses });
            }

            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              isInterruptedRef.current = true;
              if (audioContextRef.current) {
                const audioBuffer = await decodeAudioData(
                  base64ToUint8Array(audioData),
                  audioContextRef.current,
                );

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;

                const analyser = useAuraStore.getState().analyserNode;
                if (analyser) {
                  source.connect(analyser);
                  analyser.connect(audioContextRef.current.destination);
                } else {
                  source.connect(audioContextRef.current.destination);
                }

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
                    if (audioContextRef.current) {
                      nextStartTimeRef.current = audioContextRef.current.currentTime;
                    }
                  }
                };
              }
            }

            const inputTranscript = msg.serverContent?.inputTranscription?.text;
            if (inputTranscript) {
              currentInputRef.current += inputTranscript;
            }

            const outputTranscript = msg.serverContent?.outputTranscription?.text;
            if (outputTranscript) {
              currentOutputRef.current += outputTranscript;
            }

            if (msg.serverContent?.turnComplete) {
              if (msg.serverContent.interrupted) {
                stopPlayback();
              }

              if (currentInputRef.current.trim()) {
                addTranscriptMessage('user', currentInputRef.current);
                currentInputRef.current = '';
              }
              if (currentOutputRef.current.trim()) {
                addTranscriptMessage('model', currentOutputRef.current);
                currentOutputRef.current = '';
              }
            }
          },
          onclose: (e) => {
            console.log('Session Closed', e);
            disconnect();
          },
          onerror: (err) => {
            console.error('Session Error', err);
            setError(err.message);
            disconnect();
          },
        },
      });
    } catch (err: any) {
      console.error('Connection Failed', err);
      setError(err.message || 'Failed to connect');
      setConnected(false);
    }
  }, [
    addShoppingItem,
    addTranscriptMessage,
    apiKeyStatus.hasUserKey,
    billing,
    disconnect,
    setActiveSurface,
    setConnected,
    setIsListening,
    setIsSpeaking,
    userApiKey,
    userProfile,
    voice,
    setAnalyserNode,
    setNews,
    setWeather,
    integrations,
    stopPlayback,
    location,
  ]);

  return { connect, disconnect, error };
};
