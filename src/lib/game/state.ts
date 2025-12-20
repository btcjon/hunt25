import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  // Team
  teamName: string;
  setTeamName: (name: string) => void;

  // Progress
  currentStop: number;
  collectedSymbols: string[];
  advanceToNextStop: () => void;
  collectSymbol: (symbol: string) => void;

  // Voice state
  isSpeaking: boolean;
  isListening: boolean;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;

  // Photo verification
  isVerifying: boolean;
  verificationResult: 'pending' | 'success' | 'partial' | 'failed' | null;
  setVerifying: (verifying: boolean) => void;
  setVerificationResult: (result: 'pending' | 'success' | 'partial' | 'failed' | null) => void;

  // Hints
  hintsUsed: Record<number, number>;
  recordHint: (stopId: number) => void;

  // Chat history for current stop
  chatHistory: Array<{ role: 'user' | 'granddaddy'; content: string }>;
  addMessage: (role: 'user' | 'granddaddy', content: string) => void;
  clearChatHistory: () => void;

  // Reset
  resetGame: () => void;
}

const initialState = {
  teamName: '',
  currentStop: 1,
  collectedSymbols: [],
  isSpeaking: false,
  isListening: false,
  isVerifying: false,
  verificationResult: null,
  hintsUsed: {},
  chatHistory: [],
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTeamName: (name) => set({ teamName: name }),

      advanceToNextStop: () => set((state) => ({
        currentStop: state.currentStop + 1,
        verificationResult: null,
        chatHistory: [],
      })),

      collectSymbol: (symbol) => set((state) => ({
        collectedSymbols: [...state.collectedSymbols, symbol],
      })),

      setSpeaking: (speaking) => set({ isSpeaking: speaking }),
      setListening: (listening) => set({ isListening: listening }),

      setVerifying: (verifying) => set({ isVerifying: verifying }),
      setVerificationResult: (result) => set({ verificationResult: result }),

      recordHint: (stopId) => set((state) => ({
        hintsUsed: {
          ...state.hintsUsed,
          [stopId]: (state.hintsUsed[stopId] || 0) + 1,
        },
      })),

      addMessage: (role, content) => set((state) => ({
        chatHistory: [...state.chatHistory, { role, content }],
      })),

      clearChatHistory: () => set({ chatHistory: [] }),

      resetGame: () => set(initialState),
    }),
    {
      name: 'star-seekers-game',
    }
  )
);
