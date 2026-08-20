import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Copy, Link2, Send, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Collaborator {
  name: string;
  email: string;
  role: string;
  pending?: boolean;
}

const initialCollaborators: Collaborator[] = [
  { name: 'Bhargav K.', email: 'demo@efif.com', role: 'Owner · Investigator' },
  { name: 'Priya Sharma', email: 'priya.sharma@agency.gov', role: 'Environmental Analyst' },
  { name: 'Dr. Anil Rao', email: 'a.rao@forensiclab.gov', role: 'Laboratory Analyst' },
];

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Investigator');
  const { push } = useToast();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://efif.prototype/case/EFIF-0017');
      push('Case link copied to clipboard.');
    } catch {
      push('Case link copied (clipboard unavailable in this context).', 'info');
    }
  };

  const invite = () => {
    if (!email.trim()) return;
    setCollaborators((c) => [...c, { name: email.split('@')[0], email: email.trim(), role, pending: true }]);
    setEmail('');
    push(`Invitation sent to ${email.trim()} (simulated).`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Share Case" subtitle="EFIF-0017 · invite collaborators to the investigation" icon="share">
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-slate-300">Case access link</p>
          <div className="flex items-center gap-2">
            <div className="glass-input flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3.5 py-2.5">
              <Link2 className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate font-mono text-[12px] text-slate-300">efif.prototype/case/EFIF-0017</span>
            </div>
            <Button variant="ghost" size="md" onClick={copyLink} aria-label="Copy case link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-slate-300">Invite a collaborator</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && invite()}
              placeholder="colleague@agency.gov"
              className="glass-input min-w-0 flex-1 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Invite role"
              className="glass-input hidden rounded-xl px-3 py-2.5 text-[12.5px] text-slate-100 outline-none sm:block [&>option]:bg-night-900"
            >
              <option>Investigator</option>
              <option>Environmental Analyst</option>
              <option>Laboratory Analyst</option>
            </select>
            <Button variant="emerald" onClick={invite} disabled={!email.trim()} aria-label="Send invitation">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">
            Collaborators · {collaborators.length}
          </p>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {collaborators.map((c) => (
                <motion.div
                  key={c.email}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-night-900/30 px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-emerald-500/70 to-teal-600/70 text-[10.5px] font-bold text-white">
                    {c.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-slate-100">{c.name}</span>
                    <span className="block truncate text-[10.5px] text-slate-500">{c.email}</span>
                  </span>
                  {c.pending ? (
                    <Badge tone="amber">Pending</Badge>
                  ) : (
                    <Badge tone="emerald">
                      <CheckCircle2 className="h-3 w-3" /> Access
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-night-900/40 px-3.5 py-3">
          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-[11.5px] leading-relaxed text-slate-400">
            Shared access is simulated in this prototype. Role-based permissions will arrive with the full
            Users &amp; Roles module.
          </p>
        </div>
      </div>
    </Modal>
  );
}
