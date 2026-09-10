import type { User, TestResult, LeaderboardEntry } from './types';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T = any>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data as T;
}

export const api = {
  auth: {
    register: (data: any) =>
      fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    login: (data: any) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse),

    google: (idToken: string) =>
      fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }).then(handleResponse),

    me: () =>
      fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean; user: User }>),
  },

  results: {
    save: (result: Partial<TestResult>) =>
      fetch(`${API_BASE}/results`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(result),
      }).then(handleResponse),

    me: () =>
      fetch(`${API_BASE}/results/me`, {
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean; results: TestResult[] }>),

    leaderboard: () =>
      fetch(`${API_BASE}/results/leaderboard`, {
        headers: getAuthHeaders(),
      }).then(handleResponse<{ success: boolean; leaderboard: LeaderboardEntry[] }>),
  },

  prompts: {
    random: () =>
      fetch(`${API_BASE}/prompts/random`).then(handleResponse),

    getById: (id: string) =>
      fetch(`${API_BASE}/prompts/${id}`).then(handleResponse),
  },

  system: {
    health: () =>
      fetch('/health').then(handleResponse),

    docs: () =>
      fetch('/api-docs').then(res => res.text()),

    docsJson: () =>
      fetch('/api-docs.json').then(handleResponse),
  },
};
