import React, { useState, useRef } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Check, X, RotateCcw } from "lucide-react";
interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}
export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState([1]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const handleReset = () => {
    setZoom([1]);
    setPosition({ x: 0, y: 0 });
  };
  const handleSave = () => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container) return;
    const canvas = document.createElement('canvas');
    // Output size (400x400 for high quality avatar)
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Calculate scale factor between visible container and output canvas
    const containerRect = container.getBoundingClientRect();
    const viewportSize = containerRect.width; 
    const scaleFactor = size / viewportSize;
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    // Move to center of canvas
    ctx.translate(size / 2, size / 2);
    // Apply user transforms (position and zoom)
    // Position needs to be scaled up to canvas size
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);
    ctx.scale(zoom[0], zoom[0]);
    // Calculate base scale (object-fit: cover equivalent)
    const widthRatio = viewportSize / image.naturalWidth;
    const heightRatio = viewportSize / image.naturalHeight;
    const baseScale = Math.max(widthRatio, heightRatio);
    // Draw image centered relative to the transformed origin
    ctx.translate(-image.naturalWidth / 2 * baseScale, -image.naturalHeight / 2 * baseScale);
    ctx.drawImage(
        image, 
        0, 
        0, 
        image.naturalWidth, 
        image.naturalHeight, 
        0, 
        0, 
        image.naturalWidth * baseScale, 
        image.naturalHeight * baseScale
    );
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(base64);
  };
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in w-full">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-black cursor-move touch-none group shrink-0">
        <div 
            ref={containerRef}
            className="w-full h-full flex items-center justify-center"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                className="max-w-none select-none pointer-events-none transition-transform duration-75 ease-linear will-change-transform"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom[0]})`,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover' 
                }}
            />
        </div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50"></div>
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50"></div>
        </div>
      </div>
      <div className="w-full max-w-xs space-y-4 px-4">
        <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onValueChange={setZoom}
                className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onCancel} className="w-full border-white/10 hover:bg-white/5">
                <X className="w-4 h-4 mr-2" />
                Cancel
            </Button>
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">
                <Check className="w-4 h-4 mr-2" />
                Apply
            </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-xs text-muted-foreground hover:text-white">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset Transform
        </Button>
      </div>
    </div>
  );
}