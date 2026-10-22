import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

export type DoodleTool = 'thin' | 'thick' | 'eraser';

const DOODLE_TOOLS: Record<DoodleTool, { width: number; erase: boolean }> = {
  thin: { width: 3, erase: false },
  thick: { width: 9, erase: false },
  eraser: { width: 24, erase: true }
};

interface Point {
  x: number;
  y: number;
}

const KEY_STEP = 5;
const KEY_STEP_FAST = 12;

const ARROW_DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }
};

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

function pointerPoint(event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/**
 * Doodle canvas state: hi-dpi setup, pen/marker/eraser tools, pointer drawing
 * (mouse, touch, pen) and keyboard drawing (arrows move, Space toggles the pen).
 */
export function useDoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const lastPointRef = useRef<Point | null>(null);
  const toolRef = useRef<DoodleTool>('thin');
  const penDownRef = useRef(false);
  const cursorRef = useRef<Point>({ x: 0, y: 0 });

  const [tool, setToolState] = useState<DoodleTool>('thin');
  const [keyboardCursor, setKeyboardCursor] = useState<{ point: Point; penDown: boolean } | null>(null);

  useEffect(function initializeDoodleCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1a1a1a';
    contextRef.current = context;
    sizeRef.current = { width: rect.width, height: rect.height };
    cursorRef.current = { x: rect.width / 2, y: rect.height / 2 };
  }, []);

  const strokeSegment = useCallback((from: Point, to: Point) => {
    const context = contextRef.current;
    if (!context) return;
    const spec = DOODLE_TOOLS[toolRef.current];
    context.globalCompositeOperation = spec.erase ? 'destination-out' : 'source-over';
    context.lineWidth = spec.width;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }, []);

  const setTool = useCallback((next: DoodleTool) => {
    toolRef.current = next;
    setToolState(next);
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPoint(event);
    lastPointRef.current = point;
    strokeSegment(point, point);
    setKeyboardCursor(null);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const last = lastPointRef.current;
    if (!last) return;
    const point = pointerPoint(event);
    strokeSegment(last, point);
    lastPointRef.current = point;
  };

  const onPointerEnd = () => {
    lastPointRef.current = null;
  };

  const moveKeyboardCursor = (key: string, fast: boolean) => {
    const direction = ARROW_DIRECTIONS[key];
    if (!direction || !contextRef.current) return;
    const step = fast ? KEY_STEP_FAST : KEY_STEP;
    const from = cursorRef.current;
    const to = {
      x: clamp(from.x + direction.x * step, sizeRef.current.width),
      y: clamp(from.y + direction.y * step, sizeRef.current.height)
    };
    if (penDownRef.current) strokeSegment(from, to);
    cursorRef.current = to;
    setKeyboardCursor({ point: to, penDown: penDownRef.current });
  };

  const toggleKeyboardPen = () => {
    if (!contextRef.current) return;
    penDownRef.current = !penDownRef.current;
    const point = cursorRef.current;
    if (penDownRef.current) strokeSegment(point, point);
    setKeyboardCursor({ point, penDown: penDownRef.current });
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }, []);

  return {
    canvasRef,
    tool,
    setTool,
    keyboardCursor,
    clear,
    moveKeyboardCursor,
    toggleKeyboardPen,
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd
    }
  };
}
