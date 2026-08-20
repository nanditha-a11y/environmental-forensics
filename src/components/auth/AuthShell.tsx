import type { ReactNode } from 'react';
import { BackgroundFX } from '../layout/BackgroundFX';
import { Icon } from '../ui/Icon';

const CAPABILITIES = [
  { icon: 'satellite', label: 'Satellites' },
  { icon: 'drone', label: 'Drones' },
  { icon: 'radio', label: 'Sensors' },
  { icon: 'dna', label: 'eDNA Labs' },
  { icon: 'flask', label: 'Chemical Labs' },
  { icon: 'brain', label: 'AI Engine' },
];

export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <BackgroundFX />

      {/* Brand panel */}
      <div className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden border-r border-white/[0.06] p-10 lg:flex xl:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-cyan-500/[0.05]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-950/60">
              <Icon name="leaf" className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="font-display text-lg leading-none font-bold tracking-[0.1em] text-white">EFIF</p>
              <p className="mt-1 text-[10.5px] leading-tight text-slate-400">
                Environmental Forensic
                <br />
                Intelligence Framework
              </p>
            </div>
          </div>

          <div className="mt-14 max-w-md">
            <h1 className="font-display text-[30px] leading-[1.15] font-semibold text-white xl:text-[36px]">
              Turning environmental <span className="text-gradient-emerald">evidence</span> into intelligence.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-slate-400">
              EFIF unites satellites, drones, GIS, sensors, laboratories and AI — so investigators can turn scattered
              environmental evidence into one clear, defensible picture.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-2.5 xl:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.label} className="glass flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                <Icon name={c.icon} className="h-4 w-4 shrink-0 text-emerald-300" />
                <span className="truncate text-[12px] font-medium text-slate-300">{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="glass rounded-xl p-4">
            <p className="text-[11px] tracking-wide text-slate-400">
              <span className="font-semibold text-slate-200">Building a sustainable future</span> through environmental
              intelligence — aligned with SDG 13, 15 &amp; 16.
            </p>
          </div>
          <p className="mt-4 text-[10.5px] text-slate-600">© 2026 EFIF Platform · Interactive prototype</p>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5 p-5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-950/60">
            <Icon name="leaf" className="h-5 w-5 text-white" />
          </span>
          <p className="font-display text-[15px] font-bold tracking-[0.1em] text-white">
            EFIF <span className="text-slate-400">· Prototype</span>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {footer && <div className="px-6 pb-6 text-center text-[11px] text-slate-500 lg:hidden">{footer}</div>}
      </div>
    </div>
  );
}
