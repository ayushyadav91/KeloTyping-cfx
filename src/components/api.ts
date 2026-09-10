import type { User, TestResult, LeaderboardEntry } from './types';

const API_BASE = '/api';

export const api = {
  auth: {
    register: (data: any) => 
      fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
    
    login: (data: any) => 
      fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
    
    google: (token: string) => 
      fetch(`${API_BASE}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then(res => res.json()),
    
    me: () => 
      fetch(`${API_BASE}/auth/me`).then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json() as Promise<{ user: User }>;
      }),
  },
  
  results: {
    save: (result: Partial<TestResult>) => 
      fetch(`${API_BASE}/results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }).then(res => res.json()),
    
    me: () => 
      fetch(`${API_BASE}/results/me`).then(res => res.json() as Promise<{ results: TestResult[] }>),
    
    leaderboard: () => 
      fetch(`${API_BASE}/results/leaderboard`).then(res => res.json() as Promise<{ leaderboard: LeaderboardEntry[] }>),
  },
  
  prompts: {
    random: () => 
      fetch(`${API_BASE}/prompts/random`).then(res => res.json()),
      
    getById: (id: string) => 
      fetch(`${API_BASE}/prompts/${id}`).then(res => res.json()),
  },
  
  system: {
    health: () => 
      fetch('/health').then(res => res.json()),
      
    docs: () => 
      fetch('/api-docs').then(res => res.text()),
      
    docsJson: () => 
      fetch('/api-docs.json').then(res => res.json()),
  }
};
