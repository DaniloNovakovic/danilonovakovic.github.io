import { useId } from 'react';
import type { StrikeGrade } from './strikeCombo';
import '../shared/hobbyMotion.css';

const INK = '#1a1a1a';

const SWING_CLASS: Record<StrikeGrade, string> = {
  perfect: 'hobby-bag-swing-big',
  clean: 'hobby-bag-swing',
  miss: ''
};

interface HeavyBagProps {
  /** Decorative lettering printed on the bag. */
  print: string;
  /** Changes on every strike so the swing animation replays. */
  hitId: number;
  grade: StrikeGrade | null;
}

/** Hanging heavy bag; swings harder for perfect hits. The overlay owns the tap target. */
export function HeavyBag({ print, hitId, grade }: HeavyBagProps) {
  const hatchId = useId();

  return (
    <div className="relative h-[190px] w-[150px] select-none" aria-hidden="true">
      <svg viewBox="0 0 160 200" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={INK} strokeWidth="1.3" opacity="0.5" />
          </pattern>
        </defs>
        <path d="M66 4 L94 4" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <g key={hitId} className={grade ? SWING_CLASS[grade] : ''}>
          <path d="M80 6 L80 26" stroke={INK} strokeWidth="2.5" strokeDasharray="4 3" />
          <path d="M80 26 L58 44 M80 26 L102 44" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <rect x="50" y="42" width="60" height="146" rx="18" fill="#f4f1ea" stroke={INK} strokeWidth="4.5" />
          <path d="M90 48 Q106 50 106 70 L106 160 Q106 182 90 184 Z" fill={`url(#${hatchId})`} />
          <path d="M52 66 Q80 72 108 66 M52 164 Q80 170 108 164" fill="none" stroke={INK} strokeWidth="2.5" />
          <path d="M60 96 Q66 120 60 140" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.4" />
          <text x="80" y="122" textAnchor="middle" fontSize="13" fontWeight="900" fill={INK} opacity="0.75" transform="rotate(-90 80 118)">
            {print}
          </text>
        </g>
      </svg>
    </div>
  );
}
