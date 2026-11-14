import { Car, Check, Move, Pencil, Play, RotateCcw } from 'lucide-react';
import {
  BRIDGE_BUILDER_INK_BUDGET,
  bridgeInkUsed,
  type BridgeDesign,
  type BridgeSimulation
} from '@/game/core/ridge';
import type { Messages } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import type { BridgeWorkbenchPhase } from './useBridgeCarTest';

interface BridgeBuilderSidebarProps {
  copy: Messages['miniGames']['bridgeBuilder'];
  design: BridgeDesign;
  phase: BridgeWorkbenchPhase;
  simulation: BridgeSimulation | null;
  onStartTest: () => void;
  onStopTest: () => void;
  onFinish: () => void;
}

export function BridgeBuilderSidebar({
  copy,
  design,
  phase,
  simulation,
  onStartTest,
  onStopTest,
  onFinish
}: BridgeBuilderSidebarProps) {
  const ink = bridgeInkUsed(design);
  const stress = simulation?.maxStress ?? 0;
  const stressPercent = Math.min(100, (stress / 0.035) * 100);
  const brokenCount = simulation?.brokenBeamIds.length ?? 0;

  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <section className="rounded-lg border-2 border-[#1a1a1a] bg-[#f4f1ea] p-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-mono text-xs font-black uppercase tracking-widest">{copy.ink(Math.round(ink), BRIDGE_BUILDER_INK_BUDGET)}</h3>
          <span className="font-mono text-[10px] opacity-60">{copy.pieces(design.beams.length)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-[#fbfbf9]">
          <div className="h-full bg-[#1a1a1a]" style={{ width: `${Math.min(100, (ink / BRIDGE_BUILDER_INK_BUDGET) * 100)}%` }} />
        </div>
        <ul className="mt-3 grid gap-2 text-[11px] font-bold">
          <li className="flex items-center gap-2"><Pencil size={14} /><span>{copy.materials.beam}</span></li>
          <li className="flex items-center gap-2"><span className="font-mono text-sm">- - -</span><span>{copy.materials.cable}</span></li>
          <li className="flex items-center gap-2"><Move size={14} /><span>{copy.materials.move}</span></li>
        </ul>
      </section>

      <section className="rounded border-2 border-dashed border-[#1a1a1a]/60 p-3">
        <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-wider">
          <span>{copy.stressTitle}</span>
          <span>{simulation ? `${simulation.elapsed.toFixed(1)}s` : copy.stressIdle}</span>
        </div>
        <div className="stress-meter mt-2" aria-label={`${copy.stressTitle} ${Math.round(stressPercent)}%`}>
          <span style={{ width: `${stressPercent}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-bold opacity-65">
          {brokenCount > 0 ? copy.snapped(brokenCount) : stressPercent > 65 ? copy.stressWarning : copy.stressCalm}
        </p>
      </section>

      <div aria-live="polite" className={`min-h-[6rem] rounded border-2 border-dashed border-[#1a1a1a]/60 p-3 text-sm font-bold leading-relaxed ${phase === 'complete' ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9]'}`}>
        {noticeForPhase(copy, phase, design.beams.length > 0)}
      </div>

      <div className="mt-auto grid gap-2">
        {phase === 'draft' ? (
          <Button variant="primary" size="lg" onClick={onStartTest} disabled={design.beams.length === 0} icon={<Play size={17} />}>
            {copy.testCar}
          </Button>
        ) : null}
        {phase === 'testing' ? (
          <Button variant="secondary" size="lg" onClick={onStopTest} icon={<Pencil size={17} />}>
            {copy.actions.edit}
          </Button>
        ) : null}
        {phase === 'failed' ? (
          <Button variant="primary" size="lg" onClick={onStopTest} icon={<RotateCcw size={17} />}>
            {copy.actions.retry}
          </Button>
        ) : null}
        {phase === 'complete' ? (
          <Button variant="primary" size="lg" onClick={onFinish} icon={<Check size={18} />}>
            {copy.returnToRidge}
          </Button>
        ) : null}
      </div>
      <p className="text-center font-mono text-[10px] font-bold uppercase tracking-wide opacity-45">
        <Car size={13} className="mr-1 inline" /> {copy.actions.tagline}
      </p>
    </aside>
  );
}

function noticeForPhase(
  copy: Messages['miniGames']['bridgeBuilder'],
  phase: BridgeWorkbenchPhase,
  hasBeams: boolean
): string {
  if (phase === 'testing') return copy.notices.testing;
  if (phase === 'failed') return copy.notices.failed;
  if (phase === 'complete') return copy.notices.complete;
  return hasBeams ? copy.notices.ready : copy.notices.empty;
}
