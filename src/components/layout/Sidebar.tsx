import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icon';
import { SdgPanel } from './SdgPanel';

const NAV = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { path: '/incidents', label: 'Incidents', icon: 'incidents', end: false },
  { path: '/map', label: 'Map & GIS', icon: 'map', end: false },
  { path: '/evidence', label: 'Evidence Vault', icon: 'vault', end: false },
  { path: '/sources', label: 'Data Sources', icon: 'sources', end: false },
  { path: '/analytics', label: 'Analytics & AI', icon: 'analytics', end: false },
  { path: '/reports', label: 'Reports', icon: 'reports', end: false },
  { path: '/alerts', label: 'Alerts', icon: 'alerts', end: false },
  { path: '/users', label: 'Users & Roles', icon: 'users', end: false },
  { path: '/settings', label: 'Settings', icon: 'settings', end: false },
];

interface SidebarContentProps {
  collapsed: boolean;
  activeKey?: string;
  onNavigate?: () => void;
}

function NavItem({ item, collapsed, onNavigate }: { item: (typeof NAV)[number]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${
          isActive
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-dot"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-1.5 h-1.5 w-1.5 rounded-full bg-white/90"
            />
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg border border-white/10 bg-night-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const navigate = useNavigate();
  const { push } = useToast();

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            navigate('/incidents');
            push('Incident intake arrives with the Incidents module.', 'info');
            onNavigate?.();
          }}
          title={collapsed ? 'New Incident' : undefined}
          className={`group relative flex w-full items-center gap-3 rounded-xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 px-3 py-2.5 text-left transition-colors hover:from-emerald-500/25 hover:to-teal-500/20 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-950/50">
            <Plus className="h-4 w-4" />
          </span>
          {!collapsed && <span className="text-[13px] font-semibold text-emerald-200">New Incident</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-lg border border-white/10 bg-night-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              New Incident
            </span>
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 pb-2">
        {collapsed ? (
          <div className="flex justify-center rounded-xl border border-white/8 bg-night-900/50 py-3" title="SDG Impact">
            <Icon name="sprout" className="h-4.5 w-4.5 text-emerald-300/90" />
          </div>
        ) : (
          <SdgPanel />
        )}
      </div>

      {!collapsed && (
        <p className="pb-4 text-center text-[10.5px] tracking-wide text-slate-500">© 2026 EFIF Platform</p>
      )}
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  activeKey?: string;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="hidden shrink-0 border-r border-white/[0.06] bg-night-850/70 backdrop-blur-xl lg:flex"
    >
      <SidebarContent collapsed={collapsed} />
    </motion.aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-night-950/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: -290 }}
            animate={{ x: 0 }}
            exit={{ x: -290 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 w-[272px] border-r border-white/10 bg-night-850/95 backdrop-blur-xl"
          >
            <SidebarContent collapsed={false} onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
