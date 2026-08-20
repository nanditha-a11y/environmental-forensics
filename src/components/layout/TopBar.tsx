import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronDown, CircleCheck, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';
import { alerts, evidenceItems, notifications } from '../../data/mock';
import { useClickOutside } from '../../hooks/useClickOutside';
import { Icon } from '../ui/Icon';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TopBar({ onToggleSidebar, onOpenMobileSidebar }: TopBarProps) {
  const { query, setQuery, clear } = useSearch();
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState(notifications);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));
  useClickOutside(searchRef, () => setQueryFocused(false));

  const [queryFocused, setQueryFocused] = useState(false);

  const unreadCount = notifs.filter((n) => n.unread).length;

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return { evidence: [], alerts: [] as typeof alerts, total: 0 };
    const ev = evidenceItems.filter((e) => `${e.title} ${e.metaValue} ${e.status}`.toLowerCase().includes(q));
    const al = alerts.filter((a) => `${a.title} ${a.source}`.toLowerCase().includes(q));
    return { evidence: ev, alerts: al, total: ev.length + al.length };
  }, [query]);

  const jumpTo = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clear();
    setQueryFocused(false);
  };

  const handleLogout = () => {
    signOut();
    push('Signed out of EFIF.', 'info');
    navigate('/login', { replace: true });
  };

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-night-850/60 px-3 backdrop-blur-xl sm:gap-4 sm:px-5">
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-950/60">
          <Icon name="leaf" className="h-5 w-5 text-white" />
        </span>
        <div className="hidden min-w-0 sm:block">
          <p className="font-display text-[15px] leading-none font-bold tracking-[0.08em] text-white">EFIF</p>
          <p className="mt-0.5 truncate text-[9.5px] leading-tight text-slate-400">
            Environmental Forensic
            <br />
            Intelligence Framework
          </p>
        </div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => {
          if (window.innerWidth < 1024) onOpenMobileSidebar();
          else onToggleSidebar();
        }}
        aria-label="Toggle navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative min-w-0 flex-1 max-w-[620px]">
        <div className="glass-input flex items-center gap-2.5 rounded-xl px-3.5 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setQueryFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                clear();
                setQueryFocused(false);
              }
            }}
            placeholder="Search incidents, locations, evidence..."
            className="w-full min-w-0 bg-transparent text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
          />
          {query && (
            <button onClick={clear} aria-label="Clear search" className="shrink-0 text-slate-500 hover:text-slate-200">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {queryFocused && query.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl"
            >
              <div className="max-h-[340px] overflow-y-auto p-1.5">
                {searchResults.total === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-slate-400">
                    No matches in dashboard data for “{query}”.
                  </p>
                )}

                {searchResults.evidence.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Evidence</p>
                    {searchResults.evidence.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => jumpTo('evidence-summary')}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
                      >
                        <Icon name={e.kind} className="h-4 w-4 shrink-0 text-emerald-300" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{e.title}</span>
                        <span className="chip !normal-case !text-[10px]">{e.status}</span>
                      </button>
                    ))}
                  </>
                )}

                {searchResults.alerts.length > 0 && (
                  <>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Alerts</p>
                    {searchResults.alerts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => jumpTo('recent-alerts')}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
                      >
                        <Icon name="alert" className={`h-4 w-4 shrink-0 ${a.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{a.title}</span>
                        <span className="chip !normal-case !text-[10px]">{a.severity}</span>
                      </button>
                    ))}
                  </>
                )}

                {searchResults.total > 0 && (
                  <p className="border-t border-white/5 px-3 pt-2 pb-1.5 text-[10.5px] text-slate-500">
                    {searchResults.total} result{searchResults.total === 1 ? '' : 's'} in current dashboard
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => {
              setBellOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-1 text-[9.5px] font-bold text-white shadow-md shadow-emerald-950/60"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="glass-strong absolute right-0 z-50 mt-2 w-[340px] max-w-[86vw] overflow-hidden rounded-xl"
              >
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[13px] font-semibold text-white">Notifications</p>
                  <button
                    onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })))}
                    className="text-[11px] font-medium text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                      className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.05]"
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          n.severity === 'high'
                            ? 'border-red-400/25 bg-red-400/10 text-red-300'
                            : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                        }`}
                      >
                        <Icon name="alert" className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] leading-snug text-slate-200">{n.title}</span>
                        <span className="mt-0.5 block text-[10.5px] text-slate-500">{n.time}</span>
                      </span>
                      {n.unread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate('/alerts');
                  }}
                  className="block w-full border-t border-white/8 px-4 py-2.5 text-center text-[12px] font-medium text-emerald-300 transition-colors hover:bg-white/[0.05]"
                >
                  View all alerts →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen((o) => !o);
              setBellOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl py-1 pr-1 pl-1 transition-colors hover:bg-white/[0.06] sm:pl-1.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500 to-teal-600 text-[11px] font-bold text-white shadow-md shadow-emerald-950/60 ring-1 ring-emerald-300/30">
              {initials(user?.name ?? 'EFIF')}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-[12.5px] leading-tight font-semibold text-white">{user?.name}</span>
              <span className="block text-[10.5px] leading-tight text-slate-400">{user?.role}</span>
            </span>
            <ChevronDown className={`hidden h-3.5 w-3.5 text-slate-500 transition-transform duration-200 md:block ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="glass-strong absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl"
              >
                <div className="border-b border-white/8 px-4 py-3">
                  <p className="text-[13px] font-semibold text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="chip !normal-case">{user?.role}</span>
                    <span className="chip !normal-case">{user?.organization}</span>
                  </div>
                </div>
                {[
                  {
                    label: 'Profile',
                    icon: CircleCheck,
                    action: () => {
                      setProfileOpen(false);
                      push('Profile management arrives with the full platform.', 'info');
                    },
                  },
                  {
                    label: 'Settings',
                    icon: Settings,
                    action: () => {
                      setProfileOpen(false);
                      navigate('/settings');
                    },
                  },
                  {
                    label: 'Logout',
                    icon: LogOut,
                    danger: true,
                    action: handleLogout,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[12.5px] font-medium transition-colors hover:bg-white/[0.06] ${
                      item.danger ? 'text-red-300 hover:text-red-200' : 'text-slate-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
