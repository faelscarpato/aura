import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuraState } from './types';
import { createUISlice } from './store/slices/createUISlice';
import { createDataSlice } from './store/slices/createDataSlice';
import { createSessionSlice } from './store/slices/createSessionSlice';

export const useAuraStore = create<AuraState>()(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createDataSlice(...a),
      ...createSessionSlice(...a),
    }),
    {
      name: 'aura-storage',
      partialize: (state) => ({
        shoppingList: state.shoppingList,
        agenda: state.agenda,
        tasks: state.tasks,
        news: state.news,
        newsTopic: state.newsTopic,
        transcript: state.transcript,
        userProfile: state.userProfile,
        voice: state.voice,
        integrations: state.integrations,
        apiKeyStatus: state.apiKeyStatus,
        billing: state.billing,
        isSettingsOpen: state.isSettingsOpen,
        activeSurface: state.activeSurface,
        manualLocation: state.manualLocation,
        currentDocument: state.currentDocument,
      }),
    },
  ),
);
