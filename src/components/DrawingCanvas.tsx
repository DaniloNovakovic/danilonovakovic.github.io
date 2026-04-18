import React, { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Fix DPI blurriness
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
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;
    
    // Prevent scrolling on touch
    if (e.type === 'touchstart') {
        e.preventDefault();
    }

    const { offsetX, offsetY } = getCoordinates(e);
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    
    if (e.type === 'touchmove') {
        e.preventDefault();
    }

    const { offsetX, offsetY } = getCoordinates(e);
    context.lineTo(offsetX, offsetY);
    context.stroke();
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
        
        {/* Subtle decorative corners to look like a canvas/sketchbook page */}
        <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-[#1a1a1a] opacity-30"></div>
      </div>
      
      <div className="mt-4 flex justify-between w-full items-center">
        <span className="text-sm font-bold text-[#1a1a1a] opacity-60">
          Try it! Doodle something.
        </span>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-[#f4f1ea] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 font-bold"
        >
          <Trash2 size={16} />
          Erase All
        </button>
      </div>
    </div>
  );
}
