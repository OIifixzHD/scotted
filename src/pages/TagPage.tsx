import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { VideoModal } from '@/components/feed/VideoModal';
import { GlitchText } from '@/components/ui/glitch-text';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Hash, Share2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Post } from '@shared/types';
import { toast } from 'sonner';
export function TagPage() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  // Video Modal State
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  useEffect(() => {
    const fetchTagData = async () => {
      if (!tagName) return;
      setLoading(true);
      try {
        const decodedTag = decodeURIComponent(tagName);
        const res = await api<{ tagName: string, count: number, posts: Post[] }>(`/api/tags/${encodeURIComponent(decodedTag)}`);
        setPosts(res.posts);
        setCount(res.count);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load tag data");
      } finally {
        setLoading(false);
      }
    };
    fetchTagData();
  }, [tagName]);
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };
  const handleVideoClick = (post: Post) => {
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
  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };
  const handlePostDelete = () => {
    if (selectedVideoIndex === null) return;
    const newPosts = posts.filter((_, i) => i !== selectedVideoIndex);
    setPosts(newPosts);
    if (newPosts.length === 0) {
        setIsVideoModalOpen(false);
        setSelectedVideoIndex(null);
    } else if (selectedVideoIndex >= newPosts.length) {
        setSelectedVideoIndex(newPosts.length - 1);
    }
  };
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-white pl-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} className="border-white/10 hover:bg-white/5">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow">
                <Hash className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-bold font-display">
                  <GlitchText text={`#${tagName}`} />
                </h1>
                <p className="text-muted-foreground text-lg">
                  {count} {count === 1 ? 'pulse' : 'pulses'}
                </p>
              </div>
            </div>
          </div>
          {/* Content */}
          {posts.length > 0 ? (
            <VideoGrid posts={posts} onVideoClick={handleVideoClick} />
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>No pulses found for this tag yet.</p>
            </div>
          )}
        </div>
      </div>
      <VideoModal
        post={selectedVideoIndex !== null ? posts[selectedVideoIndex] : null}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideoIndex !== null && selectedVideoIndex < posts.length - 1}
        hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
        onUpdate={handlePostUpdate}
        onDelete={handlePostDelete}
      />
    </div>
  );
}