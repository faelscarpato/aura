
export enum SurfaceType {
  NONE = 'NONE',
  SHOPPING = 'SHOPPING',
  AGENDA = 'AGENDA',
  TASKS = 'TASKS',
  NEWS = 'NEWS',
  EDITOR = 'EDITOR',
  VISION = 'VISION',
}

export type VoiceGender = 'female' | 'male' | 'neutral';
export type VoiceStyle = 'casual' | 'formal' | 'focused' | 'empathetic';

export type AuraEmotion = 'neutral' | 'happy' | 'stressed' | 'sad' | 'calm';

export type AuraDocType =
  | 'memo'
  | 'letter'
  | 'analysis'
  | 'petition'
  | 'resume'
  | 'generic';

export interface AuraDocumentDraft {
  title: string;
  content: string;
  docType: AuraDocType;
}

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

export type VisionMode = 'image' | 'video' | 'live';

export interface AuraState {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  activeSurface: SurfaceType;
  shoppingList: ShoppingItem[];
  agenda: AgendaItem[];
  tasks: Task[];
  news: NewsItem[];
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

  emotion: AuraEmotion;
  isSmartFrameActive: boolean;
  lastActivityAt: number | null;

  // Memory Control
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  isMemorySynced: boolean;

  currentDocument: AuraDocumentDraft | null;

  // Vision State
  visionMode: VisionMode;
  visionFile: File | null;
  visionAnalysisResult: string | null;
  isVisionAnalyzing: boolean;
  liveSession: any | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setActiveSurface: (surface: SurfaceType) => void;
  setShoppingList: (items: ShoppingItem[]) => void;
  setAgenda: (items: AgendaItem[]) => void;
  setTasks: (items: Task[]) => void;
  setNews: (items: NewsItem[], topic?: string | null) => void;
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

  setEmotion: (emotion: AuraEmotion) => void;
  setSmartFrameActive: (active: boolean) => void;
  registerActivity: () => void;
  syncMemory: () => Promise<void>;
  checkMemoryConnection: () => Promise<boolean>;

  setCurrentDocument: (doc: AuraDocumentDraft | null) => void;
  openEmptyEditor: (docType?: AuraDocType) => void;

  // Vision Actions
  openVisionSurface: (mode: VisionMode) => void;
  setVisionFile: (file: File | null) => void;
  analyzeVisionFile: () => Promise<void>;
  clearVision: () => void;
  sendVisionFrame: (base64Frame: string) => void;
  setLiveSession: (session: any | null) => void;
}

// AI Tool Argument Interfaces
export interface UpdateSurfaceArgs {
  surface: 'SHOPPING' | 'AGENDA' | 'TASKS' | 'NEWS' | 'EDITOR' | 'VISION' | 'NONE';
}

export interface AddShoppingItemArgs {
  item: string;
}

export interface GetNewsArgs {
  topic?: string;
}

export interface CreateDocumentArgs {
  docType: AuraDocType;
  title?: string;
  initialContent?: string;
}
