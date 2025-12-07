import { StateCreator } from 'zustand';
import { AuraState, ShoppingItem, AgendaItem, Task, NewsItem, UserProfile, VoiceSettings, IntegrationStatus, ApiKeyStatus, BillingStatus, AuraDocType, SurfaceType } from '../../types';
import { shoppingService } from '../../services/shoppingService';
import { agendaService, AgendaItemInput } from '../../services/agendaService';
import { tasksService } from '../../services/tasksService';
import { env } from 'process';

export interface DataSlice {
  shoppingList: ShoppingItem[];
  agenda: AgendaItem[];
  tasks: Task[];
  news: NewsItem[];
  newsTopic: string | null;
  transcript: { role: 'user' | 'model'; text: string }[];
  currentDocument: { title: string; content: string; docType: AuraDocType } | null;
  
  userProfile: UserProfile;
  voice: VoiceSettings;
  integrations: IntegrationStatus;
  apiKeyStatus: ApiKeyStatus;
  billing: BillingStatus;
  userApiKey: string | null;
  
  location: { latitude: number; longitude: number } | null;
  manualLocation: string | null;

  setShoppingList: (items: ShoppingItem[]) => void;
  setAgenda: (items: AgendaItem[]) => void;
  setTasks: (items: Task[]) => void;
  setNews: (items: NewsItem[], topic?: string | null) => void;
  setLocation: (location: { latitude: number; longitude: number } | null) => void;
  setManualLocation: (location: string | null) => void;
  
  initializeLocation: () => void;
  
  loadShoppingList: () => Promise<void>;
  addShoppingItem: (item: string) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  
  loadAgenda: () => Promise<void>;
  addAgendaItem: (input: AgendaItemInput) => Promise<void>;
  deleteAgendaItem: (id: string) => Promise<void>;
  
