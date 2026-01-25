import React, { useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Check } from 'lucide-react';
import type { User } from '@shared/types';
import { cn } from '@/lib/utils';
interface SuggestedUserCardProps {
  user: User;
  onFollow: (userId: string) => void;
}
export const SuggestedUserCard = forwardRef<HTMLDivElement, SuggestedUserCardProps>(
  ({ user, onFollow }, ref) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const handleFollowClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFollowing(true);
      // Delay the actual removal to allow for a brief "Following" state/animation
      setTimeout(() => {
        onFollow(user.id);
      }, 500);
    };
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, width: 0, marginLeft: 0, marginRight: 0 }}
        transition={{ duration: 0.3 }}
        className="min-w-[160px] w-[160px] p-4 rounded-xl bg-card/50 border border-white/10 flex flex-col items-center gap-3 relative group hover:bg-white/5 transition-colors"
      >
        <Link to={`/profile/${user.id}`} className="flex flex-col items-center gap-2 w-full">
          <Avatar className="w-16 h-16 border-2 border-white/10 group-hover:border-primary transition-colors">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center w-full">
            <p className="font-semibold text-white truncate w-full text-sm">
              {user.displayName || user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate w-full">
              @{user.name.toLowerCase().replace(/\s/g, '')}
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {user.followers?.toLocaleString() ?? 0} followers
          </div>
        </Link>
        <Button
          size="sm"
          className={cn(
            "w-full h-8 text-xs transition-all duration-300",
            isFollowing
              ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={handleFollowClick}
          disabled={isFollowing}
        >
          {isFollowing ? (
            <>
              <Check className="w-3 h-3 mr-1" /> Following
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 mr-1" /> Follow
            </>
          )}
        </Button>
      </motion.div>
    );
  }
);
SuggestedUserCard.displayName = "SuggestedUserCard";