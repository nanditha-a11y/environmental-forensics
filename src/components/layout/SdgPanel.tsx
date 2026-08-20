import { sdgGoals } from '../../data/mock';
import { Icon } from '../ui/Icon';

export function SdgPanel() {
  return (
    <div className="glass rounded-xl p-3">
      <div className="grid grid-cols-3 gap-1.5">
        {sdgGoals.map((goal) => (
          <div
            key={goal.number}
            title={`SDG ${goal.number} — ${goal.name}`}
            className="flex flex-col items-center gap-1 rounded-lg border border-white/8 bg-night-900/50 px-1 py-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-emerald-500/80 to-emerald-700/80 text-[11px] font-bold text-white shadow-md shadow-emerald-950/50">
              {goal.number}
            </span>
            <Icon name={goal.icon} className="h-3.5 w-3.5 text-emerald-300/80" />
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[10.5px] leading-snug text-slate-400">
        <span className="font-semibold text-slate-200">Building a sustainable future</span>
        <br />
        through environmental intelligence
      </p>
    </div>
  );
}
