import { useCallback, useEffect, useReducer, useRef, type PointerEvent, type RefObject } from 'react';
import {
  bridgeActions,
  type SceneControlPointerEventKind
} from '@/game/bridge/store';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/designSize';
import type { SceneId } from '@/game/scenes/sceneIds';
import { reduceControlMatDragIndicator } from '@/shared/ui';

interface UseSceneControlMatPointerBridgeOptions {
  disabled: boolean;
  frameRef: RefObject<HTMLElement | null>;
  ownerSceneId: SceneId;
  showPointerVisual?: boolean;
}

export function useSceneControlMatPointerBridge({
  disabled,
  frameRef,
  ownerSceneId,
  showPointerVisual = false
}: UseSceneControlMatPointerBridgeOptions) {
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerTargetRef = useRef<HTMLElement | null>(null);
  const lastPointerEventRef = useRef<SceneControlPointerEventSnapshot | null>(null);
  const pendingMoveRef = useRef<SceneControlPointerEventSnapshot | null>(null);
  const pendingMoveFrameRef = useRef<number | null>(null);
  const [pointerVisual, dispatchPointerVisual] = useReducer(reduceControlMatDragIndicator, null);

  const dispatchPointer = useCallback((
    kind: SceneControlPointerEventKind,
    event: SceneControlPointerEventSnapshot
  ) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const designPoint = mapClientPointToEnvelopedDesignPoint({
      clientX: event.clientX,
      clientY: event.clientY,
      rect
    });

    bridgeActions.dispatchSceneControlPointerEvent(ownerSceneId, {
      kind,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      x: designPoint.x,
      y: designPoint.y
    });
  }, [frameRef, ownerSceneId]);

  const cancelPendingMove = useCallback(() => {
    if (pendingMoveFrameRef.current !== null) {
      cancelAnimationFrame(pendingMoveFrameRef.current);
      pendingMoveFrameRef.current = null;
    }
    pendingMoveRef.current = null;
  }, []);

  const flushPendingMove = useCallback(() => {
    const event = pendingMoveRef.current;
    pendingMoveRef.current = null;
    pendingMoveFrameRef.current = null;
    if (!event || activePointerIdRef.current !== event.pointerId) return;
    dispatchPointer('move', event);
  }, [dispatchPointer]);

  const scheduleMove = useCallback((event: SceneControlPointerEventSnapshot) => {
    pendingMoveRef.current = event;
    if (pendingMoveFrameRef.current !== null) return;
    pendingMoveFrameRef.current = requestAnimationFrame(flushPendingMove);
  }, [flushPendingMove]);

  const dispatchActivePointerCancel = useCallback(() => {
    const pointerId = activePointerIdRef.current;
    if (pointerId === null) return;
    cancelPendingMove();
    const event = lastPointerEventRef.current;
    if (event && event.pointerId === pointerId) {
      dispatchPointer('cancel', event);
    }
    releasePointerCapture(activePointerTargetRef.current, pointerId);
    activePointerIdRef.current = null;
    activePointerTargetRef.current = null;
    lastPointerEventRef.current = null;
    dispatchPointerVisual({ type: 'clear' });
  }, [cancelPendingMove, dispatchPointer]);

  useEffect(() => {
    if (disabled) {
      dispatchActivePointerCancel();
    }
  }, [disabled, dispatchActivePointerCancel]);

  useEffect(() => {
    if (!showPointerVisual) dispatchPointerVisual({ type: 'clear' });
  }, [showPointerVisual]);

  useEffect(() => () => {
    cancelPendingMove();
  }, [cancelPendingMove]);

  const readControlMatPoint = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || shouldIgnoreControlMatEvent(event.target)) return;
    const eventSnapshot = readPointerEventSnapshot(event);
    activePointerIdRef.current = event.pointerId;
    activePointerTargetRef.current = event.currentTarget;
    lastPointerEventRef.current = eventSnapshot;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (showPointerVisual) {
      const point = readControlMatPoint(event);
      dispatchPointerVisual({
        point,
        type: 'begin'
      });
    }
    cancelPendingMove();
    dispatchPointer('down', eventSnapshot);
  }, [cancelPendingMove, disabled, dispatchPointer, readControlMatPoint, showPointerVisual]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || activePointerIdRef.current !== event.pointerId) return;
    const eventSnapshot = readPointerEventSnapshot(event);
    lastPointerEventRef.current = eventSnapshot;
    if (showPointerVisual) {
      const point = readControlMatPoint(event);
      dispatchPointerVisual({
        point,
        type: 'move'
      });
    }
    scheduleMove(eventSnapshot);
  }, [disabled, readControlMatPoint, scheduleMove, showPointerVisual]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const eventSnapshot = readPointerEventSnapshot(event);
    cancelPendingMove();
    if (!disabled) {
      dispatchPointer('up', eventSnapshot);
    }
    activePointerIdRef.current = null;
    activePointerTargetRef.current = null;
    lastPointerEventRef.current = null;
    dispatchPointerVisual({ type: 'clear' });
    releasePointerCapture(event.currentTarget, event.pointerId);
  }, [cancelPendingMove, disabled, dispatchPointer]);

  const onPointerCancel = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    const eventSnapshot = readPointerEventSnapshot(event);
    cancelPendingMove();
    if (!disabled) {
      dispatchPointer('cancel', eventSnapshot);
    }
    activePointerIdRef.current = null;
    activePointerTargetRef.current = null;
    lastPointerEventRef.current = null;
    dispatchPointerVisual({ type: 'clear' });
    releasePointerCapture(event.currentTarget, event.pointerId);
  }, [cancelPendingMove, disabled, dispatchPointer]);

  return {
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    pointerVisual: disabled || !showPointerVisual
      ? null
      : pointerVisual
  };
}

interface SceneControlPointerEventSnapshot {
  clientX: number;
  clientY: number;
  pointerId: number;
  timeStamp: number;
}

interface ClientPointToDesignPointInput {
  clientX: number;
  clientY: number;
  rect: DOMRect;
}

function readPointerEventSnapshot(event: PointerEvent<HTMLElement>): SceneControlPointerEventSnapshot {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: event.pointerId,
    timeStamp: event.timeStamp
  };
}

function mapClientPointToEnvelopedDesignPoint({
  clientX,
  clientY,
  rect
}: ClientPointToDesignPointInput): { x: number; y: number } {
  const scale = Math.max(
    rect.width / GAME_DESIGN_WIDTH,
    rect.height / GAME_DESIGN_HEIGHT
  );
  const visibleWidth = rect.width / scale;
  const visibleHeight = rect.height / scale;
  const cropX = (GAME_DESIGN_WIDTH - visibleWidth) / 2;
  const cropY = (GAME_DESIGN_HEIGHT - visibleHeight) / 2;

  return {
    x: cropX + ((clientX - rect.left) / rect.width) * visibleWidth,
    y: cropY + ((clientY - rect.top) / rect.height) * visibleHeight
  };
}

function releasePointerCapture(target: HTMLElement | null, pointerId: number): void {
  try {
    target?.releasePointerCapture?.(pointerId);
  } catch {
    // Pointer capture may already be gone if the browser canceled the gesture first.
  }
}

function shouldIgnoreControlMatEvent(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button,a,input,select,textarea,[role="button"],[data-scene-control-ignore="true"]'
    )
  );
}
