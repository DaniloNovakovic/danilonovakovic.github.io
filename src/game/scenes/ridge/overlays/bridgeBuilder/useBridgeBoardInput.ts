import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  BRIDGE_NODES,
  bridgeEdgeKey,
  isBridgeNodeId,
  type BridgeDesign,
  type BridgeEdge,
  type BridgeNodeId
} from '@/game/core/ridge';
import type { BridgeTool } from './BridgeBoard';

type DragTarget = { nodeId: BridgeNodeId } | { edgeKey: string };

interface BridgeBoardInputOptions {
  design: BridgeDesign;
  tool: BridgeTool;
  canEdit: boolean;
  onChooseNode: (nodeId: BridgeNodeId | null) => void;
  onConnectNodes: (from: BridgeNodeId, to: BridgeNodeId) => void;
  onEraseEdge: (edge: BridgeEdge) => void;
}

export function useBridgeBoardInput({
  design,
  tool,
  canEdit,
  onChooseNode,
  onConnectNodes,
  onEraseEdge
}: BridgeBoardInputOptions) {
  const boardRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragTarget | null>(null);
  const [hoveredNode, setHoveredNode] = useState<BridgeNodeId | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!canEdit || event.button !== 0) return;
    event.preventDefault();
    const edgeKey = edgeKeyFromTarget(event.target);
    if (tool === 'erase' && edgeKey) {
      dragRef.current = { edgeKey };
      return;
    }
    const nodeId = nodeIdFromTarget(event.target);
    if (nodeId) {
      dragRef.current = { nodeId };
      setHoveredNode(nodeId);
    } else {
      dragRef.current = null;
      onChooseNode(null);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !('nodeId' in dragRef.current)) return;
    setHoveredNode(nodeFromPoint(boardRef.current, event.clientX, event.clientY));
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    event.preventDefault();
    const drag = dragRef.current;
    dragRef.current = null;
    setHoveredNode(null);

    if ('edgeKey' in drag) {
      const edge = design.edges.find((candidate) => bridgeEdgeKey(candidate.a, candidate.b) === drag.edgeKey);
      if (edge) onEraseEdge(edge);
      return;
    }

    const endNode = nodeFromPoint(boardRef.current, event.clientX, event.clientY) ?? drag.nodeId;
    if (endNode === drag.nodeId) onChooseNode(drag.nodeId);
    else onConnectNodes(drag.nodeId, endNode);
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
    setHoveredNode(null);
  };

  const handleNodeKeyDown = (event: ReactKeyboardEvent<SVGGElement>, nodeId: BridgeNodeId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    onChooseNode(nodeId);
  };

  return {
    boardRef,
    hoveredNode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleNodeKeyDown
  };
}

function nodeIdFromTarget(target: EventTarget | null): BridgeNodeId | null {
  if (!(target instanceof Element)) return null;
  const value = target.closest('[data-node-id]')?.getAttribute('data-node-id');
  return isBridgeNodeId(value) ? value : null;
}

function edgeKeyFromTarget(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest('[data-edge-key]')?.getAttribute('data-edge-key') ?? null;
}

function nodeFromPoint(svg: SVGSVGElement | null, clientX: number, clientY: number): BridgeNodeId | null {
  if (!svg) return null;
  const bounds = svg.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const x = ((clientX - bounds.left) / bounds.width) * 640;
  const y = ((clientY - bounds.top) / bounds.height) * 380;
  let nearest: BridgeNodeId | null = null;
  let distance = 42;
  for (const node of BRIDGE_NODES) {
    const nextDistance = Math.hypot(node.x - x, node.y - y);
    if (nextDistance <= distance) {
      nearest = node.id;
      distance = nextDistance;
    }
  }
  return nearest;
}
