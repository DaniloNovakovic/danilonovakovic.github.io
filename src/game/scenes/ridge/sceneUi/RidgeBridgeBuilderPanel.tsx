import { useEffect, type ReactNode } from 'react';
import type { BridgeBuildPhase, BridgeBuildTip, RidgeEmotion } from '@/game/core/ridge';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { useMessages } from '@/shared/i18n';
import { cn } from '@/shared/ui/utils';
import { PortraitChip } from './conversationPortraits';

export type RidgeBridgeTool = 'road' | 'wood' | 'eraser';

export type RidgeBridgeCommand =
  | 'undo'
  | 'clear'
  | 'hint'
  | 'sketch'
  | 'test'
  | 'stop'
  | 'edit'
  | 'leave';

export interface RidgeBridgeBuilderPanelView {
  phase: BridgeBuildPhase;
  tool: RidgeBridgeTool;
  ink: number;
  inkBudget: number;
  attempts: number;
  tip: BridgeBuildTip;
  tipText: string;
  hintVisible: boolean;
  sketchOffered: boolean;
  /** Design has at least one beam: gates Test and Clear. */
  hasBeams: boolean;
  /** Edit history is non-empty, so a Clear can still be undone. */
  canUndo: boolean;
}

type Dispatch = SceneUiSurfaceProps['dispatchAction'];

/**
 * Blueprint Bridge drawing-table chrome. The canvas stays live for drawing
 * (this surface only takes pointer events on its own controls); Phaser owns
 * the drawing itself, the toy car, and the physics run.
 */
export function RidgeBridgeBuilderPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  useBuilderKeys(view, dispatchAction);
  if (!view) return null;

  const command = (value: RidgeBridgeCommand) => dispatchAction('ridgeBridgeCommand', { command: value });
  const pickTool = (tool: RidgeBridgeTool) => dispatchAction('ridgeBridgeTool', { tool });

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 short:p-1.5">
      <TopBar view={view} />
      <BottomBar view={view} command={command} pickTool={pickTool} />
    </div>
  );
}

function TopBar({ view }: { view: RidgeBridgeBuilderPanelView }) {
  const copy = useMessages().ridge.bridgeBuilder;
  return (
    <div className="flex items-start gap-2">
      <TipCard view={view} />
      <div className="pointer-events-none ml-auto flex shrink-0 flex-col items-end gap-1.5">
        <span className="-rotate-2 rounded border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#fbfbf9] shadow-[3px_3px_0px_0px_rgba(75,67,55,1)] sm:text-xs">
          {copy.title}
          {view.attempts > 0 ? <span className="ml-1.5 opacity-70">· {copy.attempt(view.attempts)}</span> : null}
        </span>
        <InkMeter ink={view.ink} budget={view.inkBudget} label={copy.ink} />
      </div>
    </div>
  );
}

const TIP_EMOTION: Record<BridgeBuildPhase, RidgeEmotion> = {
  editing: 'thoughtful',
  testing: 'surprised',
  failed: 'determined',
  passed: 'playful'
};

/** How the Draftsperson takes each kind of collapse. */
const FAILURE_EMOTION: Partial<Record<BridgeBuildTip, RidgeEmotion>> = {
  no_road: 'surprised',
  bare_deck: 'surprised',
  loose_frame: 'thoughtful',
  stuck: 'curious'
};

function tipEmotion(view: RidgeBridgeBuilderPanelView): RidgeEmotion {
  return (view.phase === 'failed' ? FAILURE_EMOTION[view.tip] : undefined) ?? TIP_EMOTION[view.phase];
}

/** The Draftsperson coaching from the corner, like a margin note. */
function TipCard({ view }: { view: RidgeBridgeBuilderPanelView }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none flex max-w-[min(30rem,62%)] items-center gap-2 rounded-lg border-[3px] border-[#1a1a1a] bg-[#fbfbf9] p-1.5 pr-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:gap-3 sm:p-2 sm:pr-4 short:gap-1.5 short:p-1 short:pr-2"
    >
      <PortraitChip
        portrait="draftsperson"
        emotion={tipEmotion(view)}
        className="h-10 w-10 sm:h-12 sm:w-12 short:h-7 short:w-7 short:border-2"
      />
      <p
        key={view.tipText}
        className="animate-ridge-enter-center text-[12px] font-bold leading-snug text-[#1a1a1a] motion-reduce:animate-none sm:text-sm short:text-[11px] short:leading-tight"
      >
        {view.tipText}
      </p>
    </div>
  );
}

