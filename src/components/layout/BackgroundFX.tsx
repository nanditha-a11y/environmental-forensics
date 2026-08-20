export function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night-800">
      {/* Base vertical gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #0e2133 0%, #0d1b2a 42%, #0a1420 78%, #060d17 100%)',
        }}
      />

      {/* Green atmospheric glows */}
      <div className="animate-float-slow absolute -top-32 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-500/[0.07] blur-[110px]" />
      <div className="animate-float-slower absolute top-1/3 -right-48 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
      <div className="absolute -bottom-56 left-1/3 h-[460px] w-[640px] rounded-full bg-teal-600/[0.05] blur-[130px]" />

      {/* Fine geographic grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(140, 200, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(140, 200, 255, 0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(90% 80% at 50% 30%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(90% 80% at 50% 30%, black 30%, transparent 100%)',
        }}
      />

      {/* Topographic contour lines */}
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="rgba(52, 211, 153, 0.05)" strokeWidth="1">
          <path d="M-80 640 C 160 600, 340 660, 560 620 S 980 560, 1520 610" />
          <path d="M-80 665 C 160 625, 340 685, 560 645 S 980 585, 1520 635" />
          <path d="M-80 690 C 160 650, 340 710, 560 670 S 980 610, 1520 660" />
          <path d="M-80 715 C 160 675, 340 735, 560 695 S 980 635, 1520 685" />
          <path d="M-80 740 C 160 700, 340 760, 560 720 S 980 660, 1520 710" />
          <path d="M120 -80 C 90 120, 150 260, 120 420 S 150 720, 100 980" />
          <path d="M150 -80 C 120 120, 180 260, 150 420 S 180 720, 130 980" />
          <path d="M180 -80 C 150 120, 210 260, 180 420 S 210 720, 160 980" />
          <path d="M1180 -80 C 1150 160, 1220 320, 1180 520 S 1220 760, 1170 980" />
          <path d="M1215 -80 C 1185 160, 1255 320, 1215 520 S 1255 760, 1205 980" />
          <path d="M1250 -80 C 1220 160, 1290 320, 1250 520 S 1290 760, 1240 980" />
          <path d="M-80 240 C 300 200, 700 280, 1520 220" />
          <path d="M-80 300 C 300 260, 700 340, 1520 280" opacity="0.6" />
        </g>
        {/* Faint river-like contour accent */}
        <path
          d="M-80 470 C 240 430, 480 500, 720 460 S 1220 410, 1520 470"
          stroke="rgba(34, 211, 238, 0.04)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Top vignette for depth */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(4,10,17,0.55) 0%, transparent 22%, transparent 78%, rgba(4,10,17,0.6) 100%)' }}
      />
    </div>
  );
}
