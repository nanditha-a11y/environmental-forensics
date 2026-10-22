import React, { useState } from 'react';
import { AlertTriangle, MapPin, Plus, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiFetch } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

interface CreateIncidentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateIncidentModal({ open, onClose }: CreateIncidentModalProps) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [status, setStatus] = useState<'open' | 'investigating' | 'resolved' | 'closed'>('open');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [loading, setLoading] = useState(false);

  const { push } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      push('Please enter an incident title.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          severity,
          status,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      push(`Incident "${title}" registered successfully!`, 'info');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setTitle('');
      onClose();
    } catch (err: any) {
      push(err.message || 'Failed to create incident', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Register New Incident" subtitle="Environmental Threat Intake" icon="alert">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Title *</label>
          <div className="glass-input flex items-center rounded-xl px-3.5 py-2">
            <input
              type="text"
              required
              placeholder="e.g., Chemical Discharge in Vrishabhavathi River"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full rounded-xl border border-white/10 bg-night-900/90 px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-white/10 bg-night-900/90 px-3 py-2 text-xs text-slate-200 outline-none"
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
            <div className="glass-input flex items-center gap-1.5 rounded-xl px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
            <div className="glass-input flex items-center gap-1.5 rounded-xl px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="emerald" size="sm" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Register Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
}