/** Ink left in the pen, hatched like a pencil-filled bar. */
function InkMeter({ ink, budget, label }: { ink: number; budget: number; label: string }) {
  const used = Math.min(1, ink / budget);
  const over = ink > budget;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={budget}
      aria-valuenow={Math.round(ink)}
      className="flex items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">{label}</span>
      <span className="relative h-2.5 w-20 overflow-hidden rounded-sm border-2 border-[#1a1a1a] sm:w-28">
        <span
          className={cn(
            'absolute inset-y-0 left-0 transition-[width] duration-150',
            over
              ? 'bg-[#1a1a1a]'
              : '[background-image:repeating-linear-gradient(-45deg,#1a1a1a,#1a1a1a_2px,transparent_2px,transparent_4px)]'
          )}
          style={{ width: `${used * 100}%` }}
        />
      </span>
      <span className={cn('min-w-[3.2rem] text-right text-[10px] font-black tabular-nums', over && 'underline decoration-wavy')}>
        {Math.round(ink)}/{budget}
      </span>
    </div>
  );
}

interface BarProps {
  view: RidgeBridgeBuilderPanelView;
  command: (value: RidgeBridgeCommand) => void;
  pickTool: (tool: RidgeBridgeTool) => void;
}

function BottomBar(props: BarProps) {
  switch (props.view.phase) {
    case 'passed':
      return <div />;
    case 'testing':
      return <TestingBar {...props} />;
    case 'failed':
      return <FailedBar {...props} />;
    default:
      return <EditingBar {...props} />;
  }
}

function TestingBar({ command }: BarProps) {
  const copy = useMessages().ridge.bridgeBuilder;
  return (
    <div className="flex justify-end">
      <PaperButton onClick={() => command('stop')} label={copy.stop} keyHint="Esc">
        ■ {copy.stop}
      </PaperButton>
    </div>
  );
}

function FailedBar({ view, command }: BarProps) {
  const copy = useMessages().ridge.bridgeBuilder;
  const hintLabel = view.hintVisible ? copy.hideHint : copy.hint;
  return (
    <div className="flex items-end justify-end gap-2">
      {view.sketchOffered ? (
        <PaperButton onClick={() => command('hint')} label={hintLabel}>
          {hintLabel}
        </PaperButton>
      ) : null}
      <PaperButton primary onClick={() => command('edit')} label={copy.tryAgain} keyHint="Space">
        ✎ {copy.tryAgain}
      </PaperButton>
    </div>
  );
}

function EditingBar({ view, command, pickTool }: BarProps) {
  const copy = useMessages().ridge.bridgeBuilder;
  const canTest = view.hasBeams && view.ink <= view.inkBudget;
  return (
    <div className="flex flex-wrap items-end gap-1.5 sm:gap-2 short:flex-nowrap short:gap-1">
      <div role="radiogroup" aria-label={copy.toolsLabel} className="flex gap-1.5">
        <ToolButton tool="road" active={view.tool} onPick={pickTool} label={copy.road} hint={copy.roadHint}>
          <RoadGlyph />
        </ToolButton>
        <ToolButton tool="wood" active={view.tool} onPick={pickTool} label={copy.wood} hint={copy.woodHint}>
          <WoodGlyph />
        </ToolButton>
        <ToolButton tool="eraser" active={view.tool} onPick={pickTool} label={copy.eraser} hint={copy.eraserHint}>
          <EraserGlyph />
        </ToolButton>
      </div>
      <div className="flex gap-1.5">
        <PaperButton small disabled={!view.canUndo} onClick={() => command('undo')} label={copy.undo} keyHint="Z">
          ↶
        </PaperButton>
        <PaperButton small disabled={!view.hasBeams} onClick={() => command('clear')} label={copy.clear}>
          ✕
        </PaperButton>
        <HintButton view={view} command={command} />
      </div>
      <div className="ml-auto flex items-end gap-1.5">
        <PaperButton small onClick={() => command('leave')} label={copy.leave} keyHint="Esc">
          ←
        </PaperButton>
        <PaperButton primary disabled={!canTest} onClick={() => command('test')} label={copy.test} keyHint="Space">
          ▶ {copy.test}
        </PaperButton>
      </div>
      <p className="pointer-events-none hidden w-full text-[10px] font-bold uppercase tracking-wider text-[#4b4337] opacity-80 pointer-fine:block short:hidden">
        {copy.keys}
      </p>
    </div>
  );
}

/** `?` peeks at the sketch; once it is offered and showing, it offers to trace it. */
function HintButton({ view, command }: Pick<BarProps, 'view' | 'command'>) {
  const copy = useMessages().ridge.bridgeBuilder;
  const canTrace = view.hintVisible && view.sketchOffered;
  const label = canTrace ? copy.useSketch : view.hintVisible ? copy.hideHint : copy.hint;
  return (
    <PaperButton small onClick={() => command(canTrace ? 'sketch' : 'hint')} label={label} keyHint="H">
      {canTrace ? copy.useSketch : '?'}
    </PaperButton>
  );
}

