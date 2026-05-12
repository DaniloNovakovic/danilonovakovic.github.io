import { useCallback, useEffect, useReducer, useRef, type PointerEvent, type RefObject } from 'react';
import {
  bridgeActions,
  type SceneControlPointerEventKind
} from '@/game/bridge/store';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/designSize';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { ControlMatDragIndicatorState } from '@/shared/ui';

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
  const [pointerVisual, dispatchPointerVisual] = useReducer(pointerVisualReducer, null);

  useEffect(() => {
    if (disabled || !showPointerVisual) {
      activePointerIdRef.current = null;
      dispatchPointerVisual({ type: 'clear' });
    }
  }, [disabled, showPointerVisual]);

  const dispatchPointer = useCallback((
    kind: SceneControlPointerEventKind,
    event: PointerEvent<HTMLElement>
  ) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    bridgeActions.dispatchSceneControlPointerEvent(ownerSceneId, {
      kind,
      pointerId: event.pointerId,
      timestamp: event.timeStamp,
      x: ((event.clientX - rect.left) / rect.width) * GAME_DESIGN_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * GAME_DESIGN_HEIGHT
    });
  }, [frameRef, ownerSceneId]);

  const readControlMatPoint = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || shouldIgnoreControlMatEvent(event.target)) return;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (showPointerVisual) {
      const point = readControlMatPoint(event);
      dispatchPointerVisual({
        point,
        type: 'begin'
      });
    }
    dispatchPointer('down', event);
  }, [disabled, dispatchPointer, readControlMatPoint, showPointerVisual]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || activePointerIdRef.current !== event.pointerId) return;
    if (showPointerVisual) {
      const point = readControlMatPoint(event);
      dispatchPointerVisual({
        point,
        type: 'move'
      });
    }
    dispatchPointer('move', event);
  }, [disabled, dispatchPointer, readControlMatPoint, showPointerVisual]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (!disabled) {
      dispatchPointer('up', event);
    }
    activePointerIdRef.current = null;
    dispatchPointerVisual({ type: 'clear' });
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, [disabled, dispatchPointer]);

  const onPointerCancel = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (!disabled) {
      dispatchPointer('cancel', event);
    }
    activePointerIdRef.current = null;
    dispatchPointerVisual({ type: 'clear' });
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, [disabled, dispatchPointer]);

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

type PointerVisualAction =
  | { type: 'begin'; point: { x: number; y: number } }
  | { type: 'move'; point: { x: number; y: number } }
  | { type: 'clear' };

function pointerVisualReducer(
  state: ControlMatDragIndicatorState | null,
  action: PointerVisualAction
): ControlMatDragIndicatorState | null {
  switch (action.type) {
    case 'begin':
      return {
        anchorX: action.point.x,
        anchorY: action.point.y,
        currentX: action.point.x,
        currentY: action.point.y
      };
    case 'move':
      return state
        ? { ...state, currentX: action.point.x, currentY: action.point.y }
        : null;
    case 'clear':
      return null;
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
