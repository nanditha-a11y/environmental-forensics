import { useState } from 'react';
import { 
  Archive, 
  CheckCircle2, 
  FilePlus2, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  ShieldX,
  Trash2
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { QueryState } from '../components/ui/QueryState';
import { AddEvidenceModal } from '../components/dashboard/AddEvidenceModal';
import { EvidenceModal } from '../components/dashboard/EvidenceModal';
import { useEvidence } from '../hooks/useEvidence';
import { useToast } from '../context/ToastContext';
import type { EvidenceItem } from '../types';

export default function EvidenceVaultPage() {
  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('ALL');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<EvidenceItem | null>(null);
  
  // Action state tracking
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verificationMap, setVerificationMap] = useState<Record<string, any>>({});

  const { data: rawEvidenceList = [], isLoading, isError, error, refetch } = useEvidence();
  const evidenceList = rawEvidenceList as EvidenceItem[];
  const { push } = useToast();

  const handleVerifyInline = async (id: string) => {
    setVerifyingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/evidence/${id}/verify`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Verification failed');
      }
      const data = await res.json();
      setVerificationMap((prev) => ({ ...prev, [id]: data }));
      if (data.isIntegrityIntact) {
        push('Integrity Verified: Cryptographic SHA-256 match intact.');
      } else {
        push('TAMPER ALERT: SHA-256 hash checksum mismatch detected!', 'warning');
      }
    } catch (err: any) {
      push(err.message || 'Failed to verify evidence checksum', 'warning');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/evidence/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete evidence');
      }

      push(`Evidence "${title}" removed from vault and storage.`);
      refetch();
    } catch (err: any) {
      push(err.message || 'Error deleting evidence record', 'warning');
    } finally {
      setDeletingId(null);
    }
  };

  const kinds = ['ALL', 'Drone Imagery', 'Water Sample', 'eDNA Analysis', 'Chemical Analysis', 'GIS Layer', 'Digital Evidence'];

  const filteredEvidence = evidenceList.filter((item: EvidenceItem) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.file_hash && item.file_hash.toLowerCase().includes(search.toLowerCase())) ||
      (item.kind && item.kind.toLowerCase().includes(search.toLowerCase()));

    const matchesKind = selectedKind === 'ALL' || item.kind === selectedKind;

    return matchesSearch && matchesKind;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Archive className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-display text-[22px] font-semibold text-white sm:text-[26px]">Evidence Vault</h1>
                <p className="text-[12.5px] text-slate-400">
                  Immutable forensic storage & SHA-256 cryptographic chain-of-custody tracking
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="md" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="emerald" size="md" onClick={() => setAddModalOpen(true)}>
              <FilePlus2 className="h-4 w-4" /> Upload Evidence
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="glass-input flex min-w-[260px] flex-1 items-center gap-2.5 rounded-xl px-3.5 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, evidence tag, or SHA-256 hash…"
                className="w-full bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Kind Pill Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="mr-1 h-3.5 w-3.5 text-slate-500" />
              {kinds.map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedKind(k)}
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                    selectedKind === k
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'border border-white/5 bg-night-900/30 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Searchable Evidence Table */}
        <GlassCard className="overflow-hidden">
          <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            {filteredEvidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Archive className="h-10 w-10 text-slate-600" />
                <p className="mt-3 text-[14px] font-medium text-slate-300">No evidence records found</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  Try adjusting your search criteria or register new evidence using the upload drawer.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
                    <tr>
                      <th className="px-4 py-3.5">Evidence Title</th>
                      <th className="px-4 py-3.5">Kind</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">SHA-256 Checksum</th>
                      <th className="px-4 py-3.5">Registered</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {filteredEvidence.map((item: EvidenceItem) => {
                      const vResult = verificationMap[item.id];
                      const isTampered = vResult?.status === 'TAMPERED';
                      const isVerified = vResult?.status === 'VERIFIED';

                      return (
                        <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => setSelectedDetailItem(item)}
                              className="font-semibold text-white transition-colors hover:text-emerald-300 text-left"
                            >
                              {item.title}
                            </button>
                            <span className="block text-[10.5px] text-slate-500 font-mono">
                              ID: {item.id}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="chip !text-[10px]">{item.kind || 'Digital Evidence'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            {isTampered ? (
                              <Badge tone="rose">
                                <ShieldX className="h-3 w-3" /> TAMPERED
                              </Badge>
                            ) : isVerified ? (
                              <Badge tone="emerald">
                                <CheckCircle2 className="h-3 w-3" /> VERIFIED
                              </Badge>
                            ) : (
                              <Badge tone={item.status === 'VERIFIED' ? 'emerald' : 'amber'}>
                                {item.status || 'VERIFIED'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                            {item.file_hash ? (
                              <span className="inline-block max-w-[140px] truncate" title={item.file_hash}>
                                {item.file_hash}
                              </span>
                            ) : (
                              <span className="text-slate-600">Pending Hash</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleVerifyInline(item.id)}
                                disabled={verifyingId === item.id || !item.file_hash}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                {verifyingId === item.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying...
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3.5 w-3.5" /> Verify Integrity
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.title)}
                                disabled={deletingId === item.id}
                                title="Delete Evidence"
                                className="flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </QueryState>
        </GlassCard>
      </div>

      {/* Upload Drawer / Modal */}
      <AddEvidenceModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {/* Detailed View / Chain of Custody Audit Modal */}
      {selectedDetailItem && (
        <EvidenceModal
          open={!!selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          initialItem={selectedDetailItem}
        />
      )}
    </Shell>
  );
}