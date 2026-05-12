import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import {
  bridgeActions,
  type SceneControlPointerEventKind
} from '@/game/bridge/store';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/designSize';
import type { SceneId } from '@/game/scenes/sceneIds';

interface UseSceneControlMatPointerBridgeOptions {
  disabled: boolean;
  frameRef: RefObject<HTMLElement | null>;
  ownerSceneId: SceneId;
}

export function useSceneControlMatPointerBridge({
  disabled,
  frameRef,
  ownerSceneId
}: UseSceneControlMatPointerBridgeOptions) {
  const activePointerIdRef = useRef<number | null>(null);

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

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || shouldIgnoreControlMatEvent(event.target)) return;
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dispatchPointer('down', event);
  }, [disabled, dispatchPointer]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (disabled || activePointerIdRef.current !== event.pointerId) return;
    dispatchPointer('move', event);
  }, [disabled, dispatchPointer]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (!disabled) {
      dispatchPointer('up', event);
    }
    activePointerIdRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, [disabled, dispatchPointer]);

  const onPointerCancel = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (!disabled) {
      dispatchPointer('cancel', event);
    }
    activePointerIdRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, [disabled, dispatchPointer]);

  return {
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp
  };
}

function shouldIgnoreControlMatEvent(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button,a,input,select,textarea,[role="button"],[data-scene-control-ignore="true"]'
    )
  );
}