  loadTasks: () => Promise<void>;
  addTask: (title: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  loadNews: (topic?: string) => Promise<void>;
  
  addTranscriptMessage: (role: 'user' | 'model', text: string) => void;
  
  setUserProfile: (profile: Partial<UserProfile> | null) => void;
  setVoice: (voice: Partial<VoiceSettings>) => void;
  setIntegrationStatus: (payload: Partial<IntegrationStatus>) => void;
  setApiKeyStatus: (payload: Partial<ApiKeyStatus>) => void;
  setBilling: (payload: Partial<BillingStatus>) => void;
  setUserApiKey: (key: string | null) => void;
  
  setCurrentDocument: (doc: { title: string; content: string; docType: AuraDocType } | null) => void;
  openEmptyEditor: (docType?: AuraDocType) => void;
}

const defaultProfile = (): UserProfile => ({
  id: 'local-user',
  fullName: 'Usuário',
  nickname: 'Você',
  occupation: '',
  ageRange: '',
  language: 'pt-BR',
  updatedAt: new Date().toISOString(),
});

// Default values (copied from store.ts or types)
const DEFAULT_VOICE: VoiceSettings = { gender: 'female', rate: 1.0, pitch: 1.0, style: 'casual', locale: 'pt-BR' };
const DEFAULT_INTEGRATIONS: IntegrationStatus = { webSearchEnabled: true, newsEnabled: true };
const DEFAULT_API_KEY_STATUS: ApiKeyStatus = { 
  hasUserKey: true, 
  provider: 'platform', 
  mask: null,
  capabilities: { supportsText: true, supportsTts: true, supportsLive: true }
};
const DEFAULT_BILLING: BillingStatus = { tier: 'free', usingPlatformVoice: false };

export const createDataSlice: StateCreator<AuraState, [], [], DataSlice> = (set, get) => ({
  shoppingList: [],
  agenda: [],
  tasks: [],
  news: [],
  newsTopic: null,
  transcript: [],
  currentDocument: null,
  
  userProfile: defaultProfile(),
  voice: DEFAULT_VOICE,
  integrations: DEFAULT_INTEGRATIONS,
  apiKeyStatus: DEFAULT_API_KEY_STATUS,
  billing: DEFAULT_BILLING,
  userApiKey: process.env.GEMINI_API_KEY,
  
  location: null,
  manualLocation: null,

  setShoppingList: (items) => set({ shoppingList: items, hasUnsavedChanges: true }),
  setAgenda: (items) => set({ agenda: items, hasUnsavedChanges: true }),
  setTasks: (items) => set({ tasks: items, hasUnsavedChanges: true }),
  setNews: (items, topic = null) => set({ news: items, newsTopic: topic || null }),
  setLocation: (location) => set({ location }),
  setManualLocation: (location) => set({ manualLocation: location }),

  initializeLocation: () => {
    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            set({ location: { latitude: data.latitude, longitude: data.longitude } });
            console.log('Localização obtida via IP:', data.city, data.country_name);
          }
        }
      } catch (error) {
        console.error('Erro ao obter localização por IP:', error);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          set({ location: { latitude, longitude } });
        },
        (error) => {
          console.warn("Erro ao obter geolocalização nativa, tentando IP...", error);
          fetchIpLocation();
        },
        { timeout: 10000 }
      );
    } else {
      console.log("Geolocalização não suportada, tentando IP...");
      fetchIpLocation();
    }
  },

  loadShoppingList: async () => {
    try {
      const items = await shoppingService.loadShoppingList();
      set({ shoppingList: items });
    } catch (error) {
      console.error('Erro ao carregar lista de compras no store', error);
    }
  },

  addShoppingItem: async (item) => {
    try {
      const newItem = await shoppingService.addShoppingItem(item);
      set((state) => ({ shoppingList: [newItem, ...state.shoppingList], hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao adicionar item no store', error);
    }
  },

  toggleShoppingItem: async (id) => {
    const current = get().shoppingList.find((item) => item.id === id);
    if (!current) return;
    try {
      const updatedItem = await shoppingService.toggleShoppingItem(id, current.checked);
      set((state) => ({
        shoppingList: state.shoppingList.map((item) => (item.id === id ? updatedItem : item)),
        hasUnsavedChanges: true
      }));
    } catch (error) {
      console.error('Erro ao alternar item no store', error);
    }
  },

  deleteShoppingItem: async (id) => {
    try {
      await shoppingService.deleteShoppingItem(id);
      set((state) => ({ shoppingList: state.shoppingList.filter((item) => item.id !== id), hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao remover item no store', error);
    }
  },

  loadAgenda: async () => {
    try {
      const items = await agendaService.loadAgenda();
      set({ agenda: items });
    } catch (error) {
      console.error('Erro ao carregar agenda no store', error);
    }
  },

  addAgendaItem: async (input: AgendaItemInput) => {
    try {
      const newItem = await agendaService.addAgendaItem(input);
      set((state) => ({ agenda: [newItem, ...state.agenda], hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao adicionar agenda no store', error);
    }
  },

  deleteAgendaItem: async (id) => {
    try {
      await agendaService.deleteAgendaItem(id);
      set((state) => ({ agenda: state.agenda.filter((item) => item.id !== id), hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao remover evento no store', error);
    }
  },

  loadTasks: async () => {
    try {
      const items = await tasksService.loadTasks();
      set({ tasks: items });
    } catch (error) {
      console.error('Erro ao carregar tarefas no store', error);
    }
  },

  addTask: async (title) => {
    try {
      const newItem = await tasksService.addTask(title);
      set((state) => ({ tasks: [newItem, ...state.tasks], hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao adicionar tarefa no store', error);
    }
  },

  toggleTaskCompleted: async (id) => {
    const current = get().tasks.find((t) => t.id === id);
    if (!current) return;
    try {
      const updatedItem = await tasksService.toggleTaskCompleted(id, current.completed);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? updatedItem : task)),
        hasUnsavedChanges: true
      }));
    } catch (error) {
      console.error('Erro ao alternar tarefa no store', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksService.deleteTask(id);
      set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id), hasUnsavedChanges: true }));
    } catch (error) {
      console.error('Erro ao remover tarefa no store', error);
    }
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
      hasUnsavedChanges: true
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
      hasUnsavedChanges: true
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
    
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
      
  openEmptyEditor: (docType?: AuraDocType) => {
    const doc = {
      title: 'Novo documento',
      content: '',
      docType: docType || 'generic',
    };
    set({
      currentDocument: doc,
      activeSurface: SurfaceType.EDITOR,
    });
  },
});
