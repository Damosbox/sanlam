import type { VfNiveau } from "@/lib/scoring/vfV2";

interface MedalIconProps {
  niveau: VfNiveau;
  size?: number;
  className?: string;
}

/**
 * Distinctive SVG medals — metallic gradients + ribbons per tier.
 * Pure SVG, no external assets, scales cleanly at any size.
 */
export const MedalIcon = ({ niveau, size = 18, className }: MedalIconProps) => {
  const id = `medal-${niveau}`;
  const gradients: Record<VfNiveau, { from: string; mid: string; to: string; rim: string }> = {
    bronze:  { from: "#f3c08a", mid: "#cd7f32", to: "#7a3e10", rim: "#5a2c0a" },
    argent:  { from: "#ffffff", mid: "#d4d4d8", to: "#71717a", rim: "#3f3f46" },
    or:      { from: "#fef9c3", mid: "#facc15", to: "#a16207", rim: "#713f12" },
    platine: { from: "#ecfeff", mid: "#67e8f9", to: "#0e7490", rim: "#155e75" },
  };
  const ribbons: Record<VfNiveau, { left: string; right: string }> = {
    bronze:  { left: "#b91c1c", right: "#7f1d1d" },
    argent:  { left: "#1e3a8a", right: "#0c1e4f" },
    or:      { left: "#1d4ed8", right: "#1e3a8a" },
    platine: { left: "#7c3aed", right: "#4c1d95" },
  };
  const g = gradients[niveau];
  const r = ribbons[niveau];

  return (
    <svg
      viewBox="0 0 24 28"
      width={size}
      height={size * (28 / 24)}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-metal`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={g.from} />
          <stop offset="55%" stopColor={g.mid} />
          <stop offset="100%" stopColor={g.to} />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ribbons */}
      <path d={`M5 1 L9.5 1 L11 13 L7 13 Z`} fill={r.left} />
      <path d={`M19 1 L14.5 1 L13 13 L17 13 Z`} fill={r.right} />
      <path d={`M9.5 1 L14.5 1 L13 13 L11 13 Z`} fill={r.left} opacity="0.55" />

      {/* Medal disc */}
      <circle cx="12" cy="18" r="8.5" fill={g.rim} />
      <circle cx="12" cy="18" r="7.3" fill={`url(#${id}-metal)`} />
      {/* Shine */}
      <ellipse cx="9.5" cy="14.8" rx="3.5" ry="2" fill={`url(#${id}-shine)`} />

      {/* Emblem per tier */}
      {niveau === "bronze" && (
        <path
          d="M12 14.2 l1.3 2.7 3 .4 -2.2 2.1 .5 3 -2.6-1.4 -2.6 1.4 .5-3 -2.2-2.1 3-.4 z"
          fill={g.rim}
          opacity="0.85"
        />
      )}
      {niveau === "argent" && (
        <g fill="none" stroke={g.rim} strokeWidth="1.1" strokeLinecap="round">
          <path d="M8 19 Q9 16.5 12 16" />
          <path d="M16 19 Q15 16.5 12 16" />
          <path d="M9 20.5 Q9.7 19 11.2 18.7" />
          <path d="M15 20.5 Q14.3 19 12.8 18.7" />
        </g>
      )}
      {niveau === "or" && (
        <g fill="none" stroke={g.rim} strokeWidth="1.2" strokeLinecap="round">
          <path d="M7 18 Q8.5 14 12 13.5" />
          <path d="M17 18 Q15.5 14 12 13.5" />
          <path d="M8 20 Q9 17.5 11 17" />
          <path d="M16 20 Q15 17.5 13 17" />
          <path d="M9.5 21.5 Q10.2 19.8 12 19.5" />
          <path d="M14.5 21.5 Q13.8 19.8 12 19.5" />
          <circle cx="12" cy="18.5" r="1.3" fill={g.rim} stroke="none" />
        </g>
      )}
      {niveau === "platine" && (
        <path
          d="M12 14 L14.4 17.4 L12 22 L9.6 17.4 Z"
          fill={g.rim}
          opacity="0.85"
        />
      )}
    </svg>
  );
};

export default MedalIcon;