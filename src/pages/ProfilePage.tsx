import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import type { User, Post } from '@shared/types';
import { Loader2, MapPin, Link as LinkIcon, Calendar, LogOut, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [userData, postsData] = await Promise.all([
          api<User>(`/api/users/${id}`),
          api<{ items: Post[] }>(`/api/users/${id}/posts`)
        ]);
        setUser(userData);
        setFollowerCount(userData.followers || 0);
        setPosts(postsData.items);
        // Check local storage for follow state
        const storedFollow = localStorage.getItem(`following_user_${id}`);
        if (storedFollow === 'true') {
            setIsFollowing(true);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const handleFollow = async () => {
    if (!id || !user) return;
    // Toggle state
    const newState = !isFollowing;
    setIsFollowing(newState);
    // Update count optimistically
    setFollowerCount(prev => newState ? prev + 1 : prev - 1);
    // Persist locally
    if (newState) {
        localStorage.setItem(`following_user_${id}`, 'true');
    } else {
        localStorage.removeItem(`following_user_${id}`);
    }
    // API Call (Only handling follow for now as per requirements, unfollow logic would be similar)
    if (newState) {
        try {
            await api(`/api/users/${id}/follow`, { method: 'POST' });
            toast.success(`You are now following ${user.name}`);
        } catch (error) {
            console.error('Failed to follow user:', error);
            // Revert
            setIsFollowing(false);
            setFollowerCount(prev => prev - 1);
            localStorage.removeItem(`following_user_${id}`);
            toast.error('Failed to follow user');
        }
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
  if (!user) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">User not found</h2>
            <p className="text-muted-foreground">The user you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }
  const isOwnProfile = currentUser?.id === user.id;
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="relative">
            {/* Banner */}
            <div className="h-48 md:h-64 w-full rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            {/* Profile Info */}
            <div className="px-4 md:px-8 pb-4">
              <div className="relative -mt-16 mb-4 flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                  <AvatarImage src={user.avatar} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-purple-900 text-white">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 pt-2 md:pt-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        {user.name}
                        <span className="text-blue-400 text-base">��</span>
                      </h1>
                      <p className="text-muted-foreground">@{user.name.toLowerCase().replace(/\s/g, '')}</p>
                    </div>
                    <div className="flex gap-3">
                      {isOwnProfile ? (
                        <>
                          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                            <Edit className="w-4 h-4" />
                            Edit Profile
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 gap-2"
                            onClick={logout}
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            className={isFollowing ? "bg-secondary text-white hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"}
                            onClick={handleFollow}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </Button>
                          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Bio & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-base text-white/90 leading-relaxed max-w-2xl">
                    {user.bio || "No bio yet."}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Cyber City, Net</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a href="#" className="text-primary hover:underline">pulse.so/{user.name}</a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined March 2025</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-start md:justify-end gap-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{followerCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{user.following?.toLocaleString() ?? 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{(posts.length * 124).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Content Tabs */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0 mb-6">
              <TabsTrigger 
                value="videos" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 text-base"
              >
                Videos
              </TabsTrigger>
              <TabsTrigger 
                value="liked" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3 text-base"
              >
                Liked
              </TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="mt-0">
              <VideoGrid posts={posts} />
            </TabsContent>
            <TabsContent value="liked" className="mt-0">
              <div className="py-20 text-center text-muted-foreground">
                <p>Liked videos are private.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}