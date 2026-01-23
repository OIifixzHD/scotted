import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@shared/types';
import { cn } from '@/lib/utils';
interface NotificationItemProps {
  notification: Notification;
}
export function NotificationItem({ notification }: NotificationItemProps) {
  const { actor, type, post, createdAt } = notification;
  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-white fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-white fill-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-white fill-purple-500" />;
      default:
        return null;
    }
  };
  const getIconBg = () => {
    switch (type) {
      case 'like': return 'bg-red-500';
      case 'comment': return 'bg-blue-500';
      case 'follow': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  const getMessage = () => {
    switch (type) {
      case 'like': return 'liked your pulse';
      case 'comment': return 'commented on your pulse';
      case 'follow': return 'started following you';
      default: return 'interacted with you';
    }
  };
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group animate-fade-in border border-transparent hover:border-white/5">
      <div className="relative">
        <Link to={`/profile/${actor?.id}`}>
          <Avatar className="w-12 h-12 border border-white/10">
            <AvatarImage src={actor?.avatar} />
            <AvatarFallback>{actor?.name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-black",
          getIconBg()
        )}>
          {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link to={`/profile/${actor?.id}`} className="font-semibold text-white hover:underline truncate">
            {actor?.name || 'Unknown User'}
          </Link>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {getMessage()}
        </p>
      </div>
      {/* Right side content */}
      {(type === 'like' || type === 'comment') && post && (
        <div className="shrink-0">
           {/* In a real app, this would link to the specific post view */}
           <div className="w-10 h-12 bg-gray-800 rounded overflow-hidden border border-white/10">
             <video src={post.videoUrl} className="w-full h-full object-cover opacity-80" muted />
           </div>
        </div>
      )}
      {type === 'follow' && (
        <Button size="sm" variant="outline" className="shrink-0 border-white/10 hover:bg-white/5">
          View
        </Button>
      )}
    </div>
  );
}