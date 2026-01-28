import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: (e: React.MouseEvent) => void;
  className?: string;
}
export function VolumeControl({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onToggleMute,
  className 
}: VolumeControlProps) {
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };
  return (
    <div className={cn("flex items-center group/volume bg-black/20 backdrop-blur-md rounded-full p-1 pr-2 transition-all duration-300 hover:bg-black/40", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {getVolumeIcon()}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isMuted ? "Unmute" : "Mute"}</p>
        </TooltipContent>
      </Tooltip>
      <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out mx-0 group-hover/volume:mx-2">
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          max={100}
          step={1}
          onValueChange={(val) => {
            const newVolume = val[0] / 100;
            onVolumeChange(newVolume);
            if (isMuted && newVolume > 0) {
               // If dragging slider while muted, unmute implicitly
               // We can't directly call onToggleMute here easily without event, 
               // but the parent handles volume updates. 
               // Ideally parent should unmute if volume > 0.
            }
          }}
          className="cursor-pointer py-2"
        />
      </div>
    </div>
  );
}