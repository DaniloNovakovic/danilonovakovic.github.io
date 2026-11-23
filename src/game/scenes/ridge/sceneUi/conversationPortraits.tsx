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
  kid: (emotion) => <KidPortrait emotion={emotion} />,
  crowd: (emotion) => <CrowdPortrait emotion={emotion} />,
  driver: (emotion) => <DriverPortrait emotion={emotion} />,
  traveler: (emotion) => <TravelerPortrait emotion={emotion} />,
  teacher: (emotion) => <TeacherPortrait emotion={emotion} />,
  operations: (emotion) => <OperationsPortrait emotion={emotion} />,
  steward: (emotion) => <StewardPortrait emotion={emotion} />,
  quietCat: (emotion) => <CickaPortrait emotion={emotion} coat="dark" />,
  chick: (emotion) => <ChickPortrait emotion={emotion} />,
  streetPlayer: (emotion) => <StreetPlayerPortrait emotion={emotion} />,
  streetPlayerGlasses: (emotion) => <StreetPlayerPortrait emotion={emotion} glasses />,
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

function CickaPortrait({ emotion, coat = 'pale' }: { emotion: RidgeEmotion; coat?: 'pale' | 'dark' }) {
  const fur = coat === 'dark' ? '#1a1a1a' : '#fbfbf9';
  // Paper eyes on a dark coat, so the face still reads.
  const eye = coat === 'dark' ? '#fbfbf9' : '#1a1a1a';
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <ellipse cx="34" cy="52" rx="18" ry="12" fill={fur} />
      <circle cx="50" cy="40" r="11" fill={fur} />
      <path d="M42 30 L38 16 L48 28" />
      <path d="M54 30 L58 14 L50 28" />
      {emotion === 'sleepy' ? (
        <>
          <path d="M46 40 Q49 43 52 40" stroke={eye} />
          <path d="M54 40 Q57 43 60 40" stroke={eye} />
        </>
      ) : emotion === 'curious' ? (
        <>
          <circle cx="48" cy="38" r="2.5" fill={eye} />
          <circle cx="56" cy="38" r="2.5" fill={eye} />
        </>
      ) : (
        <>
          <circle cx="48" cy="39" r="2" fill={eye} />
          <circle cx="56" cy="39" r="2" fill={eye} />
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
      {/* Hard hat + pencil: the same silhouette as the stage figure. */}
      <path d="M29 18 A11 11 0 0 1 51 18 Z" fill="#f4f1ea" />
      <line x1="40" y1="7" x2="40" y2="17" strokeWidth="2" />
      <line x1="26" y1="18" x2="56" y2="18" />
      <line x1="27" y1="21" x2="33" y2="27" strokeWidth="2.5" />
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

/** Steve: rocker hair past the collar, moustache, leather jacket, wrist in a sling. */
function GuitaristPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 30 L22 52 L32 48 Z" fill="#1a1a1a" />
      <circle cx="40" cy="26" r="11" fill="#fbfbf9" />
      <path d="M29 24 Q30 12 42 13 Q52 14 51 22 Q44 18 36 22 Q32 26 30 34 Z" fill="#1a1a1a" />
      {emotion === 'surprised' ? (
        <>
          <circle cx="44" cy="25" r="2.6" fill="#fbfbf9" strokeWidth="1.6" />
          <circle cx="44" cy="25" r="1.1" fill="#1a1a1a" stroke="none" />
          <circle cx="45" cy="34" r="2" strokeWidth="2" />
        </>
      ) : emotion === 'playful' ? (
        <>
          <path d="M41 25 L44 22 L47 25" strokeWidth="2" />
          <path d="M40 34 Q44 38 48 34" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="41" y1="22" x2="47" y2="23.5" strokeWidth="2" />
          <circle cx="44" cy="26" r="1.5" fill="#1a1a1a" />
        </>
      )}
      <path d="M38 31 L50 29 L50 32 L39 33 Z" fill="#1a1a1a" strokeWidth="1.5" />
      <path d="M28 40 L52 40 L50 70 L30 70 Z" fill="#1a1a1a" />
      <path d="M41 41 L44 50" stroke="#fbfbf9" strokeWidth="1.6" />
      <path d="M38 41 L35 49" stroke="#fbfbf9" strokeWidth="1.6" />
      <path d="M52 48 L34 54 L46 62 Z" fill="#fbfbf9" />
      <path d="M36 54 L34 40" strokeWidth="2" />
    </g>
  );
}

/** The skater kid: cap on backwards, a scowl that is mostly bluff. */
function KidPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="34" r="10" fill="#fbfbf9" />
      <path d="M30 32 A10 10 0 0 1 50 32 Z" fill="#1a1a1a" />
      <line x1="31" y1="31" x2="20" y2="33" strokeWidth="3.5" />
      {emotion === 'playful' ? (
        <>
          <path d="M42 36 L44.5 34 L47 36" strokeWidth="2" />
          <path d="M41 41 Q44 44 47 41" strokeWidth="2" />
        </>
      ) : emotion === 'surprised' ? (
        <>
          <circle cx="44.5" cy="36" r="2" fill="#1a1a1a" />
          <circle cx="45" cy="42" r="1.8" strokeWidth="1.8" />
        </>
      ) : (
        <>
          <line x1="41" y1="33.5" x2="47" y2="35" strokeWidth="2" />
          <circle cx="44.5" cy="37" r="1.4" fill="#1a1a1a" />
          <path d="M41 42 L47 41" strokeWidth="2" />
        </>
      )}
      <path d="M40 44 V64" />
      <path d="M40 50 L28 58" />
      <path d="M40 50 L54 56" />
      <rect x="50" y="44" width="7" height="28" rx="3" fill="#1a1a1a" transform="rotate(-12 53 58)" />
    </g>
  );
}

