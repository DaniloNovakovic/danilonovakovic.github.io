import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type PointerEvent
} from 'react';
import { bridgeActions } from '@/game/bridge/store';
import { reduceControlMatDragIndicator } from '@/shared/ui';
import {
  resolvePortraitCoverHorizontalAxis,
  shouldPortraitCoverDragActivate
} from './portraitCoverTouchInput';

interface UseGameTouchControlsOptions {
  isPaused: boolean;
}

export function useGameTouchControls({ isPaused }: UseGameTouchControlsOptions) {
  const activePointerIdRef = useRef<number | null>(null);
  const anchorRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const [dragIndicator, dispatchDragIndicator] = useReducer(reduceControlMatDragIndicator, null);

  const clearMovement = useCallback(() => {
    bridgeActions.setTouchDirectional('left', 0);
    bridgeActions.setTouchDirectional('right', 0);
  }, []);

  const releasePointer = useCallback(() => {
    activePointerIdRef.current = null;
    hasDraggedRef.current = false;
    clearMovement();
    dispatchDragIndicator({ type: 'clear' });
  }, [clearMovement]);

  useEffect(() => {
    if (isPaused) {
      releasePointer();
    }
  }, [isPaused, releasePointer]);

  const readPoint = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }, []);

  const stopPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const applyDrag = useCallback((deltaX: number) => {
    if (isPaused) return;

    const axisX = resolvePortraitCoverHorizontalAxis(deltaX);
    bridgeActions.setTouchDirectional('left', Math.max(0, -axisX));
    bridgeActions.setTouchDirectional('right', Math.max(0, axisX));
  }, [isPaused]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    stopPointer(event);
    if (isPaused) return;

    const point = readPoint(event);
    activePointerIdRef.current = event.pointerId;
    anchorRef.current = point;
    hasDraggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatchDragIndicator({ type: 'begin', point });
    clearMovement();
  }, [clearMovement, isPaused, readPoint, stopPointer]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    stopPointer(event);

    const point = readPoint(event);
    const deltaX = point.x - anchorRef.current.x;
    if (shouldPortraitCoverDragActivate(deltaX)) {
      hasDraggedRef.current = true;
    }

    dispatchDragIndicator({ type: 'move', point });
    applyDrag(deltaX);
  }, [applyDrag, readPoint, stopPointer]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    stopPointer(event);

    if (!isPaused && !hasDraggedRef.current) {
      bridgeActions.tapInteract();
    }

    releasePointer();
  }, [isPaused, releasePointer, stopPointer]);

  const onPointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    stopPointer(event);
    releasePointer();
  }, [releasePointer, stopPointer]);

  const onPointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    stopPointer(event);
    releasePointer();
  }, [releasePointer, stopPointer]);

  return {
    dragIndicator,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp
  };
}
