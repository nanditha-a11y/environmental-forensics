import { CalendarClock, FileText, FolderOpen, MapPin, PlusCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { featuredIncident } from '../../data/mock';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { AddEvidenceModal } from './AddEvidenceModal';
import { AiRiskGauge, RiskContributors } from './AiRiskPanel';
import { EvidenceModal } from './EvidenceModal';
import { ReportModal } from './ReportModal';
import { ShareModal } from './ShareModal';
import { RiverScene } from './Visuals';

function MetaRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[12px] font-semibold text-slate-200 ${className}`}>{value}</span>
    </div>
  );
}

export function FeaturedIncident() {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <p className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-slate-400">
            INCIDENT {featuredIncident.id}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Featured case · opened today</p>
        </div>
        <Badge tone="red">High Risk</Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Title + location */}
        <div>
          <h3 className="font-display text-[16.5px] leading-snug font-semibold text-white">{featuredIncident.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {featuredIncident.location}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-400">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
            Detected: {featuredIncident.detected}
          </p>
        </div>

        {/* Metadata + visual */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <MetaRow
              label="Status"
              value={featuredIncident.status}
              className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-amber-300"
            />
            <MetaRow label="Investigator" value={featuredIncident.investigator} />
            <MetaRow label="Priority" value={featuredIncident.priority} className="text-red-300" />
            <MetaRow label="Last updated" value={featuredIncident.lastUpdated} />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-white/8 sm:col-span-2">
            <RiverScene className="h-full min-h-[120px] w-full object-cover" />
            <span className="absolute right-2 bottom-2 rounded-md bg-night-950/70 px-2 py-1 text-[9.5px] font-medium text-slate-300 backdrop-blur">
              River corridor · site R-3
            </span>
          </div>
        </div>

        {/* AI risk */}
        <div className="rounded-xl border border-white/[0.07] bg-night-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">AI Risk Score</p>
            <Badge tone="slate">Composite</Badge>
          </div>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <AiRiskGauge />
            </div>
            <div className="sm:col-span-3">
              <p className="mb-2.5 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Risk contributors</p>
              <RiskContributors />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">Quick Actions</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="emerald" onClick={() => setEvidenceOpen(true)}>
              <FolderOpen className="h-4 w-4" /> View Evidence
            </Button>
            <Button variant="sky" onClick={() => setReportOpen(true)}>
              <FileText className="h-4 w-4" /> Generate Report
            </Button>
            <Button variant="violet" onClick={() => setAddOpen(true)}>
              <PlusCircle className="h-4 w-4" /> Add Evidence
            </Button>
            <Button variant="dark" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share Case
            </Button>
          </div>
        </div>
      </div>

      <EvidenceModal open={evidenceOpen} onClose={() => setEvidenceOpen(false)} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <AddEvidenceModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </GlassCard>
  );
}
