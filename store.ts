
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AgendaItem,
  AgendaItemType,
  ApiKeyStatus,
  BillingStatus,
  IntegrationStatus,
  AuraState,
  NewsItem,
  ShoppingItem,
  SurfaceType,
  Task,
  UserProfile,
  VoiceSettings,
  WeatherInfo,
} from './types';
import { supabase } from './services/supabaseClient';

const DEFAULT_VOICE: VoiceSettings = {
  gender: 'female',
  style: 'casual',
  rate: 1,
  pitch: 0,
  locale: 'pt-BR',
  preferredVoiceName: 'Kore',
};

const DEFAULT_INTEGRATIONS: IntegrationStatus = {
  webSearchEnabled: true,
  newsEnabled: true,
  lastSync: undefined,
};

const DEFAULT_API_KEY_STATUS: ApiKeyStatus = {
  hasUserKey: false,
  mask: null,
  lastTestedAt: undefined,
  capabilities: {
    supportsText: true,
    supportsTts: false,
    supportsLive: false,
  },
  message: 'Nenhuma chave personalizada cadastrada.',
  provider: 'platform',
};

const DEFAULT_BILLING: BillingStatus = {
  tier: 'free',
  minutesRemaining: undefined,
  renewalDate: undefined,
  usingPlatformVoice: true,
};

const mapShoppingRow = (row: any): ShoppingItem => ({
  id: row.id,
  name: row.name,
  checked: Boolean(row.checked),
  createdAt: row.created_at,
});

const mapAgendaRow = (row: any): AgendaItem => ({
  id: row.id,
  title: row.title,
  type: row.type as AgendaItemType,
  time: row.time,
  eventDate: row.event_date || new Date().toISOString().slice(0, 10),
  createdAt: row.created_at,
});

const mapTaskRow = (row: any): Task => ({
  id: row.id,
  title: row.title,
  completed: Boolean(row.completed),
  createdAt: row.created_at,
});

const defaultProfile = (): UserProfile => ({
  id: 'local-user',
  fullName: 'Usuário',
  nickname: 'Você',
  occupation: '',
  ageRange: '',
  language: 'pt-BR',
  updatedAt: new Date().toISOString(),
});

// Mock Data for Client Fallback
const MOCK_WEATHER: WeatherInfo = {
  location: 'São Paulo (Offline)',
  current: {
    temp: 25,
    feels_like: 27,
    humidity: 65,
    wind_speed: 10,
    condition: { main: 'Clear', description: 'Céu limpo', icon: '01d' }
  },
  hourly: Array.from({length: 8}, (_, i) => ({
    time: `${new Date().getHours() + i}:00`,
    temp: 25 - Math.floor(Math.random() * 3),
    condition: { main: i % 3 === 0 ? 'Clouds' : 'Clear', description: 'Parcialmente nublado', icon: '' }
  })),
  daily: Array.from({length: 5}, (_, i) => ({
    day: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'][i],
    min: 18,
    max: 28,
    condition: { main: Math.random() > 0.5 ? 'Rain' : 'Clear', description: 'Chuva', icon: '' }
  })),
  updatedAt: new Date().toISOString()
};

