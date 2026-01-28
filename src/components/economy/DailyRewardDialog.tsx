import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Clock, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { LikeExplosion } from "@/components/ui/like-explosion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
interface DailyRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function DailyRewardDialog({ open, onOpenChange }: DailyRewardDialogProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (!user || !open) return;
    const checkEligibility = () => {
      const lastReward = user.lastDailyReward || 0;
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000;
      const nextReward = lastReward + cooldown;
      if (now >= nextReward) {
        setIsReady(true);
        setTimeLeft("Ready to claim!");
      } else {
        setIsReady(false);
        const diff = nextReward - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };
    checkEligibility();
    const interval = setInterval(checkEligibility, 1000);
    return () => clearInterval(interval);
  }, [user, open]);
  const handleClaim = async () => {
    if (!user || !isReady) return;
    setLoading(true);
    try {
      await api('/api/economy/daily-reward', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      setShowExplosion(true);
      toast.success("Daily reward claimed! +100 Echoes");
      await refreshUser();
      setTimeout(() => {
        setShowExplosion(false);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to claim reward");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card/95 backdrop-blur-xl border-white/10 text-foreground overflow-hidden">
        <AnimatePresence>
          {showExplosion && <LikeExplosion />}
        </AnimatePresence>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold font-display flex flex-col items-center gap-4 pt-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-glow transition-all duration-500",
              isReady ? "bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse" : "bg-secondary/50 border-2 border-white/10"
            )}>
              {isReady ? (
                <Gift className="w-10 h-10 text-white fill-white animate-bounce" />
              ) : (
                <Clock className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            Daily Reward
          </DialogTitle>
          <DialogDescription className="text-center">
            Come back every 24 hours to claim free Echoes!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center gap-4">
          {isReady ? (
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-white">Your reward is ready!</p>
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-xl">
                <Sparkles className="w-5 h-5" />
                <span>+100 Echoes</span>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Next reward in</p>
              <p className="text-2xl font-mono font-bold text-white tracking-wider">{timeLeft}</p>
            </div>
          )}
        </div>
        <Button
          onClick={handleClaim}
          disabled={!isReady || loading}
          className={cn(
            "w-full h-12 text-lg font-bold shadow-lg transition-all duration-300",
            isReady 
              ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white hover:scale-105" 
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isReady ? (
            "Claim Now"
          ) : (
            "Come Back Later"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}