function ToolButton({
  tool,
  active,
  onPick,
  label,
  hint,
  children
}: {
  tool: RidgeBridgeTool;
  active: RidgeBridgeTool;
  onPick: (tool: RidgeBridgeTool) => void;
  label: string;
  hint: string;
  children: ReactNode;
}) {
  const selected = tool === active;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={`${label}: ${hint}`}
      onClick={() => onPick(tool)}
      className={cn(
        'pointer-events-auto flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded border-[3px] border-[#1a1a1a] text-[10px] font-black uppercase tracking-wider transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] sm:h-14 sm:w-16 short:h-9 short:w-11 short:text-[8px]',
        selected
          ? 'translate-y-0.5 bg-[#1a1a1a] text-[#fbfbf9] shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]'
          : 'bg-[#fbfbf9] text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:-translate-y-0.5'
      )}
    >
      {children}
      {label}
    </button>
  );
}

function PaperButton({
  onClick,
  label,
  keyHint,
  primary,
  small,
  disabled,
  children
}: {
  onClick: () => void;
  label: string;
  keyHint?: string;
  primary?: boolean;
  small?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={keyHint ? `${label} (${keyHint})` : label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'pointer-events-auto rounded border-[3px] border-[#1a1a1a] font-black uppercase tracking-wider transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        small
          ? 'h-10 min-w-10 px-2 text-sm sm:h-11 sm:min-w-11 short:h-9 short:min-w-9'
          : 'h-12 px-4 text-sm sm:h-14 sm:px-6 sm:text-base short:h-9 short:px-3 short:text-sm',
        primary
          ? 'bg-[#1a1a1a] text-[#fbfbf9] shadow-[4px_4px_0px_0px_rgba(75,67,55,1)] enabled:hover:-translate-y-0.5'
          : 'bg-[#fbfbf9] text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] enabled:hover:-translate-y-0.5'
      )}
    >
      {children}
    </button>
  );
}

function RoadGlyph() {
  return (
    <svg viewBox="0 0 32 12" className="h-3 w-8" aria-hidden>
      <rect x="1" y="2" width="30" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="11" y1="2" x2="11" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="21" y1="2" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function WoodGlyph() {
  return (
    <svg viewBox="0 0 32 12" className="h-3 w-8" aria-hidden>
      <path d="M2 10 L16 2 L30 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="2" y1="10" x2="30" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

function EraserGlyph() {
  return (
    <svg viewBox="0 0 32 14" className="h-3.5 w-8" aria-hidden>
      <path d="M6 12 L14 2 L26 2 L18 12 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="10" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Keyboard contract: 1/2/3 pick tools, Z undo, H hint, Space/Enter test or
 * fix, Esc step away (or stop a run). Typing in a text field is left alone.
 */
function useBuilderKeys(view: RidgeBridgeBuilderPanelView | null, dispatch: Dispatch): void {
  useEffect(() => {
    if (!view) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const action = keyAction(event, view);
      if (!action) return;
      event.preventDefault();
      if ('tool' in action) dispatch('ridgeBridgeTool', action);
      else dispatch('ridgeBridgeCommand', action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, dispatch]);
}

type KeyAction = { tool: RidgeBridgeTool } | { command: RidgeBridgeCommand };

const PHASE_KEYS: Record<BridgeBuildPhase, Record<string, KeyAction>> = {
  editing: {
    '1': { tool: 'road' },
    '2': { tool: 'wood' },
    '3': { tool: 'eraser' },
    z: { command: 'undo' },
    h: { command: 'hint' },
    ' ': { command: 'test' },
    enter: { command: 'test' },
    escape: { command: 'leave' }
  },
  testing: {
    ' ': { command: 'stop' },
    escape: { command: 'stop' }
  },
  failed: {
    ' ': { command: 'edit' },
    enter: { command: 'edit' },
    escape: { command: 'edit' },
    h: { command: 'hint' }
  },
  passed: {}
};

function keyAction(event: KeyboardEvent, view: RidgeBridgeBuilderPanelView): KeyAction | null {
  const key = event.key.toLowerCase();
  // Space/Enter on a focused button already clicks it; do not fire twice.
  const activatesButton = key === ' ' || key === 'enter';
  if (activatesButton && event.target instanceof HTMLButtonElement) return null;
  return PHASE_KEYS[view.phase][key] ?? null;
}

function readParams(params: unknown): RidgeBridgeBuilderPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const value = params as RidgeBridgeBuilderPanelView;
  return typeof value.phase === 'string' && typeof value.tipText === 'string' ? value : null;
}
