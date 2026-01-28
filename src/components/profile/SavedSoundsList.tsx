import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, Play } from 'lucide-react';
import type { SavedSound } from '@shared/types';
import { Button } from '@/components/ui/button';
interface SavedSoundsListProps {
  sounds: SavedSound[];
}
export function SavedSoundsList({ sounds }: SavedSoundsListProps) {
  if (sounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Music2 className="w-8 h-8 opacity-50" />
        </div>
        <p>No saved sounds yet.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sounds.map((sound) => (
        <div key={sound.id} className="flex items-center gap-4 p-3 rounded-xl bg-card/50 border border-white/10 hover:bg-white/5 transition-colors group">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0">
            {sound.coverUrl ? (
                <img src={sound.coverUrl} alt={sound.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
                    <Music2 className="w-8 h-8 text-white/50" />
                </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{sound.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{sound.artist}</p>
          </div>
          <Button asChild size="sm" variant="ghost" className="shrink-0">
            <Link to={`/sound/${sound.id}`}>View</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}