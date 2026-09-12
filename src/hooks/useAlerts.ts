import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AlertItem } from '../types';

// GET /api/alerts
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await apiFetch<any>('/alerts');
      const rawData = Array.isArray(response) ? response : response.data || [];

      // Map API payload safely to AlertItem interface
      return rawData.map((item: any, index: number): AlertItem => ({
        id: item.id || `alert-${index}`,
        title: item.title || item.message || 'Alert Triggered',
        source: item.source || item.location || 'System Telemetry',
        severity: (item.severity || 'medium').toLowerCase() as 'high' | 'medium' | 'low',
        time: item.time || item.timestamp || 'Just now',
        detail: item.detail || item.description || 'No additional details provided.',
        action: item.action || 'Investigate source telemetry for updates.',
      }));
    },
  });
}

// POST /api/alerts
export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newAlert: Partial<AlertItem>) => {
      return apiFetch<AlertItem>('/alerts', {
        method: 'POST',
        body: JSON.stringify(newAlert),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}