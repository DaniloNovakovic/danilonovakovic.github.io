import './playerDoodle.css';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';

/**
 * The game's player doodle (idle pose, glasses on) as SVG, so the static page
 * can show it without loading Phaser. Mirrors `drawPlayer` in
 * `src/game/sharedSceneRuntime/textures/TextureGenerator.ts`; keep the two in step.
 * The waving arm is static-page only; the game sprite has no arms.
 */
export function PlayerDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 65" overflow="visible" className={className} aria-hidden>
      <ellipse cx={24} cy={60} rx={10} ry={3} fill="#000" fillOpacity={0.1} />
      <g fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <line x1={18} y1={45} x2={18} y2={60} />
        <line x1={30} y1={45} x2={30} y2={60} />
        <rect x={8} y={28} width={8} height={16} />
        <rect x={14} y={24} width={20} height={22} />
        <circle cx={24} cy={16} r={12} />
      </g>
      <g className="player-doodle-arm" stroke={INK} strokeWidth={3} strokeLinecap="round">
        <line x1={34} y1={29} x2={42} y2={19} />
        <circle cx={43} cy={17} r={2.5} fill={PAPER} strokeWidth={2} />
      </g>
      <g fill={INK}>
        <circle cx={26} cy={14} r={2} />
        <circle cx={32} cy={14} r={2} />
      </g>
      <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
        <circle cx={26} cy={14} r={4} />
        <circle cx={32} cy={14} r={4} />
        <line x1={28} y1={14} x2={30} y2={14} />
        <line x1={22} y1={13} x2={18} y2={12} />
      </g>
    </svg>
  );
}
