import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Normalize API base URL to prevent double slashes
const RAW_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Support both common localStorage auth key names
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure clean endpoint path formatting
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const response = await fetch(`${API_BASE_URL}${formattedEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  // Return empty object for 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}