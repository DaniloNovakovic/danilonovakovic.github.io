import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages, type Messages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Button, Panel } from '@/shared/ui';
import { SparePartSticker } from '../shared/SparePartSticker';
import { useSparePartReward } from '../shared/useSparePartReward';
import { hobbyBoardClass } from '../shared/hobbyStyles';
import { COUNT_IN_BEATS, DANCE_REWARD_ROUND, demoLengthBeats, type DanceMove } from './danceRound';
import { StickDancer } from './StickDancer';
import { useDanceGame, type DancePhase, type DanceState } from './useDanceGame';

type DanceCopy = Messages['miniGames']['dancing'];

const PHASE_MESSAGE: Record<DancePhase, (copy: DanceCopy, state: DanceState) => string> = {
  idle: (copy) => copy.startMessage,
  demo: (copy, state) => (state.beat !== null && state.beat >= COUNT_IN_BEATS ? copy.watchMessage : copy.countIn),
  input: (copy) => copy.turnMessage,
  cleared: (copy) => copy.successMessage,
  over: (copy, state) => copy.gameOver(Math.max(0, state.sequence.length - 1))
};

const PAD_LAYOUT: readonly (readonly [DanceMove, string] | null)[] = [
  null,
  ['up', '↑'],
  null,
  ['left', '←'],
  ['down', '↓'],
  ['right', '→']
];

const KEY_MOVES: Record<string, DanceMove> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left'
};

export default function DancingOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.dancing;
  const reward = useSparePartReward('clock-crystal');
  const { state, press, start } = useDanceGame(reward.claim);
  const canStart = state.phase === 'idle' || state.phase === 'over';

  useOverlayKeys({
    ...Object.fromEntries(Object.entries(KEY_MOVES).map(([key, move]) => [key, () => press(move)])),
    Enter: start
  });

  return (
    <OverlayDialogFrame
      title={messages.catalog.hobbies.dancing.name}
      description={messages.catalog.hobbies.dancing.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
          <span>{copy.round(Math.max(1, state.sequence.length))}</span>
          {reward.owned ? null : <span className="normal-case italic opacity-50">{copy.goal(DANCE_REWARD_ROUND)}</span>}
          <span className="opacity-60">{copy.best(state.best)}</span>
        </div>

        <Panel border="thick" className={`${hobbyBoardClass} flex h-[260px] flex-col items-center p-3`}>
          <p className="text-base font-black" aria-live="polite">
            {PHASE_MESSAGE[state.phase](copy, state)}
          </p>
          <BeatDots state={state} />
          <div className="flex w-full flex-1 items-center justify-around gap-2">
            <div className="h-[150px]">
              <StickDancer pose={state.pose} label={copy.dancerLabel} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PAD_LAYOUT.map((cell, index) =>
                cell ? (
                  <Button
                    key={cell[0]}
                    variant="control"
                    aria-label={copy.moveButton(copy.moves[cell[0]])}
                    onClick={() => press(cell[0])}
                    className={`h-12 w-12 p-0 text-xl sm:h-14 sm:w-14 ${state.activeMove === cell[0] ? 'bg-[#1a1a1a] text-[#fbfbf9] hover:bg-[#1a1a1a]' : ''}`}
                  >
                    {cell[1]}
                  </Button>
                ) : (
                  <div key={index} />
                )
              )}
            </div>
          </div>
          {canStart ? (
            <Button variant="secondary" size="sm" onClick={start}>
              {state.phase === 'over' ? messages.common.restart : messages.common.start}
            </Button>
          ) : null}
          <SparePartSticker key={reward.stickerKey} partId="clock-crystal" outcome={reward.outcome} onDismiss={reward.dismiss} />
        </Panel>

        <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}

/** Visual metronome: count-in beats are rings, move beats are squares; the current beat is inked. */
function BeatDots({ state }: { state: DanceState }) {
  if (state.phase !== 'demo') return <div className="h-3" aria-hidden="true" />;
  const beats = demoLengthBeats(state.sequence.length);
  return (
    <div className="mt-1 flex h-3 items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: beats }, (_, beat) => (
        <span
          key={beat}
          className={`h-2.5 w-2.5 border-2 border-[#1a1a1a] ${beat < COUNT_IN_BEATS ? 'rounded-full' : 'rounded-[1px]'} ${state.beat !== null && beat <= state.beat ? 'bg-[#1a1a1a]' : ''}`}
        />
      ))}
    </div>
  );
}
