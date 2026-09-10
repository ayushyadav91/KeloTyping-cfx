import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, TestResult, MultiResult } from '../components/types';
import { api } from '../components/api';
import { reconnectSocket, disconnectSocket } from '../components/socket';

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
  loadingAuth: boolean;
}

type Action =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token?: string } }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_HISTORY'; payload: TestResult[] }
  | { type: 'SET_LOADING_AUTH'; payload: boolean }
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
  loadingAuth: true,
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<React.Dispatch<Action>>(() => null);

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
        reconnectSocket(action.payload.token);
      }
      return { ...state, user: action.payload.user, loadingAuth: false };

    case 'SET_USER':
      return { ...state, user: action.payload, loadingAuth: false };

    case 'SET_HISTORY':
      return { ...state, matchHistory: action.payload };

    case 'SET_LOADING_AUTH':
      return { ...state, loadingAuth: action.payload };

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'ADD_RESULT':
      return { ...state, matchHistory: [action.payload, ...state.matchHistory] };

    case 'ADD_MULTI_RESULT':
      return { ...state, multiHistory: [action.payload, ...state.multiHistory] };

    case 'UPDATE_BIO':
      return state.user ? { ...state, user: { ...state.user, bio: action.payload } } : state;

    case 'LOGOUT':
      localStorage.removeItem('token');
      disconnectSocket();
      return { ...state, user: null, matchHistory: [], multiHistory: [], loadingAuth: false };

    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: 'SET_LOADING_AUTH', payload: false });
      return;
    }

    reconnectSocket(token);

    api.auth.me()
      .then(res => {
        if (res.user) {
          const userObj: User = {
            id: (res.user as any).id || (res.user as any)._id || 'user_1',
            username: res.user.username,
            email: res.user.email,
            avatarInitial: (res.user.username?.[0] || 'U').toUpperCase(),
            joinedDate: 'Member',
          };
          dispatch({ type: 'SET_USER', payload: userObj });

          // Fetch user's saved results
          api.results.me()
            .then(resData => {
              if (resData.results && Array.isArray(resData.results)) {
                dispatch({ type: 'SET_HISTORY', payload: resData.results });
              }
            })
            .catch(() => {});
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      })
      .catch(() => {
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

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
  const { matchHistory, multiHistory, user } = useAppState();

  const totalTests = matchHistory.length;
  const bestWpm = Math.max(
    user?.bestWpm || 0,
    matchHistory.reduce((max, test) => Math.max(max, test.wpm || 0), 0)
  );
  const avgAcc = matchHistory.length > 0
    ? Math.round(matchHistory.reduce((sum, test) => sum + (test.accuracy || 0), 0) / matchHistory.length)
    : 0;
  
  const totalTimeSec = matchHistory.reduce((sum, test) => sum + (test.time || test.duration || 0), 0);
  const avgWpm = matchHistory.length > 0
    ? Math.round(matchHistory.reduce((sum, test) => sum + (test.wpm || 0), 0) / matchHistory.length)
    : 0;
  
  const multiWins = multiHistory.filter(m => m.winner === 'user').length;
  const streak = 0;

  return { totalTests, bestWpm, avgAcc, multiWins, streak, totalTimeSec, avgWpm };
}
