import { StateCreator } from 'zustand';
import { AuraState, SurfaceType, AuraEmotion, VisionMode } from '../../types';

export interface UISlice {
  activeSurface: SurfaceType;
  isSettingsOpen: boolean;
  emotion: AuraEmotion;
  isSmartFrameActive: boolean;
  lastActivityAt: number;
  
  // Vision UI
  visionMode: VisionMode;
  visionFile: File | null;
  visionAnalysisResult: string | null;
  isVisionAnalyzing: boolean;

  setActiveSurface: (surface: SurfaceType) => void;
  toggleSettings: (isOpen: boolean) => void;
  setEmotion: (emotion: AuraEmotion) => void;
  setSmartFrameActive: (active: boolean) => void;
  registerActivity: () => void;
  
  openVisionSurface: (mode: VisionMode) => void;
  setVisionFile: (file: File | null) => void;
  clearVision: () => void;
}

export const createUISlice: StateCreator<AuraState, [], [], UISlice> = (set) => ({
  activeSurface: SurfaceType.NONE,
  isSettingsOpen: false,
  emotion: 'neutral',
  isSmartFrameActive: false,
  lastActivityAt: Date.now(),
  
  visionMode: 'image',
  visionFile: null,
  visionAnalysisResult: null,
  isVisionAnalyzing: false,

  setActiveSurface: (surface) => set({ activeSurface: surface }),
  toggleSettings: (isOpen) => set({ isSettingsOpen: isOpen }),
  setEmotion: (emotion) => set({ emotion }),
  
  setSmartFrameActive: (active) =>
    set((state) => ({
      isSmartFrameActive: active,
    })),

  registerActivity: () =>
    set((state) => ({
      lastActivityAt: Date.now(),
      isSmartFrameActive: false,
    })),

  openVisionSurface: (mode) => set({ activeSurface: SurfaceType.VISION, visionMode: mode }),
  
  setVisionFile: (file) => set({ visionFile: file, visionAnalysisResult: null }),
  
  clearVision: () => set({ visionFile: null, visionAnalysisResult: null, isVisionAnalyzing: false }),
});
