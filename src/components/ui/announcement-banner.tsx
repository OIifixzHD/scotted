import React from 'react';
import { AlertTriangle, Info, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
interface AnnouncementBannerProps {
  message: string;
  level?: 'info' | 'warning' | 'destructive';
}
export function AnnouncementBanner({ message, level = 'info' }: AnnouncementBannerProps) {
  if (!message) return null;
  const styles = {
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    destructive: "bg-red-500/10 border-red-500/20 text-red-400"
  };
  const icons = {
    info: Info,
    warning: AlertTriangle,
    destructive: Megaphone
  };
  const Icon = icons[level];
  return (
    <div className={cn(
      "w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium border-b backdrop-blur-sm relative z-50",
      styles[level]
    )}>
      <Icon className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}