/** Two of the waiting crowd: the grandma's bun and the uncle's cap. */
function CrowdPortrait({ emotion }: { emotion: RidgeEmotion }) {
  const cheering = emotion === 'playful' || emotion === 'surprised';
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="28" cy="34" r="9" fill="#fbfbf9" />
      <circle cx="22" cy="24" r="4" fill="#fbfbf9" />
      <circle cx="31" cy="33" r="1.4" fill="#1a1a1a" />
      <path d="M29 39 Q31 41 33 39" strokeWidth="2" />
      <path d="M28 43 V66" />
      <circle cx="52" cy="28" r="10" fill="#fbfbf9" />
      <path d="M42 24 H60 V19 H44 Z" fill="#1a1a1a" />
      <line x1="56" y1="23" x2="66" y2="24" />
      <circle cx="55" cy="28" r="1.5" fill="#1a1a1a" />
      {cheering ? <circle cx="56" cy="34" r="2.2" strokeWidth="2" /> : <path d="M52 34 H58" strokeWidth="2" />}
      <path d="M52 38 V66" />
      {cheering ? <path d="M52 44 L64 32" /> : <path d="M44 48 L60 48" />}
    </g>
  );
}

/** The hill-shuttle driver: big, cap pulled low, clipboard held like a shield. */
function DriverPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M28 19 H52" strokeWidth="4" />
      <rect x="32" y="14" width="16" height="6" fill="#fbfbf9" />
      <FaceMarks emotion={emotion} />
      <path d="M40 34 V58" />
      <rect x="46" y="36" width="16" height="20" fill="#fbfbf9" />
      <line x1="48" y1="42" x2="58" y2="42" strokeWidth="2" />
      <line x1="48" y1="47" x2="56" y2="47" strokeWidth="2" />
    </g>
  );
}

function TravelerPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M32 17 Q40 12 48 17" />
      <FaceMarks emotion={emotion === 'neutral' ? 'playful' : emotion} />
      <path d="M40 34 V58" />
      <path d="M40 40 L58 48" />
      <line x1="58" y1="36" x2="58" y2="68" strokeWidth="2.5" />
    </g>
  );
}

