import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, TestResult, MultiResult } from '../components/types';

// Mock data for leaderboard
export const GHOST_PLAYERS = [
  { id: 'ghost1', name: 'SpeedDemon', wpm: 155, accuracy: 98, streak: 12, country: 'US', isGhost: true },
  { id: 'ghost2', name: 'TypeNinja', wpm: 130, accuracy: 99, streak: 8, country: 'JP', isGhost: true },
  { id: 'ghost3', name: 'KeyboardWarrior', wpm: 110, accuracy: 95, streak: 5, country: 'UK', isGhost: true },
  { id: 'ghost4', name: 'AverageJoe', wpm: 65, accuracy: 92, streak: 2, country: 'CA', isGhost: true },
];

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  matchHistory: TestResult[];
  multiHistory: MultiResult[];
}

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_RESULT'; payload: TestResult }
  | { type: 'ADD_MULTI_RESULT'; payload: MultiResult }
  | { type: 'UPDATE_BIO'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  user: null,
  theme: 'dark',
  matchHistory: [],
  multiHistory: [],
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<React.Dispatch<Action>>(() => null);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'ADD_RESULT':
      return { ...state, matchHistory: [...state.matchHistory, action.payload] };
    case 'ADD_MULTI_RESULT':
      return { ...state, multiHistory: [...state.multiHistory, action.payload] };
    case 'UPDATE_BIO':
      return state.user ? { ...state, user: { ...state.user, bio: action.payload } } : state;
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within a AppProvider');
  }
  return context;
}

export function useUserStats() {
  const { matchHistory, multiHistory } = useAppState();

  const totalTests = matchHistory.length;
  const bestWpm = matchHistory.reduce((max, test) => Math.max(max, test.wpm), 0);
  const avgAcc = matchHistory.length > 0
    ? Math.round(matchHistory.reduce((sum, test) => sum + test.accuracy, 0) / matchHistory.length)
    : 0;
  
  const totalTimeSec = matchHistory.reduce((sum, test) => sum + test.time, 0);
  const avgWpm = matchHistory.length > 0
    ? Math.round(matchHistory.reduce((sum, test) => sum + test.wpm, 0) / matchHistory.length)
    : 0;
  
  const multiWins = multiHistory.filter(m => m.winner === 'user').length;
  const streak = 0; // Simple mock

  return { totalTests, bestWpm, avgAcc, multiWins, streak, totalTimeSec, avgWpm };
}
