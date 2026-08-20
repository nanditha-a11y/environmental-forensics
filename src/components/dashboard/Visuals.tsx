/**
 * Self-contained SVG illustrations used across the dashboard so the prototype
 * never depends on external images (no broken assets, works fully offline).
 */

interface VisualProps {
  className?: string;
}

/* Featured incident hero — muddy river through forested land */
export function RiverScene({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 420 260" className={className} role="img" aria-label="Aerial view of the river corridor">
      <defs>
        <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2334" />
          <stop offset="1" stopColor="#123447" />
        </linearGradient>
        <linearGradient id="rs-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e5b70" />
          <stop offset="0.55" stopColor="#174a5e" />
          <stop offset="1" stopColor="#3d4a3a" />
        </linearGradient>
        <linearGradient id="rs-plume" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4d3a28" stopOpacity="0.85" />
          <stop offset="1" stopColor="#174a5e" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rs-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e9c46a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e9c46a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="420" height="260" fill="url(#rs-sky)" />
      <circle cx="330" cy="52" r="70" fill="url(#rs-sun)" />

      {/* distant hills */}
      <path d="M0 120 Q 80 92 160 118 T 320 110 T 420 120 L 420 150 L 0 150 Z" fill="#0e2b33" />
      <path d="M0 140 Q 100 116 210 140 T 420 132 L 420 170 L 0 170 Z" fill="#0f2f38" />

      {/* river winding to the foreground */}
      <path
        d="M 210 0 C 236 40, 190 70, 214 110 C 236 146, 198 180, 222 226 C 234 250, 226 258, 224 262 L 0 262 L 0 0 Z"
        fill="url(#rs-river)"
        opacity="0.92"
      />
      {/* pollution plume entering the river */}
      <path d="M 84 150 C 110 160, 128 178, 126 202 C 124 226, 108 240, 92 248 L 84 246 C 96 230, 104 210, 100 188 C 96 170, 84 162, 80 156 Z" fill="url(#rs-plume)" opacity="0.8" />
      {/* outflow pipe */}
      <rect x="56" y="148" width="30" height="9" rx="2" fill="#3a4a52" />
      <rect x="60" y="150" width="6" height="5" rx="1.5" fill="#122028" />

      {/* forested banks */}
      <g fill="#0d3326">
        <circle cx="40" cy="118" r="30" />
        <circle cx="84" cy="96" r="36" />
        <circle cx="130" cy="112" r="28" />
        <circle cx="300" cy="108" r="34" />
        <circle cx="352" cy="132" r="40" />
        <circle cx="396" cy="116" r="26" />
        <circle cx="30" cy="180" r="26" />
        <circle cx="380" cy="200" r="32" />
        <circle cx="340" cy="238" r="30" />
      </g>
      <g fill="#11422f">
        <circle cx="60" cy="122" r="20" />
        <circle cx="108" cy="102" r="24" />
        <circle cx="320" cy="112" r="22" />
        <circle cx="368" cy="142" r="26" />
        <circle cx="46" cy="196" r="18" />
        <circle cx="356" cy="224" r="20" />
      </g>

      {/* surface glints */}
      <path d="M 212 60 C 218 78, 208 92, 214 106" stroke="#7fd4e6" strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 208 140 C 214 158, 204 172, 210 186" stroke="#7fd4e6" strokeOpacity="0.28" strokeWidth="2" fill="none" strokeLinecap="round" />

    </svg>
  );
}

