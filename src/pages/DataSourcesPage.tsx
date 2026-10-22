import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Radio,
  Plane,
  Ship,
  Terminal,
  Database,
  RefreshCw,
  Server,
  Filter,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../utils/api';

interface OsintTool {
  id: number;
  name: string;
  category: string;
  description: string;
  url: string;
  icon_name: string;
}

export const DataSourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'recon' | 'tracking'>('directory');
  const [tools, setTools] = useState<OsintTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  // Recon State
  const [reconType, setReconType] = useState<'dns' | 'ssl' | 'whois' | 'ip'>('dns');
  const [reconInput, setReconInput] = useState('');
  const [reconResults, setReconResults] = useState<any>(null);
  const [reconLoading, setReconLoading] = useState(false);

  // Live Tracking State
  const [trackingType, setTrackingType] = useState<'flights' | 'vessels'>('flights');
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/osint/tools');
      if (Array.isArray(data)) {
        setTools(data);
      }
    } catch (err) {
      console.error('Failed to load OSINT Directory tools', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconInput.trim()) return;

    setReconLoading(true);
    setReconResults(null);

    try {
      const payload = reconType === 'ip' ? { ip: reconInput } : { domain: reconInput };
      const res = await apiFetch(`/osint/recon/${reconType}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setReconResults(res);
    } catch (err: any) {
      setReconResults({ error: err.message || 'Recon request failed' });
    } finally {
      setReconLoading(false);
    }
  };

  const fetchLiveTracking = async () => {
    setTrackingLoading(true);
    try {
      const res = await apiFetch(`/osint/${trackingType}?lat=12.9716&lng=77.5946&radius=30`);
      setTrackingData(res[trackingType] || res.flights || res.vessels || []);
    } catch (err) {
      console.error('Failed to fetch tracking stream', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchLiveTracking();
    }
  }, [activeTab, trackingType]);

  const categories = ['All', ...Array.from(new Set(tools.map((t) => t.category)))];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-[22px] font-semibold text-white sm:text-[26px]">
                OSINT Directory & OSIRIS Tracking
              </h1>
              <p className="text-[12.5px] text-slate-400">
                Global geographic intelligence, domain reconnaissance, and real-time tracking streams
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-night-900/60 p-1.5 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'directory'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              Tool Directory
            </button>
            <button
              onClick={() => setActiveTab('recon')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recon'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              <Terminal className="w-4 h-4" />
              OSIRIS Recon
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tracking'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              <Radio className="w-4 h-4 animate-pulse text-emerald-300" />
              Live OSINT Stream
            </button>
          </div>
        </div>

        {/* TAB 1: TOOL DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <GlassCard className="p-4">
              <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="glass-input flex min-w-[260px] w-full md:w-96 items-center gap-2.5 rounded-xl px-3.5 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tools or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0">
                  <Filter className="mr-1 h-3.5 w-3.5 text-slate-500" />
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'border border-white/5 bg-night-900/30 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <GlassCard
                  key={tool.id}
                  className="p-5 flex flex-col justify-between hover:border-emerald-500/40 transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge tone="emerald">{tool.category}</Badge>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                      {tool.name}
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full block text-center py-2 bg-white/5 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    Open External Tool
                  </a>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OSIRIS RECON TOOLKIT */}
        {activeTab === 'recon' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="p-5 space-y-4">
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" /> OSIRIS Active Recon
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Perform server, network, and registry lookups for forensic target analysis.
              </p>

              <form onSubmit={handleReconSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Reconnaissance Target Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dns', label: 'DNS Lookup' },
                      { id: 'ssl', label: 'SSL Inspector' },
                      { id: 'whois', label: 'RDAP / WHOIS' },
                      { id: 'ip', label: 'IP Intelligence' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setReconType(t.id as any)}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          reconType === t.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                            : 'bg-night-900/40 text-slate-400 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {reconType === 'ip' ? 'IP Address' : 'Domain Name'}
                  </label>
                  <div className="glass-input flex items-center rounded-xl px-3.5 py-2">
                    <input
                      type="text"
                      placeholder={reconType === 'ip' ? 'e.g., 8.8.8.8' : 'e.g., epa.gov'}
                      value={reconInput}
                      onChange={(e) => setReconInput(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={reconLoading}
                  variant="emerald"
                  className="w-full justify-center"
                >
                  {reconLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Execute Reconnaissance
                </Button>
              </form>
            </GlassCard>

            <GlassCard className="lg:col-span-2 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300 mb-3 flex items-center gap-2 font-mono">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Terminal Console Output
                </h3>

                {reconResults ? (
                  <pre className="bg-night-950/80 border border-white/10 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[450px]">
                    {JSON.stringify(reconResults, null, 2)}
                  </pre>
                ) : (
                  <div className="bg-night-950/50 border border-white/10 rounded-xl h-[350px] flex items-center justify-center text-slate-500 text-xs font-mono">
                    Enter a target and click execute to view live output.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* TAB 3: LIVE OSINT TRACKING STREAMS */}
        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <GlassCard className="flex justify-between items-center p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrackingType('flights')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    trackingType === 'flights'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-night-900/40 text-slate-400 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <Plane className="w-4 h-4" /> OpenSky ADS-B Flights
                </button>
                <button
                  onClick={() => setTrackingType('vessels')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    trackingType === 'vessels'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-night-900/40 text-slate-400 border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <Ship className="w-4 h-4" /> Maritime AIS Vessels
                </button>
              </div>

              <Button
                onClick={fetchLiveTracking}
                disabled={trackingLoading}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${trackingLoading ? 'animate-spin' : ''}`} />
              </Button>
            </GlassCard>

            <GlassCard className="overflow-hidden p-0">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">Identifier</th>
                    <th className="p-3.5">Type / Country</th>
                    <th className="p-3.5">Latitude</th>
                    <th className="p-3.5">Longitude</th>
                    <th className="p-3.5">Speed / Altitude</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {trackingData.length > 0 ? (
                    trackingData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-bold text-emerald-300">
                          {item.callsign || item.name || item.icao24 || item.mmsi}
                        </td>
                        <td className="p-3.5">{item.country || item.vessel_type || 'N/A'}</td>
                        <td className="p-3.5 font-mono">{item.latitude?.toFixed(4)}</td>
                        <td className="p-3.5 font-mono">{item.longitude?.toFixed(4)}</td>
                        <td className="p-3.5">
                          {item.altitude_m ? `${item.altitude_m} m` : `${item.speed_knots || 0} knots`}
                        </td>
                        <td className="p-3.5">
                          <Badge tone="emerald">
                            Active Telemetry
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        {trackingLoading ? 'Loading telemetry stream...' : 'No targets detected in coverage area.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default DataSourcesPage;