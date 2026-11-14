import {
  snapBridgePoint,
  type BridgeDesign,
  type BridgeMaterial,
  type BridgeNode,
  type BridgePoint,
  type BridgeSimulation,
  type CarWheel
} from '@/game/core/ridge';
import type { Messages } from '@/shared/i18n';
import { useBridgeBoardInput } from './useBridgeBoardInput';
import type { BridgeWorkbenchPhase } from './useBridgeCarTest';
import type { BridgeTool } from './types';

interface BridgeBoardProps {
  copy: Messages['miniGames']['bridgeBuilder'];
  design: BridgeDesign;
  simulation: BridgeSimulation | null;
  phase: BridgeWorkbenchPhase;
  tool: BridgeTool;
  canEdit: boolean;
  onConnect: (start: BridgePoint, end: BridgePoint, kind: BridgeMaterial) => void;
  onMove: (nodeId: string, point: BridgePoint) => void;
  onEraseBeam: (beamId: string) => void;
  onEraseNode: (nodeId: string) => void;
}

export function BridgeBoard(props: BridgeBoardProps) {
  const { copy, design, simulation, phase, tool, canEdit } = props;
  const {
    boardRef,
    preview,
    tapStart,
    keyboardPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleBoardKeyDown,
    handleNodeKeyDown
  } = useBridgeBoardInput({
    design,
    tool,
    canEdit,
    onConnect: props.onConnect,
    onMove: props.onMove,
    onEraseBeam: props.onEraseBeam,
    onEraseNode: props.onEraseNode
  });
  const nodes = simulation?.nodes ?? design.nodes;
  const beams = simulation?.beams ?? design.beams;
  const rear = simulation?.car.rear ?? { x: 28, y: 200 };
  const front = simulation?.car.front ?? { x: 70, y: 200 };

  return (
    <div className="bridge-builder-board relative overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
      <svg
        ref={boardRef}
        viewBox="0 0 640 380"
        className="block h-auto w-full"
        role="group"
        aria-label={copy.boardLabel}
        tabIndex={0}
        onKeyDown={handleBoardKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <defs>
          <pattern id="bridge-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1a1a1a" strokeWidth="1" opacity="0.07" />
          </pattern>
          <pattern id="bridge-river-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
            <path d="M 0 0 V 14" stroke="#1a1a1a" strokeWidth="2" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="640" height="380" fill="#fbfbf9" />
        <rect width="640" height="380" fill="url(#bridge-grid)" />
        <path d="M0 245 Q100 230 190 250 T380 247 T640 246 V380 H0Z" fill="#f4f1ea" />
        <path d="M0 245 Q100 230 190 250 T380 247 T640 246 V380 H0Z" fill="url(#bridge-river-hatch)" />
        <path d="M0 210 H70 L54 250 L38 270 L24 310 H0Z" fill="#1a1a1a" opacity="0.14" />
        <path d="M640 210 H570 L586 250 L602 270 L616 310 H640Z" fill="#1a1a1a" opacity="0.14" />
        <path d="M0 210 H70 M570 210 H640" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
        <path d="M45 230 L30 250 M58 245 L43 265 M595 230 L610 250 M582 245 L597 265" stroke="#1a1a1a" strokeWidth="2" opacity="0.3" />
        <text x="20" y="194" fill="#1a1a1a" fontSize="9" fontFamily="monospace" fontWeight="900" letterSpacing="1">{copy.startLabel}</text>
        <text x="620" y="194" textAnchor="end" fill="#1a1a1a" fontSize="9" fontFamily="monospace" fontWeight="900" letterSpacing="1">{copy.inspectorLabel}</text>
        <text x="320" y="366" textAnchor="middle" fill="#1a1a1a" opacity="0.45" fontSize="10" fontFamily="monospace" fontStyle="italic" letterSpacing="2">{copy.river}</text>
        <text x="18" y="26" fill="#1a1a1a" opacity="0.42" fontSize="9" fontFamily="monospace" letterSpacing="1">{copy.freeBuildLabel}</text>

        <g>
          {beams.map((beam) => {
            const a = findNode(nodes, beam.a);
            const b = findNode(nodes, beam.b);
            const physics = simulation?.beams.find((candidate) => candidate.id === beam.id);
            const broken = physics?.broken ?? false;
            const stressRatio = physics ? Math.min(1, physics.stress / (beam.kind === 'cable' ? 0.12 : 0.035)) : 0;
            return (
              <g
                key={beam.id}
                data-beam-id={beam.id}
                role={canEdit ? 'button' : undefined}
                tabIndex={canEdit ? 0 : undefined}
                aria-label={copy.removeStrutLabel(beam.id)}
                onKeyDown={(event) => {
                  if (tool === 'erase' && (event.key === 'Enter' || event.key === ' ' || event.key === 'Delete')) {
                    event.preventDefault();
                    props.onEraseBeam(beam.id);
                  }
                }}
              >
                <line className="bridge-strut-hit" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <line
                  className={`bridge-strut ${beam.kind === 'cable' ? 'is-cable' : ''} ${broken ? 'is-broken' : ''} ${stressRatio > 0.65 ? 'is-stressed' : ''}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={beam.kind === 'cable' ? 2.5 : 5 + stressRatio * 3}
                  strokeDasharray={broken ? '4 8' : stressRatio > 0.9 ? '8 4' : beam.kind === 'cable' ? '8 5' : undefined}
                  opacity={broken ? 0.18 : 1}
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </g>

        {preview ? (
          <PreviewLine preview={preview} nodes={design.nodes} />
        ) : null}

        {nodes.map((node) => (
          <g
            key={node.id}
            data-node-id={node.id}
            className={`bridge-joint ${node.pinned ? 'is-anchored' : ''}`}
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            aria-label={copy.jointLabel(node.id)}
            onKeyDown={(event) => handleNodeKeyDown(event, node)}
          >
            <circle cx={node.x} cy={node.y} r="28" fill="transparent" />
            {node.pinned ? (
              <rect className="bridge-anchor" x={node.x - 8} y={node.y - 8} width="16" height="16" />
            ) : (
              <circle className="bridge-joint-ring" cx={node.x} cy={node.y} r="6" />
            )}
          </g>
        ))}

        {tapStart ? (
          <circle className="bridge-start-ring" cx={tapStart.x} cy={tapStart.y} r="14" />
        ) : null}
        <KeyboardCursor point={keyboardPoint} />
        <Car rear={rear} front={front} />
        <CickaInspector />
      </svg>
      {phase === 'complete' ? (
        <div className="bridge-stamp pointer-events-none absolute right-3 top-3 border-4 border-[#1a1a1a] bg-[#fbfbf9] px-3 py-1 font-mono text-sm font-black tracking-widest">
          {copy.approved}
        </div>
      ) : null}
      {phase === 'failed' ? (
        <div className="bridge-stamp pointer-events-none absolute left-3 top-3 border-4 border-dashed border-[#1a1a1a] bg-[#fbfbf9] px-3 py-1 font-mono text-xs font-black tracking-widest">
          {copy.collapsed}
        </div>
      ) : null}
    </div>
  );
}

function PreviewLine({ preview, nodes }: { preview: { start: BridgePoint; end: BridgePoint; kind: BridgeMaterial }; nodes: readonly BridgeNode[] }) {
  const start = snapBridgePoint(nodes, preview.start) ?? preview.start;
  const end = snapBridgePoint(nodes, preview.end) ?? preview.end;
  return (
    <line
      className={preview.kind === 'cable' ? 'bridge-preview is-cable' : 'bridge-preview'}
      x1={start.x}
      y1={start.y}
      x2={end.x}
      y2={end.y}
      strokeDasharray={preview.kind === 'cable' ? '8 5' : undefined}
    />
  );
}

function KeyboardCursor({ point }: { point: BridgePoint }) {
  return <path className="bridge-keyboard-cursor" d={`M${point.x - 9} ${point.y} H${point.x + 9} M${point.x} ${point.y - 9} V${point.y + 9}`} />;
}

function Car({ rear, front }: { rear: Pick<CarWheel, 'x' | 'y'>; front: Pick<CarWheel, 'x' | 'y'> }) {
  const centerX = (rear.x + front.x) / 2;
  const centerY = (rear.y + front.y) / 2 - 15;
  const angle = Math.atan2(front.y - rear.y, front.x - rear.x) * (180 / Math.PI);
  return (
    <g className="bridge-car" aria-hidden="true">
      <g transform={`translate(${centerX} ${centerY}) rotate(${angle})`}>
        <path d="M-34 3 L-25 -12 H11 L26 3 H34 V13 H-34Z" fill="#fbfbf9" stroke="#1a1a1a" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M-20 -10 H9 L19 1 H-26Z" fill="#1a1a1a" opacity="0.16" stroke="#1a1a1a" strokeWidth="1.5" />
      </g>
      {[rear, front].map((wheel, index) => (
        <g key={index} transform={`translate(${wheel.x} ${wheel.y})`}>
          <circle r="9" fill="#1a1a1a" />
          <circle r="3" fill="#fbfbf9" />
          <path d="M-7 0 H7 M0 -7 V7" stroke="#fbfbf9" strokeWidth="1" opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

function findNode(nodes: readonly BridgeNode[], id: string): BridgeNode {
  const node = nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Missing rendered bridge joint "${id}"`);
  return node;
}

function CickaInspector() {
  return (
    <g transform="translate(586 178)" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round">
      <ellipse cx="-4" cy="8" rx="16" ry="9" fill="#fbfbf9" />
      <circle cx="9" cy="0" r="9" fill="#fbfbf9" />
      <path d="M3 -6 L0 -15 L8 -8 M12 -7 L17 -15 L17 -4 M-18 7 Q-28 -4 -22 -12" />
      <circle cx="7" cy="-1" r="1" fill="#1a1a1a" />
      <circle cx="12" cy="-1" r="1" fill="#1a1a1a" />
    </g>
  );
}
