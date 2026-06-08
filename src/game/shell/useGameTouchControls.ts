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
  shouldPortraitCoverPointerTravelActivate
} from './portraitCoverTouchInput';

interface UseGameTouchControlsOptions {
  isPaused: boolean;
}

interface DragStartSnapshot {
  clientX: number;
  clientY: number;
  containerX: number;
  containerY: number;
}

export function useGameTouchControls({ isPaused }: UseGameTouchControlsOptions) {
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef<DragStartSnapshot>({
    clientX: 0,
    clientY: 0,
    containerX: 0,
    containerY: 0
  });
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
    if (isPaused || activePointerIdRef.current !== null) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const containerX = event.clientX - rect.left;
    const containerY = event.clientY - rect.top;

    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      containerX,
      containerY
    };
    activePointerIdRef.current = event.pointerId;
    hasDraggedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    dispatchDragIndicator({
      type: 'begin',
      point: { x: containerX, y: containerY }
    });
    clearMovement();
  }, [clearMovement, isPaused, stopPointer]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    stopPointer(event);

    const start = dragStartRef.current;
    const deltaX = event.clientX - start.clientX;
    const deltaY = event.clientY - start.clientY;

    if (shouldPortraitCoverPointerTravelActivate(deltaX, deltaY)) {
      hasDraggedRef.current = true;
    }

    dispatchDragIndicator({
      type: 'move',
      point: {
        x: start.containerX + deltaX,
        y: start.containerY + deltaY
      }
    });
    applyDrag(deltaX);
  }, [applyDrag, stopPointer]);

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
