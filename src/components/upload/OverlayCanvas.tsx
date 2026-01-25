import React, { useRef, useState, useEffect } from 'react';
import { TextOverlay } from '@shared/types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
interface OverlayCanvasProps {
  overlays: TextOverlay[];
  onChange?: (overlays: TextOverlay[]) => void;
  readOnly?: boolean;
  activeId?: string | null;
  onSelect?: (id: string | null) => void;
}
export function OverlayCanvas({
  overlays,
  onChange,
  readOnly = false,
  activeId,
  onSelect
}: OverlayCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const handlePointerDown = (e: React.PointerEvent, overlay: TextOverlay) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(overlay.id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: overlay.x, y: overlay.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !activeId || readOnly || !containerRef.current) return;
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    // Convert delta pixels to percentage
    const deltaXPercent = (deltaX / containerRect.width) * 100;
    const deltaYPercent = (deltaY / containerRect.height) * 100;
    const newX = Math.max(0, Math.min(100, initialPos.x + deltaXPercent));
    const newY = Math.max(0, Math.min(100, initialPos.y + deltaYPercent));
    const updatedOverlays = overlays.map(o => 
      o.id === activeId ? { ...o, x: newX, y: newY } : o
    );
    onChange?.(updatedOverlays);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedOverlays = overlays.filter(o => o.id !== id);
    onChange?.(updatedOverlays);
    if (activeId === id) {
      onSelect?.(null);
    }
  };
  // Deselect when clicking background
  const handleBackgroundClick = () => {
    if (!readOnly) {
      onSelect?.(null);
    }
  };
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-20 overflow-hidden"
      onClick={handleBackgroundClick}
    >
      {overlays.map((overlay) => (
        <div
          key={overlay.id}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none touch-none",
            !readOnly && activeId === overlay.id && "z-30",
            readOnly && "pointer-events-none"
          )}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
          }}
          onPointerDown={(e) => handlePointerDown(e, overlay)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className={cn(
            "relative px-4 py-2 rounded-lg transition-all duration-200",
            !readOnly && activeId === overlay.id 
              ? "border-2 border-primary bg-black/40 backdrop-blur-sm" 
              : "border-2 border-transparent"
          )}>
            <p 
              className={cn(
                "text-xl font-bold whitespace-nowrap text-shadow-lg",
                overlay.style === 'neon' && "drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]",
                overlay.style === 'bold' && "font-black tracking-tighter",
                overlay.style === 'italic' && "italic font-serif"
              )}
              style={{ color: overlay.color }}
            >
              {overlay.text}
            </p>
            {!readOnly && activeId === overlay.id && (
              <button
                onClick={(e) => handleDelete(e, overlay.id)}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}