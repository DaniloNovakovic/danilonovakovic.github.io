import {
  useCallback,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent
} from 'react';
import { INITIAL_MODEL_VIEW } from '../constants';
import type { RidgeViewerRoom } from '../model';
import {
  clampModelZoom,
  fitRoomToViewport,
  getWorldTransform,
  roundForTransform
} from '../modelViewport';
import type { ModelViewport } from '../types';

export function useModelViewport(rooms: readonly RidgeViewerRoom[]) {
  const [view, setView] = useState<ModelViewport>(INITIAL_MODEL_VIEW);
  const viewRef = useRef(INITIAL_MODEL_VIEW);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const worldRef = useRef<SVGGElement>(null);

  const setModelView = useCallback((nextView: ModelViewport) => {
    viewRef.current = nextView;
    worldRef.current?.setAttribute('transform', getWorldTransform(nextView));
    setView(nextView);
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    setView((current) => {
      const nextView = { ...current, zoom: clampModelZoom(current.zoom + delta) };
      viewRef.current = nextView;
      return nextView;
    });
  }, []);

  const resetView = useCallback(() => {
    setModelView(INITIAL_MODEL_VIEW);
  }, [setModelView]);

  const focusRoom = useCallback((roomId: string) => {
    const room = rooms.find((candidate) => candidate.id === roomId);
    if (!room) return;

    setModelView(fitRoomToViewport({
      room,
      viewportHeight: svgRef.current?.clientHeight || 700,
      viewportWidth: svgRef.current?.clientWidth || 1000
    }));
  }, [rooms, setModelView]);

  const handleWheel = useCallback((event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? 0.02 : -0.02);
  }, [adjustZoom]);

  const handlePointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<SVGSVGElement>) => {
    if (!dragStartRef.current) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    const nextView = {
      ...viewRef.current,
      panX: roundForTransform(viewRef.current.panX + dx),
      panY: roundForTransform(viewRef.current.panY + dy)
    };
    viewRef.current = nextView;
    worldRef.current?.setAttribute('transform', getWorldTransform(nextView));
  }, []);

  const stopDragging = useCallback(() => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setView(viewRef.current);
  }, []);

  return {
    adjustZoom,
    focusRoom,
    handlePointerDown,
    handlePointerMove,
    handleWheel,
    resetView,
    stopDragging,
    svgRef,
    transform: getWorldTransform(view),
    view,
    worldRef
  };
}
