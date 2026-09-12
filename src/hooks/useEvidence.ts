import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { EvidenceItem } from '../types';

// GET /api/evidence
export function useEvidence() {
  return useQuery({
    queryKey: ['evidence'],
    queryFn: async () => {
      const response = await apiFetch<any>('/evidence');
      return (Array.isArray(response) ? response : response.data || []) as EvidenceItem[];
    },
  });
}

// GET /api/evidence/incident/:incidentId
export function useIncidentEvidence(incidentId: string | null) {
  return useQuery({
    queryKey: ['evidence', 'incident', incidentId],
    queryFn: async () => {
      if (!incidentId) return [];
      const response = await apiFetch<any>(`/evidence/incident/${incidentId}`);
      return (Array.isArray(response) ? response : response.data || []) as EvidenceItem[];
    },
    enabled: !!incidentId,
  });
}

// POST /api/evidence
export function useCreateEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newEvidence: Partial<EvidenceItem>) => {
      return apiFetch<EvidenceItem>('/evidence', {
        method: 'POST',
        body: JSON.stringify(newEvidence),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
  });
}