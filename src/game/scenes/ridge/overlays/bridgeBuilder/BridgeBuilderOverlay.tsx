import { useEffect, useMemo, useState } from 'react';
import {
  Eraser,
  Eye,
  EyeOff,
  Lightbulb,
  Pencil,
  RotateCcw,
  Undo2,
  X
} from 'lucide-react';
import { bridgeActions } from '@/game/bridge/store';
import {
  addBridgeEdge,
  BRIDGE_BUILDER_INK_BUDGET,
  bridgeNodeById,
  canAddBridgeEdge,
  evaluateBridge,
  nextBridgeHint,
  removeBridgeEdge,
  type BridgeDesign,
  type BridgeEdge,
  type BridgeNodeId,
  type BridgeTestVehicle
} from '@/game/core/ridge';
import { RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Button } from '@/shared/ui';
import { BridgeBoard, type BridgeBoardPhase, type BridgeTool } from './BridgeBoard';
import { BridgeBuilderSidebar } from './BridgeBuilderSidebar';
import './bridgeBuilder.css';

export default function BridgeBuilderOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const copy = useMessages().miniGames.bridgeBuilder;
  const [edges, setEdges] = useState<BridgeEdge[]>([]);
  const [tool, setTool] = useState<BridgeTool>('draw');
  const [selectedNode, setSelectedNode] = useState<BridgeNodeId | null>(null);
  const [hint, setHint] = useState<BridgeEdge | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [phase, setPhase] = useState<BridgeBoardPhase>('draft');
  const [testVehicle, setTestVehicle] = useState<BridgeTestVehicle>('car');
  const [notice, setNotice] = useState<string>(copy.initialNotice);

  const design = useMemo<BridgeDesign>(() => ({ edges }), [edges]);
  const evaluation = useMemo(() => evaluateBridge(design), [design]);
  const canEdit = phase === 'draft';
  const isBusy = phase !== 'draft' && phase !== 'car-passed';
  const vehicleLabel = testVehicle === 'car' ? copy.car : copy.truck;

  useEffect(() => {
    if (phase !== 'car-testing' && phase !== 'truck-testing' && phase !== 'failed') return;
    const duration = motionSafeDuration(
      phase === 'failed' ? 1400 : phase === 'car-testing' ? 2400 : 3000
    );
    const timer = window.setTimeout(() => {
      if (phase === 'failed') {
        setPhase('draft');
        return;
      }

      const passed = phase === 'car-testing' ? evaluation.carReady : evaluation.truckReady;
      if (!passed) {
        setPhase('failed');
        setNotice(copy.failedNotice(vehicleLabel.toLowerCase()));
        return;
      }

      if (phase === 'car-testing') {
        setPhase('car-passed');
        setNotice(copy.carPassedNotice);
      } else {
        setPhase('complete');
        setNotice(copy.truckPassedNotice);
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [copy, evaluation, phase, vehicleLabel]);

  const connectNodes = (from: BridgeNodeId, to: BridgeNodeId) => {
    if (!canEdit || tool !== 'draw' || !canAddBridgeEdge(design, from, to)) return;
    setEdges([...addBridgeEdge(design, from, to).edges]);
    setSelectedNode(null);
    setHint(null);
  };

  const chooseNode = (nodeId: BridgeNodeId | null) => {
    if (!canEdit || tool !== 'draw') return;
    if (!nodeId) {
      setSelectedNode(null);
      return;
    }
    if (selectedNode && selectedNode !== nodeId) {
      connectNodes(selectedNode, nodeId);
      return;
    }
    setSelectedNode((current) => (current === nodeId ? null : nodeId));
  };

  const eraseEdge = (edge: BridgeEdge) => {
    if (!canEdit) return;
    setEdges([...removeBridgeEdge(design, edge).edges]);
    setHint(null);
  };

  const clearPage = () => {
    if (!canEdit) return;
    setEdges([]);
    setSelectedNode(null);
    setHint(null);
    setNotice(copy.clearNotice);
  };

  const undo = () => {
    if (!canEdit) return;
    setEdges((current) => current.slice(0, -1));
    setSelectedNode(null);
    setHint(null);
  };

  const askForHint = () => {
    if (!canEdit) return;
    const next = nextBridgeHint(design);
    if (!next) return;
    setHint(next);
    setSelectedNode(null);
    setNotice(copy.hintNotice(bridgeNodeById(next.a).label, bridgeNodeById(next.b).label));
  };

  const startTest = (vehicle: BridgeTestVehicle) => {
    if (isBusy || edges.length === 0) {
      if (edges.length === 0) setNotice(copy.noEdgesNotice);
      return;
    }
    setSelectedNode(null);
    setHint(null);
    setTestVehicle(vehicle);
    setPhase(vehicle === 'car' ? 'car-testing' : 'truck-testing');
    setNotice(copy.testingNotice(vehicle === 'car' ? copy.car : copy.truck));
  };

  const keepDrawing = () => {
    setPhase('draft');
    setNotice(copy.initialNotice);
  };

  const finish = () => {
    if (phase !== 'complete') return;
    bridgeActions.dispatchSceneUiAction(RIDGE_SCENE_ID, 'ridgeBridgeBuilderComplete', design);
    close();
  };

  useOverlayKeys({
    r: clearPage,
    h: askForHint,
    t: () => startTest(phase === 'car-passed' ? 'truck' : 'car'),
    '1': () => setTool('draw'),
    '2': () => setTool('erase')
  });

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
            <div className="flex gap-1" role="group" aria-label={copy.tools.draw}>
              <Button
                variant={tool === 'draw' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTool('draw')}
                disabled={!canEdit}
                icon={<Pencil size={14} />}
              >
                {copy.tools.draw}
              </Button>
              <Button
                variant={tool === 'erase' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTool('erase')}
                disabled={!canEdit}
                icon={<Eraser size={14} />}
              >
                {copy.tools.erase}
              </Button>
            </div>
            <span className="font-mono text-xs font-black uppercase tracking-wider">
              {copy.ink(evaluation.inkUsed, BRIDGE_BUILDER_INK_BUDGET)}
            </span>
          </div>

          <BridgeBoard
            copy={copy}
            design={design}
            tool={tool}
            selectedNode={selectedNode}
            hint={hint}
            showGuide={showGuide}
            phase={phase}
            testVehicle={testVehicle}
            canEdit={canEdit}
            onChooseNode={chooseNode}
            onConnectNodes={connectNodes}
            onEraseEdge={eraseEdge}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" size="sm" onClick={undo} disabled={!canEdit || edges.length === 0} icon={<Undo2 size={14} />}>
                {copy.tools.undo}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearPage} disabled={!canEdit || edges.length === 0} icon={<RotateCcw size={14} />}>
                {copy.tools.clear}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowGuide((value) => !value)} disabled={!canEdit} icon={showGuide ? <EyeOff size={14} /> : <Eye size={14} />}>
                {copy.tools.guide}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={askForHint} disabled={!canEdit} icon={<Lightbulb size={14} />}>
              {copy.tools.hint}
            </Button>
          </div>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wide opacity-50">{copy.keyboardHint}</p>
        </section>

        <BridgeBuilderSidebar
          copy={copy}
          evaluation={evaluation}
          phase={phase}
          notice={notice}
          onStartTest={startTest}
          onKeepDrawing={keepDrawing}
          onFinish={finish}
        />
      </div>
    </div>
  );
}

function motionSafeDuration(duration: number): number {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 500;
  }
  return duration;
}
