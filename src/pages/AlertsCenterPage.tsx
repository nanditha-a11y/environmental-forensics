import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Filter,
  ShieldAlert,
  RefreshCw,
  Clock,
  Radio,
  CheckCheck,
  Building2,
  MapPin,
  Flame,
  Info,
} from 'lucide-react';
import { Shell } from '../components/layout/Shell';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../utils/api';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  source: string;
  site_id?: string;
  incident_id?: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'warning';
  is_read: boolean;
  is_resolved: boolean;
  dedup_key?: string;
  triggered_at: string;
}

export const AlertsCenterPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/alerts');
      const data = response.data || response;
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch alerts:', err);
      setError(err.message || 'Unable to load threat alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiFetch(`/alerts/${id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiFetch('/alerts/read-all', {
        method: 'PATCH',
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityBadgeTone = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'rose';
      case 'high':
        return 'amber';
      case 'medium':
      case 'warning':
        return 'amber';
      case 'low':
      default:
        return 'emerald';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Flame className="h-4 w-4 text-rose-400" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'medium':
      case 'warning':
        return <ShieldAlert className="h-4 w-4 text-amber-300" />;
      case 'low':
      default:
        return <Info className="h-4 w-4 text-emerald-400" />;
    }
  };

  // Filter Logic
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity =
      severityFilter === 'ALL' ||
      alert.severity?.toUpperCase() === severityFilter.toUpperCase();
    const matchesRead = readFilter === 'ALL' || !alert.is_read;
    return matchesSeverity && matchesRead;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const criticalCount = alerts.filter(
    (a) => a.severity?.toLowerCase() === 'critical' && !a.is_read
  ).length;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display text-[22px] font-semibold text-white sm:text-[26px]">
                Threat Alerts & Monitoring Center
              </h1>
              <p className="text-[12.5px] text-slate-400">
                Automated airspace intrusions, sensor threshold breaches, and environmental anomalies
              </p>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchAlerts}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="text-slate-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="emerald"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark All as Read ({unreadCount})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total System Alerts
              </p>
              <p className="text-2xl font-bold text-white mt-1">{alerts.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-300">
              <Radio className="h-5 w-5 animate-pulse text-emerald-400" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Unread Threat Alerts
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{unreadCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Bell className="h-5 w-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Active Critical Incursions
              </p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{criticalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </GlassCard>
        </div>

        {/* Filters & Control Toolbar */}
        <GlassCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-night-900/60 p-1.5 backdrop-blur-xl">
            <button
              onClick={() => setReadFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                readFilter === 'ALL'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setReadFilter('UNREAD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                readFilter === 'UNREAD'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
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

        {/* Alert Cards Container */}
        <div className="space-y-3">
          {/* Loading State */}
          {loading && alerts.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} className="p-5 animate-pulse flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-white/10 rounded" />
                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <GlassCard className="p-6 text-center border-rose-500/30 bg-rose-500/5">
              <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-300">{error}</p>
              <Button
                onClick={fetchAlerts}
                variant="ghost"
                size="sm"
                className="mt-3 text-rose-300 hover:bg-rose-500/10"
              >
                Try Again
              </Button>
            </GlassCard>
          )}

          {/* Empty State */}
          {!loading && !error && filteredAlerts.length === 0 && (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No Threat Alerts Recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-h-12 max-w-sm">
                No active spatial incursions or sensor threshold breaches match your selected filters.
              </p>
            </GlassCard>
          )}

          {/* Alert Items List */}
          {!loading &&
            !error &&
            filteredAlerts.map((alert) => (
              <GlassCard
                key={alert.id}
                className={`p-4 sm:p-5 transition-all border ${
                  !alert.is_read
                    ? 'border-emerald-500/30 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
                    : 'border-white/[0.06] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="p-2.5 rounded-xl border border-white/10 bg-night-900/80 shrink-0">
                      {getSeverityIcon(alert.severity)}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {alert.title}
                        </h3>
                        <Badge tone={getSeverityBadgeTone(alert.severity)}>
                          {alert.severity?.toUpperCase()}
                        </Badge>
                        {!alert.is_read && (
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {alert.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Radio className="h-3.5 w-3.5 text-emerald-400" />
                          Source: <strong className="text-slate-300">{alert.source || 'Automated Engine'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatRelativeTime(alert.triggered_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    {!alert.is_read && (
                      <Button
                        onClick={() => handleMarkAsRead(alert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-emerald-300 hover:bg-emerald-400/10 text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark as Read</span>
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
        </div>
      </div>
    </Shell>
  );
};

export default AlertsCenterPage;