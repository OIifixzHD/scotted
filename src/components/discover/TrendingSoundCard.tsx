import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
interface TrendingSound {
  id: string;
  name: string;
  count: number;
}
interface TrendingSoundCardProps {
  sound: TrendingSound;
  index: number;
}
export function TrendingSoundCard({ sound, index }: TrendingSoundCardProps) {
  // Generate a deterministic gradient based on sound ID
  const gradients = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
  ];
  const gradient = gradients[sound.id.charCodeAt(0) % gradients.length];
  return (
    <Link
      to={`/sound/${sound.id}`}
      className="group relative flex-shrink-0 w-40 flex flex-col gap-2 transition-transform hover:scale-105"
    >
      <div className={cn(
        "w-40 h-40 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg relative overflow-hidden",
        gradient
      )}>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        {/* Icon */}
        <Music2 className="w-12 h-12 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Rank Badge */}
        <div className="absolute top-2 left-2 w-6 h-6 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10">
          #{index + 1}
        </div>
      </div>
      <div className="space-y-0.5 px-1">
        <h3 className="font-semibold text-white text-sm truncate" title={sound.name}>
          {sound.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {sound.count} videos
        </p>
      </div>
    </Link>
  );
}