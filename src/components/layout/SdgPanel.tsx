import { Icon } from '../ui/Icon';

const SDG_GOALS = [
  { number: 6, name: 'Clean Water & Sanitation', icon: 'droplets' },
  { number: 13, name: 'Climate Action', icon: 'globe' },
  { number: 14, name: 'Life Below Water', icon: 'waves' },
  { number: 15, name: 'Life on Land', icon: 'trees' },
  { number: 16, name: 'Peace, Justice & Strong Institutions', icon: 'shield' },
  { number: 17, name: 'Partnerships for the Goals', icon: 'link' },
];

export function SdgPanel() {
  return (
    <div className="glass rounded-xl p-3">
      <div className="grid grid-cols-3 gap-1.5">
        {SDG_GOALS.map((goal) => (
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