/* Small evidence thumbnails */
export function DroneVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="Drone imagery thumbnail">
      <rect width="320" height="150" fill="#0c2334" />
      <circle cx="262" cy="38" r="34" fill="#e9c46a" opacity="0.14" />
      <g fill="#0d3326">
        <circle cx="36" cy="96" r="22" />
        <circle cx="74" cy="84" r="26" />
        <circle cx="118" cy="98" r="20" />
        <circle cx="150" cy="80" r="24" />
        <circle cx="196" cy="96" r="22" />
        <circle cx="236" cy="82" r="26" />
        <circle cx="282" cy="96" r="20" />
      </g>
      <g fill="#11422f">
        <circle cx="52" cy="98" r="14" />
        <circle cx="92" cy="88" r="16" />
        <circle cx="168" cy="84" r="15" />
        <circle cx="212" cy="98" r="14" />
        <circle cx="256" cy="86" r="16" />
      </g>
      {/* drone */}
      <g transform="translate(150 44)">
        <rect x="-30" y="-3" width="60" height="6" rx="3" fill="#233a4a" />
        <rect x="-3" y="-24" width="6" height="48" rx="3" fill="#233a4a" />
        <g fill="#34d399" opacity="0.9">
          <circle cx="-30" cy="-3" r="3.5" />
          <circle cx="30" cy="-3" r="3.5" />
          <circle cx="-3" cy="-24" r="3.5" />
          <circle cx="-3" cy="24" r="3.5" />
        </g>
        <rect x="-11" y="-7" width="22" height="14" rx="4" fill="#0f2f45" stroke="#4fd1a5" strokeWidth="1" />
        <circle cx="-6" cy="0" r="2" fill="#4fd1a5" />
        <circle cx="6" cy="0" r="2" fill="#4fd1a5" />
      </g>
      {/* scan line */}
      <line x1="0" y1="128" x2="320" y2="128" stroke="#34d399" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4 6" />
    </svg>
  );
}

export function WaterVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="Water sample thumbnail">
      <rect width="320" height="150" fill="#0c2135" />
      <circle cx="52" cy="36" r="26" fill="#38bdf8" opacity="0.12" />
      {/* ripples */}
      <g stroke="#38bdf8" strokeOpacity="0.3" fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path d="M 40 118 q 14 -8 28 0 t 28 0" />
        <path d="M 96 124 q 12 -7 24 0 t 24 0" />
        <path d="M 200 116 q 14 -8 28 0 t 28 0" />
        <path d="M 262 126 q 12 -7 24 0 t 24 0" />
      </g>
      {/* bottle */}
      <g transform="translate(150 34)">
        <rect x="-7" y="-18" width="14" height="18" rx="4" fill="#7fd4e6" opacity="0.35" />
        <rect x="-14" y="0" width="28" height="7" rx="2" fill="#7fd4e6" opacity="0.3" />
        <path d="M -14 7 L -9 84 Q -8 92 0 92 Q 8 92 9 84 L 14 7 Z" fill="#38bdf8" opacity="0.5" />
        <path d="M -11 7 L -7 84 Q -6 90 0 90 Q 6 90 7 84 L 11 7 Z" fill="#0ea5e9" opacity="0.55" />
        {/* cork */}
        <rect x="-6" y="-24" width="12" height="7" rx="2" fill="#4d3a28" />
        <circle cx="-4" cy="26" r="2.5" fill="#bae6fd" opacity="0.6" />
        <circle cx="5" cy="46" r="2" fill="#bae6fd" opacity="0.5" />
        <circle cx="-2" cy="64" r="2.5" fill="#bae6fd" opacity="0.6" />
      </g>
    </svg>
  );
}

export function DnaVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="eDNA analysis thumbnail">
      <rect width="320" height="150" fill="#0c2135" />
      <circle cx="272" cy="34" r="30" fill="#22d3ee" opacity="0.1" />
      <g transform="translate(120 16)">
        <path d="M 40 0 C 0 25, 80 35, 40 60 S 0 95, 40 118" stroke="#34d399" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M 40 0 C 80 25, 0 35, 40 60 S 80 95, 40 118" stroke="#22d3ee" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
        {[12, 30, 48, 66, 84, 102].map((y) => (
          <line key={y} x1="40" y1={y} x2={y % 3 === 0 ? 40 : y % 3 === 1 ? 34 : 46} y2={y + 12} stroke="#5eead4" strokeWidth="2" strokeOpacity="0.55" />
        ))}
        <circle cx="40" cy="118" r="4" fill="#34d399" />
      </g>
      {/* nucleotide dots */}
      <g fill="#5eead4">
        <circle cx="36" cy="30" r="2.5" />
        <circle cx="44" cy="52" r="2.5" />
        <circle cx="34" cy="72" r="2.5" />
        <circle cx="47" cy="92" r="2.5" />
      </g>
    </svg>
  );
}

