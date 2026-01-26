import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, UserPlus, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import type { User } from "@shared/types";
import { format } from "date-fns";
import { toast } from "sonner";
interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}
export function UserHoverCard({ userId, children, asChild = false, className }: UserHoverCardProps) {
  const { user: currentUser, login } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  // Check if following based on current user's list
  useEffect(() => {
    if (currentUser && currentUser.followingIds) {
      setIsFollowing(currentUser.followingIds.includes(userId));
    }
  }, [currentUser, userId]);
  const handleOpenChange = (open: boolean) => {
    if (open && !userData) {
      fetchUserData();
    }
  };
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const data = await api<User>(`/api/users/${userId}`);
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user data for hover card", error);
    } finally {
      setLoading(false);
    }
  };
  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please log in to follow users");
      return;
    }
    setIsFollowLoading(true);
    // Optimistic update
    setIsFollowing(!isFollowing);
    try {
      const updatedCurrentUser = await api<User>(`/api/users/${userId}/follow`, {
        method: 'POST',
        body: JSON.stringify({ currentUserId: currentUser.id })
      });
      login(updatedCurrentUser);
      toast.success(isFollowing ? `Unfollowed` : `Following`);
    } catch (error) {
      console.error("Failed to follow user:", error);
      setIsFollowing(!isFollowing); // Revert
      toast.error("Failed to update follow status");
    } finally {
      setIsFollowLoading(false);
    }
  };
  // Don't show hover card for self
  if (currentUser?.id === userId) {
    return <>{children}</>;
  }
  return (
    <HoverCard onOpenChange={handleOpenChange} openDelay={300}>
      <HoverCardTrigger asChild={asChild} className={className}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-card/95 backdrop-blur-xl border-white/10 p-4 shadow-xl z-50">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : userData ? (
          <div className="flex justify-between space-x-4">
            <Avatar className="h-12 w-12 border border-white/10">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback>{userData.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1 min-w-0">
              <Link to={`/profile/${userData.id}`} className="text-sm font-semibold hover:underline text-white block truncate">
                {userData.displayName || userData.name}
              </Link>
              <p className="text-xs text-muted-foreground truncate">@{userData.name}</p>
              <p className="text-xs text-white/80 pt-1 line-clamp-2 break-words">
                {userData.bio || "No bio yet."}
              </p>
              <div className="flex items-center pt-2">
                <CalendarDays className="mr-2 h-3 w-3 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  Joined {userData.createdAt ? format(new Date(userData.createdAt), "MMMM yyyy") : "recently"}
                </span>
              </div>
              <div className="flex gap-4 pt-2 text-xs">
                 <span className="font-medium text-white">{userData.followers || 0} <span className="text-muted-foreground font-normal">Followers</span></span>
                 <span className="font-medium text-white">{userData.following || 0} <span className="text-muted-foreground font-normal">Following</span></span>
              </div>
              <Button
                size="sm"
                className={`w-full mt-3 h-8 text-xs ${isFollowing ? "bg-secondary text-white hover:bg-secondary/80" : "bg-primary hover:bg-primary/90"}`}
                onClick={handleFollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : isFollowing ? (
                    <>
                        <Check className="w-3 h-3 mr-1" /> Following
                    </>
                ) : (
                    <>
                        <UserPlus className="w-3 h-3 mr-1" /> Follow
                    </>
                )}
              </Button>
            </div>
          </div>
        ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
                User info unavailable
            </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}