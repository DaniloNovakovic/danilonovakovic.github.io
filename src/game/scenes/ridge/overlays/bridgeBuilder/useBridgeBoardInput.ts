import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  BRIDGE_BOARD_BOUNDS,
  snapBridgePoint,
  type BridgeDesign,
  type BridgeMaterial,
  type BridgeNode,
  type BridgeNodeId,
  type BridgePoint
} from '@/game/core/ridge';
import type { BridgeTool } from './types';

interface BridgeBoardInputOptions {
  design: BridgeDesign;
  tool: BridgeTool;
  canEdit: boolean;
  onConnect: (start: BridgePoint, end: BridgePoint, kind: BridgeMaterial) => void;
  onMove: (nodeId: BridgeNodeId, point: BridgePoint) => void;
  onEraseBeam: (beamId: string) => void;
  onEraseNode: (nodeId: BridgeNodeId) => void;
}

interface DrawPreview {
  start: BridgePoint;
  end: BridgePoint;
  kind: BridgeMaterial;
}

type DragState =
  | { kind: 'draw'; start: BridgePoint }
  | { kind: 'move'; nodeId: BridgeNodeId };

export function useBridgeBoardInput({
  design,
  tool,
  canEdit,
  onConnect,
  onMove,
  onEraseBeam,
  onEraseNode
}: BridgeBoardInputOptions) {
  const boardRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [preview, setPreview] = useState<DrawPreview | null>(null);
  const [tapStart, setTapStart] = useState<BridgePoint | null>(null);
  const [keyboardPoint, setKeyboardPoint] = useState<BridgePoint>({ x: 320, y: 210 });

  const choosePoint = (point: BridgePoint) => {
    if (tool === 'move') {
      const node = snapBridgePoint(design.nodes, point, 26);
      if (node) onMove(node.id, point);
      return;
    }
    if (tool === 'erase') {
      const node = snapBridgePoint(design.nodes, point, 26);
      if (node) onEraseNode(node.id);
      return;
    }
    if (tapStart) {
      onConnect(tapStart, point, tool);
      setTapStart(null);
    } else {
      setTapStart(point);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!canEdit || event.button !== 0) return;
    event.preventDefault();
    const point = pointFromEvent(boardRef.current, event);
    if (tool === 'erase') {
      const beamId = idFromTarget(event.target, 'beam');
      const nodeId = idFromTarget(event.target, 'node');
      if (beamId) onEraseBeam(beamId);
      else if (nodeId) onEraseNode(nodeId);
      return;
    }
    if (tool === 'move') {
      const node = snapBridgePoint(design.nodes, point, 28);
      if (!node) return;
      dragRef.current = { kind: 'move', nodeId: node.id };
    } else {
      dragRef.current = { kind: 'draw', start: point };
      setPreview({ start: point, end: point, kind: tool });
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragRef.current || !canEdit) return;
    const point = pointFromEvent(boardRef.current, event);
    if (dragRef.current.kind === 'move') {
      onMove(dragRef.current.nodeId, point);
      return;
    }
    setPreview({ start: dragRef.current.start, end: point, kind: tool === 'cable' ? 'cable' : 'beam' });
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    dragRef.current = null;
    setPreview(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (drag.kind === 'move') return;

    const end = pointFromEvent(boardRef.current, event);
    if (Math.hypot(end.x - drag.start.x, end.y - drag.start.y) >= 12) {
      onConnect(drag.start, end, tool === 'cable' ? 'cable' : 'beam');
      setTapStart(null);
      return;
    }
    choosePoint(end);
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
    setPreview(null);
  };

  const handleBoardKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (!canEdit) return;
    const movement = movementForKey(event.key);
    if (movement) {
      event.preventDefault();
      setKeyboardPoint((current) => clampPoint({ x: current.x + movement.x, y: current.y + movement.y }));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choosePoint(keyboardPoint);
    }
    if (event.key === 'Escape' && tapStart) {
      event.preventDefault();
      event.stopPropagation();
      setTapStart(null);
    }
  };

  const handleNodeKeyDown = (event: ReactKeyboardEvent<SVGGElement>, node: BridgeNode) => {
    if (!canEdit || event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    choosePoint(node);
  };

  return {
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
  };
}

function pointFromEvent(
  svg: SVGSVGElement | null,
  event: { clientX: number; clientY: number }
): BridgePoint {
  if (!svg) return { x: 0, y: 0 };
  const bounds = svg.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 };
  return clampPoint({
    x: ((event.clientX - bounds.left) / bounds.width) * 640,
    y: ((event.clientY - bounds.top) / bounds.height) * 380
  });
}

function clampPoint(point: BridgePoint): BridgePoint {
  return {
    x: Math.min(BRIDGE_BOARD_BOUNDS.right, Math.max(BRIDGE_BOARD_BOUNDS.left, point.x)),
    y: Math.min(BRIDGE_BOARD_BOUNDS.bottom, Math.max(BRIDGE_BOARD_BOUNDS.top, point.y))
  };
}

function idFromTarget(target: EventTarget | null, kind: 'beam' | 'node'): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest(`[data-${kind}-id]`)?.getAttribute(`data-${kind}-id`) ?? null;
}

function movementForKey(key: string): BridgePoint | null {
  const distance = 12;
  if (key === 'ArrowLeft') return { x: -distance, y: 0 };
  if (key === 'ArrowRight') return { x: distance, y: 0 };
  if (key === 'ArrowUp') return { x: 0, y: -distance };
  if (key === 'ArrowDown') return { x: 0, y: distance };
  return null;
}
