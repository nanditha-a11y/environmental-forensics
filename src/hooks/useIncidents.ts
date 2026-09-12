import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface Incident {
  id: string;
  incidentId: string;
  title: string;
  location: string;
  type?: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  detected: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  lastUpdated?: string;
  coordinates?: [number, number];
  investigator?: string;
  description?: string;
}

// GET /api/incidents
export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const response = await apiFetch<any>('/incidents');
      return (Array.isArray(response) ? response : response.data || []) as Incident[];
    },
  });
}

// POST /api/incidents
export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newIncident: Partial<Incident>) => {
      return apiFetch<Incident>('/incidents', {
        method: 'POST',
        body: JSON.stringify(newIncident),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

// PATCH /api/incidents/:id
export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Incident> & { id: string }) => {
      return apiFetch<Incident>(`/incidents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}