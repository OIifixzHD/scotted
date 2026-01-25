import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import type { Post, User } from '@shared/types';
import { Search, TrendingUp, Hash, Loader2, User as UserIcon, Sparkles } from 'lucide-react';
import { VideoModal } from '@/components/feed/VideoModal';
import { useAuth } from '@/context/AuthContext';
import { SuggestedUserCard } from '@/components/discover/SuggestedUserCard';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';
export function DiscoverPage() {
  const { user: currentUser, login } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<{ users: User[], posts: Post[] }>({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  // Video Modal State
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [activeListType, setActiveListType] = useState<'trending' | 'search'>('trending');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  // Sync URL with debounced query
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, setSearchParams]);
  // Fetch Trending & Suggestions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const promises: Promise<any>[] = [
          api<{ items: Post[] }>('/api/feed/trending')
        ];
        // Fetch suggestions if logged in, or generic ones if not
        const userIdParam = currentUser ? `?userId=${currentUser.id}` : '';
        promises.push(api<User[]>(`/api/users/suggested${userIdParam}`));
        const [trendingRes, suggestedRes] = await Promise.all(promises);
        setTrendingPosts(trendingRes.items);
        setSuggestedUsers(suggestedRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [currentUser]); // Re-fetch if user changes (e.g. login)
  // Perform Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) return;
    const performSearch = async () => {
      try {
        setSearching(true);
        const res = await api<{ users: User[], posts: Post[] }>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        setSearchResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    };
    performSearch();
  }, [debouncedQuery]);
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };
  const handleVideoClick = (post: Post, type: 'trending' | 'search') => {
    const list = type === 'trending' ? trendingPosts : searchResults.posts;
    const index = list.findIndex(p => p.id === post.id);
    if (index !== -1) {
        setActiveListType(type);
        setSelectedVideoIndex(index);
        setIsVideoModalOpen(true);
    }
  };
  const handleNext = () => {
    const list = activeListType === 'trending' ? trendingPosts : searchResults.posts;
    if (selectedVideoIndex !== null && selectedVideoIndex < list.length - 1) {
        setSelectedVideoIndex(selectedVideoIndex + 1);
    }
  };
  const handlePrev = () => {
    if (selectedVideoIndex !== null && selectedVideoIndex > 0) {
        setSelectedVideoIndex(selectedVideoIndex - 1);
    }
  };
  const handleFollowUser = async (targetId: string) => {
    if (!currentUser) {
      toast.error("Please log in to follow users");
      return;
    }
    try {
      // Call API
      const updatedCurrentUser = await api<User>(`/api/users/${targetId}/follow`, {
        method: 'POST',
        body: JSON.stringify({ currentUserId: currentUser.id })
      });
      // Update auth context
      login(updatedCurrentUser);
      // Remove from suggestions list
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetId));
      toast.success("Followed successfully");
    } catch (error) {
      console.error("Failed to follow:", error);
      toast.error("Failed to follow user");
    }
  };
  const activeList = activeListType === 'trending' ? trendingPosts : searchResults.posts;
  const selectedVideo = selectedVideoIndex !== null ? activeList[selectedVideoIndex] : null;
  const trendingHashtags = [
    'cyberpunk', 'neon', 'nightcity', 'future', 'tech', 'vibes', 'coding', 'ai'
  ];
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8 min-h-[80vh]">
          {/* Search Header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts, videos, or hashtags..."
                className="pl-10 bg-secondary/50 border-white/10 h-12 rounded-xl focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
              )}
            </div>
          </div>
          {!debouncedQuery ? (
            /* Trending View */
            <>
              {/* Suggested Users (Who to Follow) */}
              {suggestedUsers.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <h2 className="font-bold text-lg">Who to Follow</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                    <AnimatePresence mode="popLayout">
                      {suggestedUsers.map(user => (
                        <SuggestedUserCard
                          key={user.id}
                          user={user}
                          onFollow={handleFollowUser}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
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
                      onClick={() => handleTagClick(tag)}
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* Trending Grid */}
              <div className="space-y-4">
                <h2 className="font-bold text-lg">Popular Videos</h2>
                {loading ? (
                  <GridSkeleton count={8} />
                ) : (
                  <VideoGrid posts={trendingPosts} onVideoClick={(p) => handleVideoClick(p, 'trending')} />
                )}
              </div>
            </>
          ) : (
            /* Search Results View */
            <div className="space-y-8 animate-fade-in">
              {/* Users Section */}
              {searchResults.users.length > 0 && (
                  <div className="space-y-4">
                      <h2 className="font-bold text-lg flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-primary" />
                          People
                      </h2>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                          {searchResults.users.map(user => (
                              <Link key={user.id} to={`/profile/${user.id}`} className="flex flex-col items-center gap-2 min-w-[80px] group">
                                  <Avatar className="w-16 h-16 border-2 border-transparent group-hover:border-primary transition-all">
                                      <AvatarImage src={user.avatar} />
                                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-center truncate w-full group-hover:text-primary transition-colors">
                                      {user.name}
                                  </span>
                              </Link>
                          ))}
                      </div>
                  </div>
              )}
              {/* Videos Section */}
              <div className="space-y-4">
                  <h2 className="font-bold text-lg">Videos</h2>
                  {searching ? (
                    <GridSkeleton count={4} />
                  ) : searchResults.posts.length > 0 ? (
                      <VideoGrid posts={searchResults.posts} onVideoClick={(p) => handleVideoClick(p, 'search')} />
                  ) : (
                      !searching && searchResults.users.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                              <p>No results found for "{debouncedQuery}"</p>
                          </div>
                      )
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Video Modal */}
      <VideoModal
        post={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideoIndex !== null && selectedVideoIndex < activeList.length - 1}
        hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
      />
    </div>
  );
}