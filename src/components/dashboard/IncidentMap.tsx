import { useNavigate } from 'react-router-dom';
import { useIncidents } from '../../hooks/useIncidents';
import { GlassCard } from '../ui/GlassCard';
import SpatialMap from './SpatialMap';

export function IncidentMap() {
  const navigate = useNavigate();
  const { data: incidents } = useIncidents();

  const totalIncidents = incidents?.length || 0;
  const activeIncidents = incidents?.filter((inc) => inc.status !== 'RESOLVED' && inc.status !== 'CLOSED').length || 0;

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <h2 className="section-title">Incident Map</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Live operational view · {totalIncidents} incidents · {activeIncidents} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live feed
          </span>
        </div>
      </div>

      {/* Interactive GIS Map Area */}
      <div className="relative min-h-[420px] flex-1 overflow-hidden lg:min-h-[520px]">
        <SpatialMap />
      </div>

      {/* Footer */}
      <button
        onClick={() => navigate('/map')}
        className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-white/[0.03] hover:text-emerald-200"
      >
        View Full Map <span aria-hidden>→</span>
      </button>
    </GlassCard>
  );
}

export default IncidentMap;