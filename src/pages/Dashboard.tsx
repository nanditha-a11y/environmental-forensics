import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EvidenceSummary } from '../components/dashboard/EvidenceSummary';
import { FeaturedIncident } from '../components/dashboard/FeaturedIncident';
import { IncidentMap } from '../components/dashboard/IncidentMap';
import { InvestigationTimeline } from '../components/dashboard/InvestigationTimeline';
import { KpiCard } from '../components/dashboard/KpiCard';
import { PlatformIntegration } from '../components/dashboard/PlatformIntegration';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { Shell } from '../components/layout/Shell';
import { kpis } from '../data/mock';

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[11.5px] tabular-nums text-slate-400">
      {now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} ·{' '}
      {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export default function Dashboard() {
  return (
    <Shell>
      <div className="space-y-5 lg:space-y-6">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-white lg:text-[26px]">Command Dashboard</h1>
            <p className="mt-1 text-[12.5px] text-slate-400">
              Environmental intelligence across the Bengaluru operational theatre
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Systems nominal
            </span>
            <LiveClock />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.id} kpi={kpi} index={i} />
          ))}
        </div>

        {/* Map + featured incident */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <IncidentMap />
          </div>
          <div className="xl:col-span-2">
            <FeaturedIncident />
          </div>
        </div>

        {/* Evidence summary */}
        <EvidenceSummary />

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <RecentAlerts />
          <InvestigationTimeline />
          <PlatformIntegration />
        </div>

        {/* Footer note */}
        <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-[11px] text-slate-600">
          <Activity className="h-3 w-3" />
          EFIF prototype · all data simulated · not a production system
        </p>
      </div>
    </Shell>
  );
}
