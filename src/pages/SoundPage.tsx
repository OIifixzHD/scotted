import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { Post, User } from '@shared/types';
import { Loader2, Music2, Play, Pause, Plus, Volume2, Bookmark, Check } from 'lucide-react';
import { VideoModal } from '@/components/feed/VideoModal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
interface SoundDetails {
  id: string;
  name: string;
  playCount: number;
  artist: string;
}
export function SoundPage() {
  const { id } = useParams<{ id: string }>();
  const { user, login } = useAuth();
  const [sound, setSound] = useState<SoundDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>('');
  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Video Modal State
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  useEffect(() => {
    const fetchSoundData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api<{ sound: SoundDetails, posts: Post[] }>(`/api/sounds/${id}`);
        setSound(res.sound);
        setPosts(res.posts);
        // Determine audio source
        // 1. Try to find an audio post with this sound
        const audioPost = res.posts.find(p => p.type === 'audio' && p.audioUrl);
        if (audioPost) {
            setAudioSrc(audioPost.audioUrl!);
        } else {
            // 2. Fallback to a video post
            const videoPost = res.posts.find(p => p.videoUrl);
            if (videoPost) {
                setAudioSrc(videoPost.videoUrl!);
            }
        }
      } catch (error) {
        console.error('Failed to fetch sound details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSoundData();
  }, [id]);
  // Check if favorite
  useEffect(() => {
    if (user && sound) {
        setIsFavorite(user.savedSounds?.some(s => s.id === sound.id) || false);
    }
  }, [user, sound]);
  // Cleanup audio on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);
  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) {
        if (!audioSrc) toast.error("No audio source available for this sound");
        return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
      setIsPlaying(true);
    }
  };
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
    }
  };
  const handleVideoClick = (post: Post) => {
    // Pause audio if playing when opening a video
    if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    const index = posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
        setSelectedVideoIndex(index);
        setIsVideoModalOpen(true);
    }
  };
  const handleNext = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex < posts.length - 1) {
        setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };
  const handlePrev = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
        setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };
  const handleToggleFavorite = async () => {
    if (!user) {
        toast.error("Please log in to save sounds");
        return;
    }
    if (!sound) return;
    // Infer cover url from first post or default
    const coverUrl = posts.length > 0
        ? (posts[0].coverArtUrl || posts[0].user?.avatar)
        : undefined;
    const soundData = {
        id: sound.id,
        name: sound.name,
        artist: sound.artist,
        coverUrl
    };
    try {
        // Optimistic update
        setIsFavorite(!isFavorite);
        const updatedUser = await api<User>('/api/sounds/favorite', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, sound: soundData })
        });
        login(updatedUser); // Update context
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (e) {
        console.error(e);
        setIsFavorite(!isFavorite); // Revert
        toast.error("Failed to update favorites");
    }
  };
  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  if (!sound) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Sound not found</h2>
            <p className="text-muted-foreground">The audio track you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8">
          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioSrc}
            onEnded={handleAudioEnded}
          />
          {/* Sound Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Album Art / Icon */}
            <div
                className="relative group cursor-pointer"
                onClick={togglePlay}
            >
              <div className={cn(
                  "w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-400 flex items-center justify-center shadow-glow transition-all duration-500",
                  isPlaying ? "animate-pulse-slow scale-105" : "hover:scale-105"
              )}>
                {isPlaying ? (
                    <Volume2 className="w-16 h-16 text-white animate-pulse" />
                ) : (
                    <Music2 className="w-16 h-16 text-white" />
                )}
              </div>
              {/* Play/Pause Overlay */}
              <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    {isPlaying ? (
                        <Pause className="w-6 h-6 text-white fill-white" />
                    ) : (
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    )}
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2 flex items-center justify-center md:justify-start gap-3">
                  {sound.name}
                  {isPlaying && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                  )}
                </h1>
                <p className="text-xl text-muted-foreground">{sound.artist}</p>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">{posts.length}</span>
                  <span>videos</span>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full hidden md:block" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">{(sound.playCount / 1000000).toFixed(1)}M</span>
                  <span>plays</span>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-glow gap-2">
                  <Link to={`/upload?soundId=${sound.id}&soundName=${encodeURIComponent(sound.name)}`}>
                    <Plus className="w-4 h-4" />
                    Use this Sound
                  </Link>
                </Button>
                <Button
                    variant={isFavorite ? "default" : "outline"}
                    className={cn("gap-2", isFavorite ? "bg-secondary text-white hover:bg-secondary/80" : "border-white/10 hover:bg-white/5")}
                    onClick={handleToggleFavorite}
                >
                    {isFavorite ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {isFavorite ? "Saved" : "Add to Favorites"}
                </Button>
              </div>
            </div>
          </div>
          {/* Videos Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Videos using this sound</h2>
            <VideoGrid posts={posts} onVideoClick={handleVideoClick} />
          </div>
        </div>
      </div>
      {/* Video Modal */}
      <VideoModal
        post={selectedVideoIndex !== null ? posts[selectedVideoIndex] : null}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideoIndex !== null && selectedVideoIndex < posts.length - 1}
        hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
      />
    </div>
  );
}