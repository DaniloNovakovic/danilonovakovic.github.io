import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { TEXTS } from '../config/content';

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const cursorRef = useRef({ x: 0, y: 0 });
  const isKeyboardDrawingRef = useRef(false);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isKeyboardDrawing, setIsKeyboardDrawing] = useState(false);
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);

  useLayoutEffect(() => {
    cursorRef.current = cursorPos;
  }, [cursorPos]);
  useLayoutEffect(() => {
    isKeyboardDrawingRef.current = isKeyboardDrawing;
  }, [isKeyboardDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        setContext(ctx);

        const cx = rect.width / 2;
        const cy = rect.height / 2;
        cursorRef.current = { x: cx, y: cy };
        setCursorPos({ x: cx, y: cy });
      }
    }
  }, []);

  useEffect(() => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = context;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 5;
      const pos = cursorRef.current;
      let newX = pos.x;
      let newY = pos.y;
      let moved = false;
      const dpr = window.devicePixelRatio || 1;
      const maxX = canvas.width / dpr;
      const maxY = canvas.height / dpr;

      switch (e.key) {
        case 'ArrowUp':
          newY = Math.max(0, pos.y - step);
          moved = true;
          break;
        case 'ArrowDown':
          newY = Math.min(maxY, pos.y + step);
          moved = true;
          break;
        case 'ArrowLeft':
          newX = Math.max(0, pos.x - step);
          moved = true;
          break;
        case 'ArrowRight':
          newX = Math.min(maxX, pos.x + step);
          moved = true;
          break;
        case ' ':
          e.preventDefault();
          {
            const drawing = isKeyboardDrawingRef.current;
            isKeyboardDrawingRef.current = !drawing;
            setIsKeyboardDrawing(!drawing);
            if (!drawing) {
              ctx.beginPath();
              ctx.moveTo(pos.x, pos.y);
            } else {
              ctx.closePath();
            }
          }
          return;
        default:
          break;
      }

      if (moved) {
        setIsUsingKeyboard(true);
        if (isKeyboardDrawingRef.current) {
          ctx.lineTo(newX, newY);
          ctx.stroke();
        }
        cursorRef.current = { x: newX, y: newY };
        setCursorPos({ x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [context]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    setIsUsingKeyboard(false);
    
    // Prevent scrolling on touch
    if (e.type === 'touchstart') {
        e.preventDefault();
    }

    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    cursorRef.current = { x: offsetX, y: offsetY };
    setCursorPos({ x: offsetX, y: offsetY });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    if (e.type === 'touchmove') {
        e.preventDefault();
    }

    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
    cursorRef.current = { x: offsetX, y: offsetY };
    setCursorPos({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    if ('touches' in event) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY
      };
    }
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] overflow-hidden group">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Phase 4: Virtual Cursor Indicator */}
        {isUsingKeyboard && (
          <div 
            className={`absolute pointer-events-none w-4 h-4 border-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-colors duration-100 ${isKeyboardDrawing ? 'bg-red-500 border-black' : 'bg-transparent border-blue-500'}`}
            style={{ left: cursorPos.x, top: cursorPos.y }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-black rounded-full" />
          </div>
        )}
        
        {/* Subtle decorative corners to look like a canvas/sketchbook page */}
        <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-[#1a1a1a] opacity-30"></div>
      </div>
      
      <div className="mt-4 flex justify-between w-full items-center">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#1a1a1a] opacity-60">
            {TEXTS.miniGames.drawing.instruction}
          </span>
          <span className="text-[10px] font-mono opacity-40">
            [Arrows to move • Space to draw • Shift to speed up]
          </span>
        </div>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-[#f4f1ea] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 font-bold"
        >
          <Trash2 size={16} />
          {TEXTS.miniGames.drawing.erase}
        </button>
      </div>
    </div>
  );
}

