
export enum SurfaceType {
  NONE = 'NONE',
  SHOPPING = 'SHOPPING',
  AGENDA = 'AGENDA',
  TASKS = 'TASKS',
  NEWS = 'NEWS',
  WEATHER = 'WEATHER',
}

export type VoiceGender = 'female' | 'male' | 'neutral';
export type VoiceStyle = 'casual' | 'formal' | 'focused' | 'empathetic';

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
}

export type AgendaItemType = 'meeting' | 'reminder' | 'task';

export interface AgendaItem {
  id: string;
  title: string;
  time?: string | null;
  type: AgendaItemType;
  eventDate: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  imageUrl: string;
  summary: string;
  url?: string;
}

// Novos tipos para Clima
export interface WeatherCondition {
  main: string; // 'Clear', 'Clouds', 'Rain', etc.
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: WeatherCondition;
}

export interface HourlyForecast {
  time: string; // HH:00
  temp: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  day: string; // 'Seg', 'Ter'...
  min: number;
  max: number;
  condition: WeatherCondition;
}

export interface WeatherInfo {
  location: string;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  nickname: string;
  occupation: string;
  ageRange: string;
  language: 'pt-BR' | 'en-US';
  updatedAt: string;
}

export interface VoiceSettings {
  gender: VoiceGender;
  style: VoiceStyle;
  rate: number;
  pitch: number;
  locale: 'pt-BR' | 'en-US';
  preferredVoiceName?: string;
}

export interface IntegrationStatus {
  webSearchEnabled: boolean;
  newsEnabled: boolean;
  lastSync?: string;
}

export interface ApiKeyCapabilities {
  supportsText: boolean;
  supportsTts: boolean;
  supportsLive: boolean;
}

export interface ApiKeyStatus {
  hasUserKey: boolean;
  mask: string | null;
  lastTestedAt?: string;
  capabilities: ApiKeyCapabilities;
  message?: string;
  provider: 'user' | 'platform';
}

export interface BillingStatus {
  tier: 'free' | 'byok' | 'platform_tts' | 'usage';
  minutesRemaining?: number;
  renewalDate?: string;
  usingPlatformVoice: boolean;
}

export interface AuraState {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  activeSurface: SurfaceType;
  shoppingList: ShoppingItem[];
  agenda: AgendaItem[];
  tasks: Task[];
  news: NewsItem[];
  weather: WeatherInfo | null; // Novo estado
  transcript: { role: 'user' | 'model'; text: string }[];
  userProfile: UserProfile | null;
  voice: VoiceSettings;
  integrations: IntegrationStatus;
  apiKeyStatus: ApiKeyStatus;
  billing: BillingStatus;
  isSettingsOpen: boolean;
  userApiKey?: string | null;
  analyserNode?: AnalyserNode | null;
  newsTopic?: string | null;
  location: { latitude: number; longitude: number; } | null;
  manualLocation: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setActiveSurface: (surface: SurfaceType) => void;
  setShoppingList: (items: ShoppingItem[]) => void;
  setAgenda: (items: AgendaItem[]) => void;
  setTasks: (items: Task[]) => void;
  setNews: (items: NewsItem[], topic?: string | null) => void;
  setWeather: (data: WeatherInfo) => void; // Nova ação
  loadWeather: () => Promise<void>; // Nova ação
  setLocation: (location: { latitude: number; longitude: number; } | null) => void;
  setManualLocation: (location: string | null) => void;
  initializeLocation: () => void;
  loadShoppingList: () => Promise<void>;
  addShoppingItem: (item: string) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  loadAgenda: () => Promise<void>;
  addAgendaItem: (input: { title: string; type: AgendaItemType; eventDate?: string; time?: string }) => Promise<void>;
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
  toggleSettings: (isOpen: boolean) => void;
  setUserApiKey: (key: string | null) => void;
  setAnalyserNode: (node: AnalyserNode | null) => void;
}
