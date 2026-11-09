import {
  BRIDGE_GUIDE_EDGES,
  BRIDGE_NODES,
  bridgeEdgeKey,
  bridgeNodeById,
  bridgeNodePairLabel,
  type BridgeDesign,
  type BridgeEdge,
  type BridgeNodeId,
  type BridgeTestVehicle
} from '@/game/core/ridge';
import type { Messages } from '@/shared/i18n';
import { useBridgeBoardInput } from './useBridgeBoardInput';

export type BridgeTool = 'draw' | 'erase';
export type BridgeBoardPhase = 'draft' | 'car-testing' | 'car-passed' | 'truck-testing' | 'complete' | 'failed';
type BridgeBuilderCopy = Messages['miniGames']['bridgeBuilder'];

interface BridgeBoardProps {
  copy: BridgeBuilderCopy;
  design: BridgeDesign;
  tool: BridgeTool;
  selectedNode: BridgeNodeId | null;
  hint: BridgeEdge | null;
  showGuide: boolean;
  phase: BridgeBoardPhase;
  testVehicle: BridgeTestVehicle;
  canEdit: boolean;
  onChooseNode: (nodeId: BridgeNodeId | null) => void;
  onConnectNodes: (from: BridgeNodeId, to: BridgeNodeId) => void;
  onEraseEdge: (edge: BridgeEdge) => void;
}

