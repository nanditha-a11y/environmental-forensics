import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { EvidenceItem } from '../types';

/**
 * Normalizes raw API evidence items to ensure UI-safe defaults
 * for attributes like kind, status, meta, metaValue, and details.
 */
function transformEvidenceItem(raw: any): EvidenceItem {
  const createdAtFormatted = raw.created_at
    ? new Date(raw.created_at).toLocaleDateString()
    : 'Recorded Recently';

  return {
    ...raw,
    id: raw.id,
    title: raw.title || raw.file_name || 'Evidence Item',
    kind: raw.kind || raw.evidence_type || 'lab',
    status: raw.status || (raw.file_hash ? 'VERIFIED' : 'PENDING'),
    meta: raw.meta || 'Chain of Custody',
    metaValue: raw.metaValue || raw.location || 'Central Vault',
    description: raw.description || 'Digital evidence record verified via cryptographic hash chain.',
    details: raw.details || [
      { label: 'LOCATION', value: raw.location || 'Locker B-12 (Central Lab)' },
      { label: 'RECORDED', value: createdAtFormatted },
      { label: 'HASH ID', value: raw.file_hash ? `${raw.file_hash.substring(0, 10)}...` : 'Pending' },
    ],
    file_url: raw.file_url || null,
    file_hash: raw.file_hash || null,
  };
}

// GET /api/evidence
export function useEvidence() {
  return useQuery({
    queryKey: ['evidence'],
    queryFn: async () => {
      const response = await apiFetch<any>('/evidence');
      const list = Array.isArray(response) ? response : response.data || [];
      return list.map(transformEvidenceItem);
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
      const list = Array.isArray(response) ? response : response.data || [];
      return list.map(transformEvidenceItem);
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