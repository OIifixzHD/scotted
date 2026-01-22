import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import type { Post } from '@shared/types';
import { Search, TrendingUp, Hash } from 'lucide-react';
export function DiscoverPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await api<{ items: Post[] }>('/api/feed');
        setPosts(response.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);
  const trendingHashtags = [
    'cyberpunk', 'neon', 'nightcity', 'future', 'tech', 'vibes', 'coding', 'ai'
  ];
  return (
    <AppLayout container>
      <div className="space-y-8">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search accounts, videos, or hashtags..." 
              className="pl-10 bg-secondary/50 border-white/10 h-12 rounded-xl"
            />
          </div>
        </div>
        {/* Trending Tags */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-bold text-lg">Trending Now</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-white transition-colors"
              >
                <Hash className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {/* Content Grid */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Explore</h2>
          <VideoGrid posts={posts} />
        </div>
      </div>
    </AppLayout>
  );
}