/** The Profe: hair in a high bun, one arm up with the güira, mid-count. */
function TeacherPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <circle cx="40" cy="12" r="4" fill="#1a1a1a" />
      <FaceMarks emotion={emotion === 'neutral' ? 'playful' : emotion} />
      <path d="M40 34 V50" />
      <path d="M30 50 L50 50 L56 72 L24 72 Z" fill="#fbfbf9" />
      <path d="M40 40 L24 46" />
      <path d="M40 40 L56 28" />
      <rect x="53" y="12" width="7" height="16" fill="#f4f1ea" strokeWidth="2" />
      <path d="M53 17 H60 M53 21 H60 M53 25 H60" strokeWidth="1" />
    </g>
  );
}

/** Last-Stop Operations: ponytail, headset, radio at the ready. */
function OperationsPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M31 20 Q24 30 27 40" strokeWidth="4" />
      <circle cx="40" cy="24" r="10" fill="#fbfbf9" />
      <path d="M30 22 Q32 12 40 13 Q48 13 50 21 Q42 17 34 21 Z" fill="#1a1a1a" />
      <path d="M30 24 Q40 8 50 24" strokeWidth="1.8" />
      <circle cx="30" cy="25" r="2.6" fill="#1a1a1a" />
      <path d="M30 27 Q32 32 37 31" strokeWidth="1.6" />
      <FaceMarks emotion={emotion} />
      <path d="M40 34 V58" />
      <rect x="31" y="40" width="18" height="18" fill="#f4f1ea" strokeWidth="2" />
      <path d="M40 42 L52 50" />
      <rect x="50" y="42" width="8" height="14" fill="#fbfbf9" strokeWidth="2" />
      <line x1="56" y1="42" x2="58" y2="34" strokeWidth="2" />
    </g>
  );
}

/** Festival Steward: brimmed hat, the very serious key on a ring. */
function StewardPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="40" cy="25" r="10" fill="#fbfbf9" />
      <path d="M26 18 H54" strokeWidth="3.5" />
      <path d="M32 18 L33 9 H47 L48 18 Z" fill="#1a1a1a" />
      <FaceMarks emotion={emotion === 'neutral' ? 'determined' : emotion} />
      <path d="M40 35 V60" />
      <path d="M40 42 L54 52" />
      <circle cx="56" cy="56" r="4" strokeWidth="2" />
      <path d="M56 60 V66 M56 64 H59" strokeWidth="2" />
    </g>
  );
}

/** Shared eyes-and-mouth for the plaza cast: one face language for every mood. */
function FaceMarks({ emotion }: { emotion: RidgeEmotion }) {
  switch (emotion) {
    case 'surprised':
      return (
        <>
          <circle cx="36" cy="23" r="2.2" fill="#1a1a1a" />
          <circle cx="44" cy="23" r="2.2" fill="#1a1a1a" />
          <circle cx="40" cy="30" r="2" strokeWidth="2" />
        </>
      );
    case 'playful':
      return (
        <>
          <path d="M33.5 24 L36 21.5 L38.5 24" strokeWidth="2" />
          <path d="M41.5 24 L44 21.5 L46.5 24" strokeWidth="2" />
          <path d="M35 28 Q40 33 45 28" strokeWidth="2" />
        </>
      );
    case 'thoughtful':
      return (
        <>
          <line x1="34" y1="24" x2="38" y2="24" strokeWidth="2" />
          <line x1="42" y1="24" x2="46" y2="24" strokeWidth="2" />
          <path d="M37 30 Q40 29 43 30" strokeWidth="2" />
        </>
      );
    case 'determined':
      return (
        <>
          <line x1="33" y1="20.5" x2="38" y2="22" strokeWidth="2" />
          <line x1="47" y1="20.5" x2="42" y2="22" strokeWidth="2" />
          <circle cx="36" cy="24.5" r="1.5" fill="#1a1a1a" />
          <circle cx="44" cy="24.5" r="1.5" fill="#1a1a1a" />
          <path d="M37 29.5 H43" strokeWidth="2" />
        </>
      );
    case 'sleepy':
      return (
        <>
          <path d="M34 24 Q36 26 38 24" strokeWidth="2" />
          <path d="M42 24 Q44 26 46 24" strokeWidth="2" />
          <path d="M38 29 H42" strokeWidth="2" />
        </>
      );
    default:
      return (
        <>
          <circle cx="36" cy="24" r="1.5" fill="#1a1a1a" />
          <circle cx="44" cy="24" r="1.5" fill="#1a1a1a" />
          <path d="M37 29 H43" strokeWidth="2" />
        </>
      );
  }
}