export const useAuraStore = create<AuraState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      isSpeaking: false,
      isListening: false,
      activeSurface: SurfaceType.NONE,
      isSettingsOpen: false,

      shoppingList: [],
      agenda: [],
      tasks: [],
      news: [],
      weather: null,
      newsTopic: null,
      transcript: [],

      userProfile: defaultProfile(),
      voice: DEFAULT_VOICE,
      integrations: DEFAULT_INTEGRATIONS,
      apiKeyStatus: DEFAULT_API_KEY_STATUS,
      billing: DEFAULT_BILLING,
      userApiKey: null,
      analyserNode: null,
      location: null,
      manualLocation: null,

      setConnected: (connected) => set({ isConnected: connected }),
      setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
      setIsListening: (listening) => set({ isListening: listening }),
      setActiveSurface: (surface) => set({ activeSurface: surface }),
      toggleSettings: (isOpen) => set({ isSettingsOpen: isOpen }),

      setShoppingList: (items) => set({ shoppingList: items }),
      setAgenda: (items) => set({ agenda: items }),
      setTasks: (items) => set({ tasks: items }),
      setNews: (items, topic = null) => set({ news: items, newsTopic: topic || null }),
      setWeather: (data) => set({ weather: data }),
      setLocation: (location) => set({ location }),
      setManualLocation: (location) => set({ manualLocation: location }),

      initializeLocation: () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              set({ location: { latitude, longitude } });
              // Carrega o clima assim que tiver localização (e não tiver manual definido)
              if (!get().manualLocation) {
                get().loadWeather();
              }
            },
            (error) => {
              console.error("Erro ao obter geolocalização", error);
              // Não define location como null aqui para não sobrescrever dados antigos persistidos se houver
              // Mas garante que o loadWeather seja chamado com fallback
              get().loadWeather(); 
            }
          );
        } else {
          console.log("Geolocalização não é suportada por este navegador.");
          get().loadWeather();
        }
      },

      loadWeather: async () => {
        const { location, manualLocation } = get();
        try {
          let url = '/api/weather';
          
          if (manualLocation) {
            url += `?q=${encodeURIComponent(manualLocation)}`;
          } else if (location) {
            url += `?lat=${location.latitude}&lon=${location.longitude}`;
          } else {
            // Default location to prevent 400 Bad Request
            url += `?q=São Paulo,BR`;
          }
          
          const res = await fetch(url);
          if (!res.ok) throw new Error('Falha ao buscar clima');
          const data = await res.json();
          set({ weather: data });
        } catch (err) {
          console.error("Erro ao carregar clima, usando dados de fallback:", err);
          // Only set mock weather if we don't have real data yet or if it's a hard failure
          if (!get().weather) {
             set({ weather: MOCK_WEATHER });
          }
        }
      },

      loadShoppingList: async () => {
        const { data, error } = await supabase
          .from('shopping_list')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar lista de compras', error);
          return;
        }
        set({ shoppingList: (data || []).map(mapShoppingRow) });
      },

      addShoppingItem: async (item) => {
        const name = item.trim();
        if (!name) return;
        const { data, error } = await supabase
          .from('shopping_list')
          .insert({ name, checked: false })
          .select()
          .single();
        if (error) {
          console.error('Erro ao adicionar item', error);
          return;
        }
        set((state) => ({ shoppingList: [mapShoppingRow(data), ...state.shoppingList] }));
      },

      toggleShoppingItem: async (id) => {
        const current = get().shoppingList.find((item) => item.id === id);
        const nextChecked = current ? !current.checked : false;
        const { data, error } = await supabase
          .from('shopping_list')
          .update({ checked: nextChecked })
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.error('Erro ao alternar item', error);
          return;
        }
        if (data) {
          set((state) => ({
            shoppingList: state.shoppingList.map((item) => (item.id === id ? mapShoppingRow(data) : item)),
          }));
        }
      },

      deleteShoppingItem: async (id) => {
        const { error } = await supabase.from('shopping_list').delete().eq('id', id);
        if (error) {
          console.error('Erro ao remover item', error);
          return;
        }
        set((state) => ({ shoppingList: state.shoppingList.filter((item) => item.id !== id) }));
      },

      loadAgenda: async () => {
        const { data, error } = await supabase.from('agenda').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar agenda', error);
          return;
        }
        set({ agenda: (data || []).map(mapAgendaRow) });
      },

      addAgendaItem: async (input) => {
        const payload = {
          title: input.title,
          type: input.type,
          event_date: input.eventDate || new Date().toISOString().slice(0, 10),
          time: input.time,
        };
        const { data, error } = await supabase.from('agenda').insert(payload).select().single();
        if (error) {
          console.error('Erro ao adicionar agenda', error);
          return;
        }
        set((state) => ({ agenda: [mapAgendaRow(data), ...state.agenda] }));
      },

      deleteAgendaItem: async (id) => {
        const { error } = await supabase.from('agenda').delete().eq('id', id);
        if (error) {
          console.error('Erro ao remover evento', error);
          return;
        }
        set((state) => ({ agenda: state.agenda.filter((item) => item.id !== id) }));
      },

      loadTasks: async () => {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar tarefas', error);
          return;
        }
        set({ tasks: (data || []).map(mapTaskRow) });
      },

      addTask: async (title) => {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;
        const { data, error } = await supabase.from('tasks').insert({ title: cleanTitle, completed: false }).select().single();
        if (error) {
          console.error('Erro ao adicionar tarefa', error);
          return;
        }
        set((state) => ({ tasks: [mapTaskRow(data), ...state.tasks] }));
      },

      toggleTaskCompleted: async (id) => {
        const current = get().tasks.find((t) => t.id === id);
        const nextCompleted = current ? !current.completed : false;
        const { data, error } = await supabase
          .from('tasks')
          .update({ completed: nextCompleted })
          .eq('id', id)
          .select()
          .single();
        if (error) {
          console.error('Erro ao alternar tarefa', error);
          return;
        }
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? mapTaskRow(data) : task)),
        }));
      },

      deleteTask: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
          console.error('Erro ao remover tarefa', error);
          return;
        }
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
      },

      loadNews: async (topic) => {
        try {
          const { location, manualLocation } = get();
          let qs = topic ? `?topic=${encodeURIComponent(topic)}` : '';
          
          if (manualLocation) {
             const separator = qs ? '&' : '?';
             if (!topic) {
                qs = `?topic=${encodeURIComponent(manualLocation)}`;
             }
          } else if (location) {
            const separator = qs ? '&' : '?';
            qs += `${separator}lat=${location.latitude}&lon=${location.longitude}`;
          }
          const res = await fetch(`/api/news${qs}`);
          if (!res.ok) throw new Error('Falha ao buscar notícias');
          const payload = (await res.json()) as NewsItem[];
          set({ news: payload, newsTopic: topic || null });
        } catch (err) {
          console.error('Erro ao buscar notícias', err);
        }
      },

      addTranscriptMessage: (role, text) =>
        set((state) => ({
          transcript: [...state.transcript.slice(-4), { role, text }],
        })),

      setUserProfile: (profile) =>
        set((state) => ({
          userProfile: profile
            ? ({
                ...(state.userProfile || defaultProfile()),
                ...profile,
                updatedAt: profile.updatedAt || new Date().toISOString(),
              } as UserProfile)
            : defaultProfile(),
        })),

      setVoice: (voice) =>
        set((state) => ({
          voice: { ...state.voice, ...voice },
        })),

      setIntegrationStatus: (payload) =>
        set((state) => ({
          integrations: { ...state.integrations, ...payload, lastSync: new Date().toISOString() },
        })),

      setApiKeyStatus: (payload) =>
        set((state) => ({
          apiKeyStatus: { ...state.apiKeyStatus, ...payload },
        })),

      setBilling: (payload) =>
        set((state) => ({
          billing: { ...state.billing, ...payload },
        })),

      setUserApiKey: (key) =>
        set((state) => ({
          userApiKey: key,
          apiKeyStatus: {
            ...state.apiKeyStatus,
            hasUserKey: Boolean(key),
            provider: key ? 'user' : 'platform',
            mask: key ? `****${key.slice(-4)}` : null,
          },
        })),
      setAnalyserNode: (node) => set({ analyserNode: node }),
    }),
    {
      name: 'aura-storage',
      partialize: (state) => ({
        shoppingList: state.shoppingList,
        agenda: state.agenda,
        tasks: state.tasks,
        news: state.news,
        newsTopic: state.newsTopic,
        weather: state.weather,
        transcript: state.transcript,
        userProfile: state.userProfile,
        voice: state.voice,
        integrations: state.integrations,
        apiKeyStatus: state.apiKeyStatus,
        billing: state.billing,
        isSettingsOpen: state.isSettingsOpen,
        activeSurface: state.activeSurface,
        manualLocation: state.manualLocation,
      }),
    },
  ),
);