export function BridgeBoard(props: BridgeBoardProps) {
  const { copy, design, selectedNode, hint, showGuide, phase, testVehicle } = props;
  const {
    boardRef,
    hoveredNode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleNodeKeyDown
  } = useBridgeBoardInput({
    design: props.design,
    tool: props.tool,
    canEdit: props.canEdit,
    onChooseNode: props.onChooseNode,
    onConnectNodes: props.onConnectNodes,
    onEraseEdge: props.onEraseEdge
  });
  const isTesting = phase === 'car-testing' || phase === 'truck-testing';
  const hintKey = hint ? bridgeEdgeKey(hint.a, hint.b) : null;

  return (
    <div className={`bridge-builder-board relative overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] ${phase === 'failed' ? 'is-failed' : ''}`}>
      <svg
        ref={boardRef}
        viewBox="0 0 640 380"
        className="block h-auto w-full"
        role="group"
        aria-label={copy.boardLabel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <defs>
          <pattern id="bridge-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1a1a1a" strokeWidth="1" opacity="0.08" />
          </pattern>
          <pattern id="bridge-river-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
            <path d="M 0 0 V 14" stroke="#1a1a1a" strokeWidth="2" opacity="0.12" />
          </pattern>
        </defs>
        <rect width="640" height="380" fill="#fbfbf9" />
        <rect width="640" height="380" fill="url(#bridge-grid)" />
        <path d="M0 245 Q100 230 190 250 T380 247 T640 246 V380 H0Z" fill="#f4f1ea" />
        <path d="M0 245 Q100 230 190 250 T380 247 T640 246 V380 H0Z" fill="url(#bridge-river-hatch)" />
        <path d="M0 220 Q40 205 78 220 L106 245 H0Z" fill="#1a1a1a" opacity="0.12" />
        <path d="M640 220 Q600 205 562 220 L534 245 H640Z" fill="#1a1a1a" opacity="0.12" />
        <path d="M0 220 H62 M578 220 H640" stroke="#1a1a1a" strokeWidth="8" strokeLinecap="round" />
        <text x="24" y="202" fill="#1a1a1a" fontSize="10" fontFamily="monospace" fontWeight="900" letterSpacing="1">{copy.westBank}</text>
        <text x="616" y="202" textAnchor="end" fill="#1a1a1a" fontSize="10" fontFamily="monospace" fontWeight="900" letterSpacing="1">{copy.eastBank}</text>
        <text x="320" y="365" textAnchor="middle" fill="#1a1a1a" opacity="0.45" fontSize="11" fontFamily="monospace" fontStyle="italic" letterSpacing="2">{copy.river}</text>
        <text x="320" y="28" textAnchor="middle" fill="#1a1a1a" opacity="0.45" fontSize="10" fontFamily="monospace" letterSpacing="1">{copy.pencilMarks}</text>

        <g className={`bridge-board-drawing ${isTesting ? 'is-testing' : ''} ${phase === 'failed' ? 'is-failed' : ''}`}>
          {showGuide && props.canEdit ? BRIDGE_GUIDE_EDGES.map((edge) => {
            const from = bridgeNodeById(edge.a);
            const to = bridgeNodeById(edge.b);
            const key = bridgeEdgeKey(edge.a, edge.b);
            return (
              <line
                key={`guide-${key}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={`bridge-guide-strut ${hintKey === key ? 'is-hinted' : ''}`}
              />
            );
          }) : null}
          {design.edges.map((edge) => {
            const from = bridgeNodeById(edge.a);
            const to = bridgeNodeById(edge.b);
            const key = bridgeEdgeKey(edge.a, edge.b);
            return (
              <g
                key={key}
                data-edge-key={key}
                role="button"
                tabIndex={0}
                aria-label={copy.removeStrutLabel(bridgeNodePairLabel(edge))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Delete') {
                    event.preventDefault();
                    props.onEraseEdge(edge);
                  }
                }}
              >
                <line className="bridge-strut-hit" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                <line className="bridge-strut" x1={from.x} y1={from.y} x2={to.x} y2={to.y} pointerEvents="none" />
              </g>
            );
          })}
        </g>

        {BRIDGE_NODES.map((node) => (
          <g
            key={node.id}
            data-node-id={node.id}
            className={`bridge-joint ${selectedNode === node.id ? 'is-selected' : ''} ${hoveredNode === node.id ? 'is-hovered' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={copy.jointLabel(node.label)}
            onKeyDown={(event) => handleNodeKeyDown(event, node.id)}
          >
            <circle cx={node.x} cy={node.y} r="40" fill="transparent" />
            <circle className="bridge-joint-ring" cx={node.x} cy={node.y} r="13" />
            <text className="bridge-joint-number" x={node.x} y={node.y + 5}>{node.label}</text>
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className={`bridge-vehicle ${phase === 'car-testing' ? 'is-car-testing' : ''} ${phase === 'truck-testing' ? 'is-truck-testing' : ''} ${phase === 'failed' ? 'is-failed' : ''}`}
          style={{ left: vehicleLeft(phase), top: '60%' }}
        >
          <BridgeVehicle vehicle={testVehicle} />
        </div>
      </div>
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

function vehicleLeft(phase: BridgeBoardPhase): string {
  if (phase === 'car-passed' || phase === 'complete') return '86%';
  if (phase === 'failed') return '52%';
  return '10%';
}

function BridgeVehicle({ vehicle }: { vehicle: BridgeTestVehicle }) {
  if (vehicle === 'truck') {
    return (
      <svg viewBox="0 0 100 58" className="block w-full drop-shadow-[2px_2px_0px_rgba(26,26,26,0.25)]">
        <path d="M5 12 H61 V43 H5Z M61 25 H82 L95 37 V43 H61Z" fill="#fbfbf9" stroke="#1a1a1a" strokeWidth="4" strokeLinejoin="round" />
        <path d="M67 28 H80 L88 36 H67Z" fill="#1a1a1a" opacity="0.2" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M13 20 H52 M13 27 H52 M13 34 H52" stroke="#1a1a1a" strokeWidth="2" opacity="0.35" />
        <circle cx="23" cy="45" r="8" fill="#1a1a1a" /><circle cx="23" cy="45" r="3" fill="#fbfbf9" />
        <circle cx="77" cy="45" r="8" fill="#1a1a1a" /><circle cx="77" cy="45" r="3" fill="#fbfbf9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 48" className="block w-full drop-shadow-[2px_2px_0px_rgba(26,26,26,0.25)]">
      <path d="M8 29 L16 16 H49 L62 29 H72 V38 H8Z" fill="#fbfbf9" stroke="#1a1a1a" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M20 18 H47 L56 28 H15Z" fill="#1a1a1a" opacity="0.16" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="23" cy="38" r="7" fill="#1a1a1a" /><circle cx="23" cy="38" r="2.5" fill="#fbfbf9" />
      <circle cx="59" cy="38" r="7" fill="#1a1a1a" /><circle cx="59" cy="38" r="2.5" fill="#fbfbf9" />
    </svg>
  );
}
