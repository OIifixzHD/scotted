import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyRewardDialog } from '@/components/economy/DailyRewardDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
export function BalanceDisplay() {
  const { user } = useAuth();
  const [isRewardReady, setIsRewardReady] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    const checkReward = () => {
      const lastReward = user.lastDailyReward || 0;
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      setIsRewardReady(now >= lastReward + cooldown);
    };
    checkReward();
    const interval = setInterval(checkReward, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);
  if (!user) return null;
  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 animate-fade-in">
        <div className="hidden md:flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-lg">
          <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-white text-sm font-mono">
            {(user.echoes || 0).toLocaleString()}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={() => setIsDialogOpen(true)}
              className={cn(
                "rounded-full shadow-lg transition-all duration-300 border border-white/10",
                isRewardReady 
                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-white animate-pulse-slow" 
                  : "bg-black/40 backdrop-blur-md hover:bg-white/10 text-muted-foreground"
              )}
            >
              <Gift className={cn("w-5 h-5", isRewardReady && "fill-current animate-bounce")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <p>{isRewardReady ? "Claim Daily Reward!" : "Daily Reward"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <DailyRewardDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}