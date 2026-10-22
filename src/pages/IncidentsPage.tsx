import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle2,
  Activity,
  Loader2,
  Paperclip,
  FileText,
  X,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { apiFetch } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';

export interface IncidentItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  created_by?: string;
  location?: any;
  affected_area?: any;
  created_at: string;
}

// Helper: Calculate SHA-256 file hash for integrity tracking
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// -----------------------------------------------------------------------------
// CREATE INCIDENT MODAL WITH FILE ATTACHMENT SUPPORT
// -----------------------------------------------------------------------------
function CreateIncidentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [status, setStatus] = useState<'open' | 'investigating' | 'resolved' | 'closed'>('open');
  const [latitude, setLatitude] = useState('12.9716');
  const [longitude, setLongitude] = useState('77.5946');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const { push } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      push('Please enter an incident title.', 'warning');
      return;
    }

    setLoading(true);
    setStatusText('Creating incident record...');
    try {
      // 1. Register Incident Entry in PostGIS Database
      const incRes = await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          severity,
          status,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      const incidentId = incRes?.data?.id || incRes?.id;

      // 2. Process File Attachment if uploaded
      if (file && incidentId) {
        setStatusText('Hashing file & requesting upload URL...');
        const fileHash = await calculateSHA256(file);

        // Fetch S3 Presigned Upload URL
        const uploadConfig = await apiFetch('/evidence/upload-url', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
          }),
        });

        // Direct S3 Upload
        setStatusText('Uploading attached file to secure storage...');
        await fetch(uploadConfig.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });

        // Link Evidence Record to Created Incident
        setStatusText('Linking attached file to incident vault...');
        await apiFetch('/evidence', {
          method: 'POST',
          body: JSON.stringify({
            incident_id: incidentId,
            title: `Attachment: ${file.name}`,
            kind: file.type.startsWith('image/') ? 'Photos / Imagery' : 'Document Evidence',
            description: `Initial evidence file attached during incident creation.`,
            file_url: uploadConfig.fileUrl,
            file_hash: fileHash,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
          }),
        });
      }

      push(`Incident "${title}" registered successfully!`, 'info');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      setTitle('');
      setFile(null);
      onClose();
    } catch (err: any) {
      push(err.message || 'Failed to create incident', 'warning');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Register New Incident" subtitle="Environmental Threat Intake & Attachment" icon="alert">
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

        {/* ATTACHMENT SECTION */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Attach Photos, Documents, or Files (Optional)</label>
          {!file ? (
            <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-white/20 rounded-xl cursor-pointer bg-night-900/40 hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center justify-center pt-2 pb-2">
                <Paperclip className="h-5 w-5 text-emerald-400 mb-1" />
                <p className="text-[11.5px] text-slate-300 font-medium">Click to attach photos or documents</p>
                <p className="text-[10px] text-slate-500">PDF, JPG, PNG, CSV, MP4 (Max 100MB)</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 text-slate-400 hover:text-rose-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {statusText && (
          <p className="text-[11px] text-emerald-300 animate-pulse flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> {statusText}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
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

// -----------------------------------------------------------------------------
// MAIN INCIDENTS PAGE
// -----------------------------------------------------------------------------
export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/incidents');
      const data = response?.features || response?.data || response;
      if (Array.isArray(data)) {
        const list = data.map((item: any) => {
          if (item?.properties) {
            return {
              id: item.properties.id,
              title: item.properties.title || 'Untitled Incident',
              severity: item.properties.severity || 'medium',
              status: item.properties.status || 'open',
              created_by: item.properties.created_by,
              location: item.geometry,
              created_at: item.properties.created_at,
            };
          }
          return item;
        });
        setIncidents(list);
      } else {
        setIncidents([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch incidents:', err);
      setError(err.message || 'Unable to load incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getSeverityBadgeTone = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
      case 'medium':
        return 'amber';
      case 'low':
      default:
        return 'emerald';
    }
  };

  const getStatusBadgeTone = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'rose';
      case 'investigating':
        return 'amber';
      case 'resolved':
      case 'closed':
      default:
        return 'emerald';
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = inc.title?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      severityFilter === 'ALL' || inc.severity?.toUpperCase() === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const renderCoordinates = (loc: any) => {
    if (!loc) return null;
    let coords = loc.coordinates;
    if (typeof loc === 'string') {
      try {
        coords = JSON.parse(loc).coordinates;
      } catch (e) {
        return null;
      }
    }
    if (Array.isArray(coords) && coords.length >= 2) {
      return `${Number(coords[1]).toFixed(4)}, ${Number(coords[0]).toFixed(4)}`;
    }
    return null;
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-[22px] font-semibold text-white sm:text-[26px]">
                Incident Command Center
              </h1>
              <p className="text-[12.5px] text-slate-400">
                Active environmental threat tracking, geospatial boundaries, and forensic intake
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={fetchIncidents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="emerald" size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" /> New Incident
            </Button>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="glass-input flex min-w-[260px] flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents by title..."
              className="w-full bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  severityFilter === sev
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-night-900/40 text-slate-400 border-white/5 hover:bg-white/5'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Loading State */}
        {loading && incidents.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-5 animate-pulse space-y-3">
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </GlassCard>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard className="p-6 text-center border-rose-500/30 bg-rose-500/5">
            <p className="text-sm font-semibold text-rose-300 mb-2">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchIncidents}>
              Retry Connection
            </Button>
          </GlassCard>
        )}

        {/* Empty State */}
        {!loading && !error && filteredIncidents.length === 0 && (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
            <h3 className="text-base font-semibold text-white">No Incidents Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No incidents registered yet. Click "New Incident" to log a new environmental threat.
            </p>
          </GlassCard>
        )}

        {/* Incidents Grid */}
        {!loading && !error && filteredIncidents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map((inc) => {
              const formattedCoords = renderCoordinates(inc.location);
              return (
                <GlassCard key={inc.id} className="p-5 flex flex-col justify-between hover:border-emerald-500/40 transition">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge tone={getSeverityBadgeTone(inc.severity)}>
                        {inc.severity?.toUpperCase()}
                      </Badge>
                      <Badge tone={getStatusBadgeTone(inc.status)}>
                        {inc.status?.toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug">
                      {inc.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-400 font-mono pt-2">
                      {formattedCoords && (
                        <p className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          {formattedCoords}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        {inc.created_at ? new Date(inc.created_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>ID: {inc.id?.slice(0, 8) || 'N/A'}...</span>
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Spatial Active
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      <CreateIncidentModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </Shell>
  );
};

export default IncidentsPage;