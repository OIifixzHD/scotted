import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { VideoGrid } from '@/components/feed/VideoGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from '@/lib/api-client';
import type { User, Post } from '@shared/types';
import { Loader2, MapPin, Link as LinkIcon, Calendar, LogOut, Edit, Settings, MoreVertical, Ban, Flag, Share2, MessageCircle, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ReportDialog } from '@/components/profile/ReportDialog';
import { cn, getDecorationClass, getBannerStyle } from '@/lib/utils';
import { getBadgeIcon } from '@/components/ui/badge-icons';
import { VideoModal } from '@/components/feed/VideoModal';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { ProfileShareDialog } from '@/components/profile/ProfileShareDialog';
export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout, login } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  // Video Modal State
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
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
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  // Determine if following based on currentUser's followingIds
  const isFollowing = currentUser?.followingIds?.includes(user?.id || '') || false;
  const isBlocked = currentUser?.blockedUserIds?.includes(user?.id || '') || false;
  const isOwnProfile = currentUser?.id === user?.id;
  // Privacy Check
  const isPrivate = user?.settings?.privacy?.privateAccount;
  const canViewContent = isOwnProfile || !isPrivate || isFollowing || user?.isAdmin;
  const handleFollow = async () => {
    if (!id || !user || !currentUser) {
        if (!currentUser) toast.error("Please log in to follow");
        return;
    }
    try {
        setIsFollowLoading(true);
        // Optimistic update
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
        const updatedCurrentUser = await api<User>(`/api/users/${id}/follow`, {
            method: 'POST',
            body: JSON.stringify({ currentUserId: currentUser.id })
        });
        // Update global context with new followingIds
        login(updatedCurrentUser);
        toast.success(isFollowing ? `Unfollowed ${user.name}` : `Following ${user.name}`);
    } catch (error) {
        console.error('Failed to follow user:', error);
        // Revert optimistic update
        setFollowerCount(prev => isFollowing ? prev + 1 : prev - 1);
        toast.error('Failed to update follow status');
    } finally {
        setIsFollowLoading(false);
    }
  };
  const handleMessage = async () => {
    if (!currentUser) {
      toast.error("Please log in to message");
      return;
    }
    if (!user) return;
    try {
      setIsMessageLoading(true);
      const res = await api<{ id: string }>('/api/chats/direct', {
        method: 'POST',
        body: JSON.stringify({
          currentUserId: currentUser.id,
          targetUserId: user.id
        })
      });
      navigate(`/inbox?chatId=${res.id}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
      toast.error('Failed to start chat');
    } finally {
      setIsMessageLoading(false);
    }
  };
  const handleBlock = async () => {
    if (!id || !currentUser) return;
    try {
      const res = await api<{ blocked: boolean }>(`/api/users/${id}/block`, {
        method: 'POST',
        body: JSON.stringify({ currentUserId: currentUser.id })
      });
      toast.success(res.blocked ? 'User blocked' : 'User unblocked');
    } catch (error) {
      toast.error('Failed to update block status');
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
    return <ProfileSkeleton />;
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
  if (user.bannedUntil && user.bannedUntil > Date.now()) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
              <Ban className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Account Suspended</h2>
            <p className="text-muted-foreground max-w-md">
              This account has been suspended for violating our community guidelines.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const handle = user.name.toLowerCase().replace(/\s/g, '');
  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-10 lg:py-12">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="relative">
            {/* Banner */}
            <div className={cn(
              "w-full overflow-hidden relative transition-all duration-500",
              "h-32 md:h-64 md:rounded-2xl",
              getBannerStyle(user.bannerStyle)
            )}>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse pointer-events-none"></div>
            </div>
            {/* Profile Info */}
            <div className="px-4 md:px-8 pb-4">
              <div className="relative -mt-12 md:-mt-16 mb-4 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 text-center md:text-left">
                <div className={cn("rounded-full transition-all duration-300 shrink-0", getDecorationClass(user.avatarDecoration))}>
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-purple-900 text-white">
                      {user.displayName?.substring(0, 2).toUpperCase() || user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-2 pt-2 md:pt-0 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                        {user.displayName || user.name}
                        {getBadgeIcon(user.badge, "w-5 h-5 md:w-6 md:h-6")}
                      </h1>
                      <p className="text-muted-foreground">@{handle}</p>
                    </div>
                    <div className="flex gap-3 justify-center md:justify-start w-full md:w-auto">
                      {isOwnProfile ? (
                        <>
                          <Button
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5 gap-2 flex-1 md:flex-none"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            <Edit className="w-4 h-4" />
                            <span className="md:hidden">Edit</span>
                            <span className="hidden md:inline">Edit Profile</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5 gap-2"
                            asChild
                          >
                            <Link to="/settings">
                              <Settings className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 gap-2"
                            onClick={logout}
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            className={cn(
                              "flex-1 md:flex-none",
                              isFollowing ? "bg-secondary text-white hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={handleFollow}
                            disabled={isFollowLoading}
                          >
                            {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/5 gap-2 flex-1 md:flex-none"
                            onClick={handleMessage}
                            disabled={isMessageLoading}
                          >
                            {isMessageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                            Message
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="border border-white/10 text-white hover:bg-white/5"
                            onClick={() => setIsShareDialogOpen(true)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="border border-white/10 text-white hover:bg-white/5">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-white/10">
                              <DropdownMenuItem onClick={handleBlock} className="text-red-400 focus:text-red-400">
                                <Ban className="mr-2 h-4 w-4" /> {isBlocked ? 'Unblock' : 'Block'} User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)} className="text-yellow-400 focus:text-yellow-400">
                                <Flag className="mr-2 h-4 w-4" /> Report User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border border-white/10 text-white hover:bg-white/5"
                          onClick={() => setIsShareDialogOpen(true)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Bio & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-6">
                <div className="md:col-span-2 space-y-4 text-center md:text-left">
                  <p className="text-base text-white/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
                    {user.bio || "No bio yet."}
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Cyber City, Net</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a
                        href={`https://pulse.aurelia.so/${handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        pulse.aurelia.so/{handle}
                      </a>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined March 2025</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-6 md:gap-8 text-center">
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-white">{followerCount.toLocaleString()}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Followers</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-white">{user.following?.toLocaleString() ?? 0}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Following</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-white">{(posts.length * 124).toLocaleString()}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Likes</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        {(user.echoes || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Echoes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Content Tabs or Private Message */}
          {canViewContent ? (
            <Tabs defaultValue="videos" className="w-full px-4 md:px-0">
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
                <VideoGrid posts={posts} onVideoClick={handleVideoClick} />
              </TabsContent>
              <TabsContent value="liked" className="mt-0">
                {isOwnProfile ? (
                  <LikedVideosTab userId={user.id} />
                ) : (
                  <div className="py-20 text-center text-muted-foreground">
                    <p>Liked videos are private.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-t border-white/10 mx-4 md:mx-0">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">This Account is Private</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Follow this account to see their photos and videos.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Edit Profile Dialog */}
      {currentUser && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentUser={currentUser}
        />
      )}
      {/* Report Dialog */}
      {user && (
        <ReportDialog
          open={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          targetId={user.id}
          targetType="user"
          targetName={user.name}
        />
      )}
      {/* Share Dialog */}
      {user && (
        <ProfileShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          profileId={user.id}
          profileName={user.displayName || user.name}
        />
      )}
      {/* Video Modal */}
      <VideoModal
        post={selectedVideoIndex !== null ? posts[selectedVideoIndex] : null}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onDelete={handlePostDelete}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideoIndex !== null && selectedVideoIndex < posts.length - 1}
        hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
      />
    </div>
  );
}
function LikedVideosTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  useEffect(() => {
    const fetchLiked = async () => {
      try {
        setLoading(true);
        const res = await api<{ items: Post[] }>(`/api/users/${userId}/liked`);
        setPosts(res.items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLiked();
  }, [userId]);
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
  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  return (
    <>
      <VideoGrid posts={posts} onVideoClick={handleVideoClick} />
      <VideoModal
        post={selectedVideoIndex !== null ? posts[selectedVideoIndex] : null}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideoIndex !== null && selectedVideoIndex < posts.length - 1}
        hasPrev={selectedVideoIndex !== null && selectedVideoIndex > 0}
      />
    </>
  );
}