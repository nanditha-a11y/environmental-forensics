import { ArrowLeft, ChevronRight, ShieldCheck, Loader2, AlertTriangle, History, Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEvidence } from '../../hooks/useEvidence';
import type { EvidenceItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Visual } from './Visuals';

interface VerificationResult {
  status: 'VERIFIED' | 'TAMPERED';
  storedHash: string;
  computedHash: string;
  isIntegrityIntact: boolean;
  verifiedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

const tooltipStyle = {
  background: 'rgba(14, 33, 51, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '10px',
  fontSize: '11.5px',
  color: '#e2e8f0',
};

function EvidenceChart({ item }: { item: EvidenceItem }) {
  if (!item.chart) return null;
  if (item.chartKind === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={item.chart} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7fa5bf', fontSize: 10.5 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#7fa5bf', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200}>
            {item.chart.map((_, i) => (
              <Cell key={i} fill={i === 1 ? '#f87171' : '#fb923c'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={item.chart} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="ev-history" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#7fa5bf', fontSize: 10.5 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7fa5bf', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#ev-history)" isAnimationActive animationDuration={1400} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EvidenceDetail({ item, onBack }: { item: EvidenceItem; onBack?: () => void }) {
  const rawItem = item as any;
  const detailsList = rawItem.details || [
    { label: 'LOCATION', value: rawItem.location || 'Locker B-12 (Central Lab)' },
    { label: 'RECORDED', value: rawItem.timestamp ? new Date(rawItem.timestamp).toLocaleDateString() : '08/09/2026' },
  ];

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Signed URL State
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const rawFileUrl = rawItem.file_url;
  const mimeType = rawItem.mime_type;

  // Fetch signed S3 URL
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!item.id || !rawFileUrl) return;
      try {
        setLoadingUrl(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/evidence/${item.id}/download-url`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPresignedUrl(data.signedUrl);
        } else {
          setPresignedUrl(rawFileUrl);
        }
      } catch (err) {
        setPresignedUrl(rawFileUrl);
      } finally {
        setLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [item.id, rawFileUrl]);

  const activeMediaUrl = presignedUrl || rawFileUrl;

  const isImage = 
    mimeType?.startsWith('image/') || 
    (rawFileUrl && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(rawFileUrl));

  const isVideo = 
    mimeType?.startsWith('video/') || 
    (rawFileUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(rawFileUrl));

  const isAudio = 
    mimeType?.startsWith('audio/') || 
    (rawFileUrl && /\.(mp3|wav|ogg)(\?.*)?$/i.test(rawFileUrl));

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch(`http://localhost:5000/api/evidence/${item.id}/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (item?.id) {
      fetchLogs();
    }
  }, [item.id]);

  const verifyIntegrity = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/evidence/${item.id}/verify`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Verification request failed');
      }
      const data: VerificationResult = await response.json();
      setVerificationResult(data);
      await fetchLogs();
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to verify file integrity');
    } finally {
      setIsVerifying(false);
    }
  };

  // Direct Blob Fetch & Download
  const handleDownload = async () => {
    if (!activeMediaUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(activeMediaUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.title ? `${item.title.replace(/\s+/g, '_')}` : 'evidence-file';
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(activeMediaUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All evidence
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-[15px] font-semibold text-white">{item.title}</h4>
        <Badge tone={verificationResult?.status === 'TAMPERED' ? 'rose' : 'emerald'}>
          {verificationResult?.status || item.status || 'VERIFIED'}
        </Badge>
      </div>

      {/* Glass Preview Panel - Dynamic Signed S3 Media Preview */}
      <div className="glass relative flex min-h-[160px] w-full flex-col items-center justify-center rounded-xl p-3">
        {loadingUrl ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400 mb-2" />
            <p className="text-xs text-slate-400">Authenticating S3 storage stream…</p>
          </div>
        ) : rawFileUrl ? (
          <div className="w-full space-y-3">
            {isImage && (
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-1">
                <img
                  src={activeMediaUrl!}
                  alt={item.title}
                  className="max-h-64 w-full object-contain rounded"
                />
              </div>
            )}

            {isVideo && (
              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
                <video src={activeMediaUrl!} controls className="max-h-64 w-full" />
              </div>
            )}

            {isAudio && (
              <div className="w-full p-3 rounded-lg border border-white/10 bg-black/40 text-center">
                <audio src={activeMediaUrl!} controls className="w-full" />
              </div>
            )}

            {!isImage && !isVideo && !isAudio && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="h-10 w-10 text-emerald-400 mb-1.5" />
                <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {mimeType || 'Attached Document / Data Payload'}
                </p>
              </div>
            )}

            {/* Direct File Action Bar */}
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
              <span className="font-mono text-slate-400">
                {rawItem.file_size ? `${(rawItem.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Secure Cloud Object'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activeMediaUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
                >
                  <ExternalLink className="h-3 w-3" /> Open
                </a>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Visual kind={rawItem.kind || 'lab'} className="h-40 w-full object-contain" />
        )}
      </div>

      {/* Description Section */}
      <div className="glass rounded-xl p-3.5">
        <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase mb-1">Description</p>
        <p className="text-[12.5px] leading-relaxed text-slate-200 whitespace-pre-wrap">
          {item.description || 'No description provided.'}
        </p>
      </div>

      {/* Glass Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        {detailsList.map((d: any, idx: number) => (
          <div key={d.label || idx} className="glass rounded-xl p-3">
            <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">{d.label}</p>
            <p className="mt-1 text-[12.5px] font-semibold text-white">{d.value}</p>
          </div>
        ))}
      </div>

      {item.chart && (
        <div className="pt-2">
          <p className="mb-2 text-[10.5px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            {item.chartKind === 'bar' ? 'Laboratory results' : 'Historical trend (indexed)'}
          </p>
          <EvidenceChart item={item} />
        </div>
      )}

      {/* Glass Verification Banner & Interactive Action */}
      <div className={`glass flex flex-col gap-2.5 rounded-xl border p-3 ${
        verificationResult?.status === 'TAMPERED'
          ? 'border-rose-500/30 bg-rose-500/10'
          : 'border-emerald-500/20 bg-emerald-500/5'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {verificationResult?.status === 'TAMPERED' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            ) : (
              <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <p className="text-[11.5px] text-slate-300">
              Chain of custody · <span className="font-semibold text-white">{item.metaValue || rawItem.location || 'Locker B-12 (Central Lab)'}</span>
            </p>
          </div>

          <button
            onClick={verifyIntegrity}
            disabled={isVerifying}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-200 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Verify SHA-256
              </>
            )}
          </button>
        </div>

        {/* Dynamic Hash Result Breakdown */}
        {verificationResult && (
          <div className="mt-1 space-y-1 border-t border-white/10 pt-2 text-[10.5px] font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className={verificationResult.isIntegrityIntact ? 'font-bold text-emerald-400' : 'font-bold text-rose-400'}>
                {verificationResult.status} ({verificationResult.isIntegrityIntact ? 'Checksum Match' : 'Mismatch Detected'})
              </span>
            </div>
            <div className="truncate text-slate-400">
              <span className="text-slate-500">Hash: </span>
              <span className="text-slate-300">{verificationResult.computedHash}</span>
            </div>
          </div>
        )}

        {verifyError && (
          <p className="mt-1 text-[11px] font-medium text-rose-400 border-t border-rose-500/20 pt-1">
            {verifyError}
          </p>
        )}
      </div>

      {/* Audit Log Timeline / Chain of Custody */}
      <div className="glass rounded-xl border border-white/10 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <History className="h-4 w-4 text-emerald-400" />
            <span className="text-[12px] font-bold tracking-wider text-slate-300 uppercase">Audit Log & History</span>
          </div>
          {loadingLogs && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />}
        </div>

        {logs.length === 0 ? (
          <p className="text-[11.5px] text-slate-400">No recorded audit events for this evidence item.</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-white/5 bg-night-900/40 p-2.5 text-[11.5px]">
                <div className="flex items-center justify-between font-medium text-slate-200">
                  <span className="text-emerald-300 font-semibold">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  <span>By: <strong className="text-slate-300">{log.performed_by}</strong></span>
                  {log.ip_address && <span className="ml-2">| IP: {log.ip_address}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EvidenceModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialItem?: EvidenceItem | null;
}

export function EvidenceModal({ open, onClose, title, subtitle, initialItem = null }: EvidenceModalProps) {
  const [selected, setSelected] = useState<EvidenceItem | null>(initialItem);
  const { data: rawEvidenceItems = [] } = useEvidence();
  const evidenceItems = rawEvidenceItems as EvidenceItem[];

  useEffect(() => {
    if (open) setSelected(initialItem);
  }, [open, initialItem]);

  const rawSelected = selected as any;
  const modalTitle = selected ? selected.title : (title ?? 'EV-2026-001');
  const modalSubtitle = selected 
    ? `${rawSelected.meta || 'Chain of Custody'} · ${rawSelected.metaValue || rawSelected.location || 'Locker B-12 (Central Lab)'}`
    : (subtitle ?? 'Chain of Custody · Locker B-12 (Central Lab)');

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} subtitle={modalSubtitle} icon="vault">
      {selected ? (
        <EvidenceDetail item={selected} onBack={initialItem ? undefined : () => setSelected(null)} />
      ) : (
        <div className="space-y-2.5">
          <p className="pb-1 text-[10.5px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            {evidenceItems.length} evidence items on file
          </p>
          {evidenceItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="glass flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:border-emerald-400/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
                <Icon name={(item as any).kind || 'file'} className="h-4 w-4 text-emerald-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">{item.title}</span>
                <span className="block text-[11px] text-slate-400">
                  {item.meta || 'Sample'} · {item.metaValue || 'Vault'}
                </span>
              </span>
              <Badge tone="emerald">{item.status}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}