import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Incident } from './useIncidents';

interface SpatialQueryParams {
  lat: number;
  lng: number;
  radiusKm: number;
}

// GET /api/incidents/spatial?lat=...&lng=...&radius=...
export function useSpatialIncidents({ lat, lng, radiusKm }: SpatialQueryParams) {
  return useQuery({
    queryKey: ['incidents', 'spatial', lat, lng, radiusKm],
    queryFn: async () => {
      const endpoint = `/incidents/spatial?lat=${lat}&lng=${lng}&radius=${radiusKm}`;
      const response = await apiFetch<any>(endpoint);
      return (Array.isArray(response) ? response : response.data || []) as Incident[];
    },
    enabled: Boolean(lat && lng && radiusKm),
  });
}