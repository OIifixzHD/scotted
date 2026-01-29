import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loader2, Trophy, Medal, Sparkles } from 'lucide-react';
import { cn, getDecorationClass } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { getBadgeIcon } from '@/components/ui/badge-icons';
export function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api<User[]>('/api/economy/leaderboard');
        setUsers(res);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0: return "border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)]";
      case 1: return "border-slate-300/50 bg-slate-300/10 shadow-[0_0_30px_-10px_rgba(203,213,225,0.3)]";
      case 2: return "border-orange-700/50 bg-orange-700/10 shadow-[0_0_30px_-10px_rgba(194,65,12,0.3)]";
      default: return "border-white/5 bg-card/30 hover:bg-white/5";
    }
  };
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />;
      case 1: return <Medal className="w-6 h-6 text-slate-300 fill-slate-300/20" />;
      case 2: return <Medal className="w-6 h-6 text-orange-600 fill-orange-600/20" />;
      default: return <span className="text-muted-foreground font-mono font-bold w-6 text-center">{index + 1}</span>;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-glow mb-2">
            <Trophy className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl font-bold font-display text-white">Global Leaderboard</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The top earners and influencers on Scotted. Earn Echoes by creating content and engaging with the community.
          </p>
        </div>
        <div className="space-y-3">
          {users.map((user, index) => (
            <Link key={user.id} to={`/profile/${user.id}`}>
              <Card className={cn(
                "flex items-center p-4 transition-all duration-300 border",
                getRankStyle(index),
                currentUser?.id === user.id && "ring-2 ring-primary ring-offset-2 ring-offset-black"
              )}>
                <div className="flex items-center justify-center w-12 shrink-0">
                  {getRankIcon(index)}
                </div>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn("rounded-full p-0.5", getDecorationClass(user.avatarDecoration))}>
                    <Avatar className="w-12 h-12 border border-white/10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{user.displayName || user.name}</span>
                      {getBadgeIcon(user.badge)}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">@{user.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right pl-4">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-white text-lg flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {(user.echoes || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Echoes</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No users found on the leaderboard yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}