/** The street chick from the Overworld: round, smug, one red comb. */
function ChickPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 52 L6 44 M15 57 L5 57" strokeWidth="2.5" />
      <path d="M28 70 L26 78 M38 70 L40 78" strokeWidth="2.5" />
      <ellipse cx="31" cy="57" rx="19" ry="14" fill="#fbfbf9" />
      <path d="M22 55 Q30 64 39 55" strokeWidth="2" />
      <g fill="#b4533d" strokeWidth="2">
        <circle cx="44" cy="22" r="3.6" />
        <circle cx="50" cy="19" r="4" />
        <circle cx="56" cy="22" r="3.4" />
      </g>
      <circle cx="50" cy="35" r="13" fill="#fbfbf9" />
      <path d="M62 33 L72 36 L62 39 Z" fill="#1a1a1a" strokeWidth="2" />
      <ChickEye emotion={emotion} />
    </g>
  );
}

/**
 * The Overworld player sprite, enlarged: round head, eyes glancing right,
 * hoodie box and backpack (see TextureGenerator.generatePlayer).
 */
function StreetPlayerPortrait({ emotion, glasses = false }: { emotion: RidgeEmotion; glasses?: boolean }) {
  return (
    <g fill="#fbfbf9" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="17.5" y="45" width="11" height="22" />
      <rect x="26" y="39" width="28" height="40" />
      <circle cx="40" cy="28" r="16.5" />
      <circle cx="43" cy="25" r="2.8" fill="#1a1a1a" stroke="none" />
      <circle cx="51" cy="25" r="2.8" fill="#1a1a1a" stroke="none" />
      {glasses ? (
        <g fill="none" strokeWidth="2.5">
          <circle cx="43" cy="25" r="5.5" />
          <circle cx="51" cy="25" r="5.5" />
          <path d="M45.5 25 H48.5 M37.5 24 L31.5 22.5" />
        </g>
      ) : null}
      <StreetPlayerMouth emotion={emotion} />
    </g>
  );
}

/** The sprite has no mouth; only a strong feeling earns one. */
function StreetPlayerMouth({ emotion }: { emotion: RidgeEmotion }) {
  if (emotion === 'surprised') return <circle cx="48" cy="35" r="2" fill="none" strokeWidth="2.5" />;
  if (emotion === 'playful') return <path d="M44 34 Q48 37.5 52 34" fill="none" strokeWidth="2.5" />;
  if (emotion === 'thoughtful') return <path d="M45 35 H51" fill="none" strokeWidth="2.5" />;
  return null;
}

function ChickEye({ emotion }: { emotion: RidgeEmotion }) {
  if (emotion === 'surprised') {
    return (
      <>
        <circle cx="54" cy="32" r="3.4" fill="#fbfbf9" strokeWidth="2" />
        <circle cx="55" cy="32" r="1.3" fill="#1a1a1a" stroke="none" />
      </>
    );
  }
  if (emotion === 'playful') {
    // Heavy-lidded and pleased with itself.
    return (
      <>
        <path d="M50 31 L58 31" strokeWidth="2.5" />
        <circle cx="55" cy="33" r="1.6" fill="#1a1a1a" stroke="none" />
      </>
    );
  }
  return <circle cx="55" cy="32" r="2" fill="#1a1a1a" stroke="none" />;
}

function PlayerPortrait({ emotion }: { emotion: RidgeEmotion }) {
  return (
    <g fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round">
      <circle cx="40" cy="22" r="10" fill="#fbfbf9" />
      {/* Capped fringe, matching the stage figure (spikes read as horns). */}
      <path
        d="M30 21 L32 14 L40 11 L47 14 L50 21 L45 17 L37 18 Z"
        fill="#1a1a1a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M36 12 L34 8" strokeWidth="2" />
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