export function LabVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="Chemical analysis thumbnail">
      <rect width="320" height="150" fill="#0c2135" />
      {/* subtle chart grid */}
      <g stroke="#ffffff" strokeOpacity="0.05">
        <line x1="220" y1="30" x2="220" y2="120" />
        <line x1="268" y1="30" x2="268" y2="120" />
        <line x1="316" y1="30" x2="316" y2="120" />
      </g>
      <g stroke="#f87171" strokeOpacity="0.4" fill="none" strokeWidth="1.5">
        <path d="M 220 100 L 236 92 L 252 84 L 268 88 L 284 70 L 300 62" />
      </g>
      {/* flask */}
      <g transform="translate(118 28)">
        <path d="M -10 -10 L -10 6 L -26 34 Q -30 44 -20 44 L 20 44 Q 30 44 26 34 L 10 6 L 10 -10 Z" fill="#22d3ee" opacity="0.25" stroke="#67e8f9" strokeWidth="2" />
        <path d="M -10 -10 L -10 6 L -26 34 Q -30 44 -20 44 L 20 44 Q 30 44 26 34 L 10 6 L 10 -10 Z" fill="#f87171" opacity="0.35" />
        <path d="M -14 26 L 14 26 L 18 36 Q 19 40 10 40 L -10 40 Q -19 40 -18 36 Z" fill="#fca5a5" opacity="0.7" />
        <circle cx="0" cy="18" r="2.5" fill="#fecaca" opacity="0.8" />
        <circle cx="5" cy="26" r="1.8" fill="#fecaca" opacity="0.7" />
        <circle cx="-6" cy="14" r="1.8" fill="#fecaca" opacity="0.6" />
      </g>
    </svg>
  );
}

export function GisVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="GIS layers thumbnail">
      <rect width="320" height="150" fill="#0c2135" />
      <g transform="translate(96 26)">
        <rect x="0" y="34" width="128" height="56" rx="8" fill="#0e2a3a" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="1.5" />
        <rect x="-8" y="22" width="128" height="56" rx="8" fill="#0d2540" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1.5" />
        <rect x="8" y="10" width="128" height="56" rx="8" fill="#0f2444" stroke="#34d399" strokeOpacity="0.5" strokeWidth="1.5" />
        {/* map grid on top layer */}
        <g stroke="#34d399" strokeOpacity="0.3" strokeWidth="0.75">
          <path d="M 24 10 L 24 66 M 52 10 L 52 66 M 92 10 L 92 66 M 108 10 L 108 66" />
          <path d="M 8 24 L 136 24 M 8 40 L 136 40 M 8 58 L 136 58" />
        </g>
        <path d="M 12 62 C 34 40, 60 52, 84 34 S 116 28, 132 18" stroke="#22d3ee" strokeWidth="2" fill="none" opacity="0.8" />
        <circle cx="84" cy="34" r="4" fill="#34d399" />
      </g>
    </svg>
  );
}

export function HistoryVisual({ className = '' }: VisualProps) {
  return (
    <svg viewBox="0 0 320 150" className={className} role="img" aria-label="Historical data thumbnail">
      <rect width="320" height="150" fill="#0c2135" />
      <g transform="translate(40 24)">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" y1={i * 24} x2="240" y2={i * 24} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
        ))}
        <path d="M 0 92 L 20 86 L 40 72 L 60 78 L 80 58 L 100 66 L 120 44 L 140 52 L 160 34 L 180 40 L 200 22 L 220 30 L 240 12" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 0 92 L 20 86 L 40 72 L 60 78 L 80 58 L 100 66 L 120 44 L 140 52 L 160 34 L 180 40 L 200 22 L 220 30 L 240 12 L 240 96 L 0 96 Z" fill="url(#hvg)" opacity="0.35" />
        <defs>
          <linearGradient id="hvg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240].map((x, i) => (
          <circle key={x} cx={x} cy={[92, 86, 72, 78, 58, 66, 44, 52, 34, 40, 22, 30, 12][i]} r="2.5" fill="#34d399" />
        ))}
      </g>
    </svg>
  );
}

export function Visual({ kind, className = '' }: { kind: string; className?: string }) {
  switch (kind) {
    case 'drone':
      return <DroneVisual className={className} />;
    case 'water':
      return <WaterVisual className={className} />;
    case 'dna':
      return <DnaVisual className={className} />;
    case 'lab':
      return <LabVisual className={className} />;
    case 'gis':
      return <GisVisual className={className} />;
    case 'history':
      return <HistoryVisual className={className} />;
    default:
      return <RiverScene className={className} />;
  }
}
