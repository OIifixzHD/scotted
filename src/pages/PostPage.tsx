import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCard } from '@/components/feed/VideoCard';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Post } from '@shared/types';
import { useAudioSettings } from '@/hooks/use-audio-settings';
export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isMuted, volume, toggleMute, setVolume } = useAudioSettings();
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await api<Post>(`/api/posts/${id}`);
        setPost(data);
      } catch (err) {
        console.error(err);
        setError('Post not found or has been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);
  const handleBack = () => {
    // If history exists, go back, otherwise go home
    if (window.history.length > 2) {
        navigate(-1);
    } else {
        navigate('/');
    }
  };
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Content Unavailable</h2>
        <p className="text-muted-foreground">{error || "This pulse doesn't exist."}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
        </Button>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 h-full flex flex-col">
      <div className="mb-6">
        <Button
            variant="ghost"
            onClick={handleBack}
            className="text-muted-foreground hover:text-white pl-0 hover:bg-transparent"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-md h-full max-h-[80vh] aspect-[9/16]">
            <VideoCard
                post={post}
                isActive={true}
                isMuted={isMuted}
                volume={volume}
                toggleMute={toggleMute}
                onVolumeChange={setVolume}
                autoplayEnabled={true}
                onDelete={() => navigate('/')}
                onUpdate={(updated) => setPost(updated)}
            />
        </div>
      </div>
    </div>
  );
}