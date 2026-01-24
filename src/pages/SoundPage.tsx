import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import type { Post } from '@shared/types';
import { Loader2, Music2, Play, Plus } from 'lucide-react';
import { VideoModal } from '@/components/feed/VideoModal';
interface SoundDetails {
  id: string;
  name: string;
  playCount: number;
  artist: string;
}
export function SoundPage() {
  const { id } = useParams<{ id: string }>();
  const [sound, setSound] = useState<SoundDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Post | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  useEffect(() => {
    const fetchSoundData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api<{ sound: SoundDetails, posts: Post[] }>(`/api/sounds/${id}`);
        setSound(res.sound);
        setPosts(res.posts);
      } catch (error) {
        console.error('Failed to fetch sound details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSoundData();
  }, [id]);
  const handleVideoClick = (post: Post) => {
    setSelectedVideo(post);
    setIsVideoModalOpen(true);
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
          {/* Sound Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            {/* Album Art / Icon */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-400 flex items-center justify-center shadow-glow animate-pulse-slow">
                <Music2 className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                  {sound.name}
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
                <Button variant="outline" className="border-white/10 hover:bg-white/5">
                  Add to Favorites
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
        post={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
}