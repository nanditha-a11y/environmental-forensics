import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface MonitoringSite {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
}

export interface NearbyEvidenceParams {
  lat: number;
  lng: number;
  radiusKm?: number;
}

// Fetch all spatial monitoring sites
export function useMonitoringSites() {
  return useQuery({
    queryKey: ['monitoring-sites'],
    queryFn: async () => {
      const response = await apiFetch<any>('/sites');
      return (Array.isArray(response) ? response : response.data || []) as MonitoringSite[];
    },
    retry: 2,
  });
}

// Fetch evidence within specified radius (e.g., 5 km)
export function useNearbyEvidence({ lat, lng, radiusKm = 5 }: NearbyEvidenceParams) {
  return useQuery({
    queryKey: ['evidence', 'nearby', lat, lng, radiusKm],
    queryFn: async () => {
      const response = await apiFetch<any>(`/evidence/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
      return (Array.isArray(response) ? response : response.data || []);
    },
    enabled: Boolean(lat && lng),
    retry: 2,
  });
}