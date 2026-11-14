import type { ReactNode } from 'react';
import type { RidgeEmotion } from '@/game/core/ridge';
import { cn } from '@/shared/ui/utils';
import type { RidgePortraitId } from '../content/castRegistry';
import type { RidgeSpeakerSide } from '../art/conversationStaging';

type BodiedPortraitId = Exclude<RidgePortraitId, 'prompt'>;

/** Portrait art per cast face; narration (`prompt`) has no body to draw. */
const PORTRAITS: Record<BodiedPortraitId, (emotion: RidgeEmotion) => ReactNode> = {
  cicka: (emotion) => <CickaPortrait emotion={emotion} />,
  draftsperson: (emotion) => <DraftspersonPortrait emotion={emotion} />,
  guitarist: (emotion) => <GuitaristPortrait emotion={emotion} />,
  driver: () => <DriverPortrait />,
  traveler: () => <TravelerPortrait />,
  teacher: () => <TeacherPortrait />,
  player: (emotion) => <PlayerPortrait emotion={emotion} />
};

/** Speaker bust that breaks out of the box on the speaker's side. */
export function ConversationBust({
  portrait,
  emotion = 'neutral',
  speaker,
  side
}: {
  portrait: RidgePortraitId;
  emotion?: RidgeEmotion;
  speaker: string;
  side: RidgeSpeakerSide;
}) {
  if (portrait === 'prompt') return null;
  const isRight = side === 'right';
  return (
    <div
      aria-hidden
      title={`${speaker} (${emotion})`}
      className={cn(
        'absolute bottom-2 z-10 h-[6.5rem] w-[5.5rem] animate-ridge-bust-pop overflow-hidden rounded-md border-[3px] border-[#1a1a1a] bg-[#f4f1ea] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] motion-reduce:animate-none sm:h-[9rem] sm:w-[7.75rem] sm:border-4 short:h-[6.5rem] short:w-[5.5rem] short:border-[3px]',
        isRight ? 'right-2 rotate-2 sm:right-3' : 'left-2 -rotate-2 sm:left-3'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:repeating-linear-gradient(-18deg,transparent,transparent_3px,#1a1a1a_3px,#1a1a1a_4px)]" />
      {/* Portraits are drawn facing right; mirror them on the right so they face in. */}
      <svg
        viewBox="4 4 72 72"
        preserveAspectRatio="xMidYMax slice"
        className={cn('relative h-full w-full', isRight && '-scale-x-100')}
      >
        {PORTRAITS[portrait](emotion)}
      </svg>
    </div>
  );
}

function CickaPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <ellipse cx="34" cy="52" rx="18" ry="12" fill="#fbfbf9" />
      <circle cx="50" cy="40" r="11" fill="#fbfbf9" />
      <path d="M42 30 L38 16 L48 28" />
      <path d="M54 30 L58 14 L50 28" />
      {emotion === 'sleepy' ? (
        <>
          <path d="M46 40 Q49 43 52 40" />
          <path d="M54 40 Q57 43 60 40" />
        </>
      ) : emotion === 'curious' ? (
        <>
          <circle cx="48" cy="38" r="2.5" fill="#1a1a1a" />
          <circle cx="56" cy="38" r="2.5" fill="#1a1a1a" />
        </>
      ) : (
        <>
          <circle cx="48" cy="39" r="2" fill="#1a1a1a" />
          <circle cx="56" cy="39" r="2" fill="#1a1a1a" />
        </>
      )}
      <line x1="58" y1="42" x2="68" y2="40" strokeWidth="2" />
      <line x1="58" y1="44" x2="67" y2="46" strokeWidth="2" />
      <path d="M18 50 Q8 34 14 28" />
    </g>
  );
}

function DraftspersonPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="3.5" strokeWidth="2" fill="#fbfbf9" />
      <circle cx="44" cy="24" r="3.5" strokeWidth="2" fill="#fbfbf9" />
      <line x1="39.5" y1="24" x2="40.5" y2="24" strokeWidth="2" />
      {emotion === 'surprised' ? (
        <circle cx="40" cy="30" r="2" fill="#1a1a1a" />
      ) : emotion === 'thoughtful' ? (
        <line x1="36" y1="29" x2="44" y2="29" strokeWidth="2" />
      ) : (
        <path d="M36 29 Q40 32 44 29" strokeWidth="2" />
      )}
      <path d="M40 34 V58" />
      <path d="M40 40 L22 50" />
      <path d="M40 40 L62 44" />
      <rect x="48" y="38" width="18" height="12" fill="#fbfbf9" />
      <path d="M28 58 L40 58 L52 58" />
    </g>
  );
}

function GuitaristPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M30 20 Q40 12 50 20" fill="#1a1a1a" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      {emotion === 'playful' ? (
        <path d="M36 28 Q40 33 44 28" strokeWidth="2" />
      ) : (
        <line x1="36" y1="29" x2="44" y2="29" strokeWidth="2" />
      )}
      <path d="M40 34 V56" />
      <ellipse cx="48" cy="46" rx="10" ry="14" fill="#fbfbf9" />
      <line x1="48" y1="32" x2="48" y2="60" />
    </g>
  );
}

function DriverPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M28 19 H52" strokeWidth="4" />
      <rect x="32" y="14" width="16" height="6" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M37 29 H43" strokeWidth="2" />
      <path d="M40 34 V58" />
      <rect x="46" y="36" width="16" height="20" fill="#fbfbf9" />
      <line x1="48" y1="42" x2="58" y2="42" strokeWidth="2" />
      <line x1="48" y1="47" x2="56" y2="47" strokeWidth="2" />
    </g>
  );
}

function TravelerPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M32 17 Q40 12 48 17" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M36 28 Q40 32 44 28" strokeWidth="2" />
      <path d="M40 34 V58" />
      <path d="M40 40 L58 48" />
      <line x1="58" y1="36" x2="58" y2="68" strokeWidth="2.5" />
    </g>
  );
}

function TeacherPortrait() {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <circle cx="40" cy="12" r="4" fill="#fbfbf9" />
      <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
      <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
      <path d="M35 28 Q40 33 45 28" strokeWidth="2" />
      <path d="M40 34 V56" />
      <path d="M40 40 L22 28" />
      <path d="M40 40 L58 28" />
    </g>
  );
}

function PlayerPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="22" r="10" fill="#fbfbf9" />
      <path d="M32 16 L28 10" />
      <path d="M40 13 L42 7" />
      <path d="M48 16 L52 11" />
      {emotion === 'determined' ? (
        <>
          <line x1="33" y1="21" x2="38" y2="23" strokeWidth="2" />
          <line x1="47" y1="21" x2="42" y2="23" strokeWidth="2" />
          <circle cx="35" cy="24" r="1.5" fill="#1a1a1a" />
          <circle cx="45" cy="24" r="1.5" fill="#1a1a1a" />
        </>
      ) : (
        <>
          <circle cx="35" cy="22" r="1.5" fill="#1a1a1a" />
          <circle cx="45" cy="22" r="1.5" fill="#1a1a1a" />
          <path d="M36 27 Q40 31 44 27" strokeWidth="2" />
        </>
      )}
      <rect x="30" y="30" width="20" height="7" fill="#1a1a1a" rx="2" />
      <path d="M40 37 V58" />
      <path d="M40 42 L24 52" />
      <path d="M40 42 L58 50" />
    </g>
  );
}

/** Small framed face for compact Scene UI (e.g. the Blueprint Bridge tip card). */
export function PortraitChip({
  portrait,
  emotion = 'neutral',
  className
}: {
  portrait: BodiedPortraitId;
  emotion?: RidgeEmotion;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative shrink-0 overflow-hidden rounded border-[3px] border-[#1a1a1a] bg-[#f4f1ea] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]',
        className
      )}
    >
      <svg viewBox="4 4 72 72" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        {PORTRAITS[portrait](emotion)}
      </svg>
    </div>
  );
}
