import { useState } from 'react';
import { Cable, Eraser, Lightbulb, Move, Pencil, RotateCcw, X } from 'lucide-react';
import { bridgeActions } from '@/game/bridge/store';
import {
  addBridgeBeam,
  createEmptyBridgeDesign,
  moveBridgeNode,
  removeBridgeBeam,
  removeBridgeNode,
  type BridgeMaterial,
  type BridgeNodeId,
  type BridgePoint
} from '@/game/core/ridge';
import { RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Button } from '@/shared/ui';
import { BridgeBoard } from './BridgeBoard';
import { BridgeBuilderSidebar } from './BridgeBuilderSidebar';
import { useBridgeCarTest } from './useBridgeCarTest';
import type { BridgeTool } from './types';
import './bridgeBuilder.css';

export default function BridgeBuilderOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const copy = useMessages().miniGames.bridgeBuilder;
  const [design, setDesign] = useState(() => createEmptyBridgeDesign());
  const [tool, setTool] = useState<BridgeTool>('beam');
  const [tipIndex, setTipIndex] = useState(0);
  const carTest = useBridgeCarTest(design);
  const canEdit = carTest.phase === 'draft';

  const connect = (start: BridgePoint, end: BridgePoint, kind: BridgeMaterial) => {
    if (!canEdit) return;
    setDesign((current) => addBridgeBeam(current, start, end, kind));
  };

  const move = (nodeId: BridgeNodeId, point: BridgePoint) => {
    if (!canEdit) return;
    setDesign((current) => moveBridgeNode(current, nodeId, point));
  };

  const eraseBeam = (beamId: string) => {
    if (!canEdit) return;
    setDesign((current) => removeBridgeBeam(current, beamId));
  };

  const eraseNode = (nodeId: BridgeNodeId) => {
    if (!canEdit) return;
    setDesign((current) => removeBridgeNode(current, nodeId));
  };

  const clear = () => {
    if (!canEdit) return;
    setDesign(createEmptyBridgeDesign());
  };

  const cycleTip = () => setTipIndex((current) => (current + 1) % copy.tips.length);

  useOverlayKeys({
    t: () => carTest.phase === 'draft' ? carTest.start() : carTest.stop(),
    r: clear,
    h: cycleTip,
    '1': () => setTool('beam'),
    '2': () => setTool('cable'),
    '3': () => setTool('move'),
    '4': () => setTool('erase')
  });

  const finish = () => {
    if (carTest.phase !== 'complete') return;
    bridgeActions.dispatchSceneUiAction(RIDGE_SCENE_ID, 'ridgeBridgeBuilderComplete', design);
    close();
  };

  return (
    <div className="relative max-h-[94dvh] w-[min(96vw,1000px)] overflow-y-auto rounded-2xl border-4 border-[#1a1a1a] bg-[#fbfbf9] p-3 text-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b-4 border-[#1a1a1a] pb-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] opacity-60 sm:text-xs">
            {copy.eyebrow}
          </p>
          <h2 id={titleId} className="mt-1 text-2xl font-black uppercase tracking-wide sm:text-4xl">
            {copy.title}
          </h2>
        </div>
        <Button variant="icon" size="sm" onClick={close} aria-label={copy.close} className="shrink-0">
          <X size={20} />
        </Button>
      </div>
      <p id={descriptionId} className="mt-3 max-w-3xl text-sm font-medium italic leading-relaxed opacity-75 sm:text-base">
        {copy.description}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1" role="group" aria-label={copy.toolGroupLabel}>
              <ToolButton active={tool === 'beam'} label={copy.tools.beam} icon={<Pencil size={14} />} onClick={() => setTool('beam')} disabled={!canEdit} />
              <ToolButton active={tool === 'cable'} label={copy.tools.cable} icon={<Cable size={14} />} onClick={() => setTool('cable')} disabled={!canEdit} />
              <ToolButton active={tool === 'move'} label={copy.tools.move} icon={<Move size={14} />} onClick={() => setTool('move')} disabled={!canEdit} />
              <ToolButton active={tool === 'erase'} label={copy.tools.erase} icon={<Eraser size={14} />} onClick={() => setTool('erase')} disabled={!canEdit} />
            </div>
            <span className="font-mono text-[10px] font-black uppercase tracking-wider opacity-55">
              {copy.freeJoints(design.nodes.filter((node) => !node.pinned).length)}
            </span>
          </div>

          <BridgeBoard
            copy={copy}
            design={design}
            simulation={carTest.simulation}
            phase={carTest.phase}
            tool={tool}
            canEdit={canEdit}
            onConnect={connect}
            onMove={move}
            onEraseBeam={eraseBeam}
            onEraseNode={eraseNode}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={clear} disabled={!canEdit || design.beams.length === 0} icon={<RotateCcw size={14} />}>
              {copy.tools.clear}
            </Button>
            <Button variant="ghost" size="sm" onClick={cycleTip} icon={<Lightbulb size={14} />}>
              {copy.tools.hint}
            </Button>
          </div>
          <p className="mt-2 min-h-8 text-xs font-bold italic opacity-65" aria-live="polite">{copy.tips[tipIndex]}</p>
          <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wide opacity-50">{copy.keyboardHint}</p>
        </section>

        <BridgeBuilderSidebar
          copy={copy}
          design={design}
          phase={carTest.phase}
          simulation={carTest.simulation}
          onStartTest={carTest.start}
          onStopTest={carTest.stop}
          onFinish={finish}
        />
      </div>
    </div>
  );
}

function ToolButton({
  active,
  label,
  icon,
  onClick,
  disabled
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button variant={active ? 'primary' : 'secondary'} size="sm" onClick={onClick} disabled={disabled} icon={icon} aria-pressed={active}>
      {label}
    </Button>
  );
}
