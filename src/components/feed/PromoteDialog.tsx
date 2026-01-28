import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/types";
interface PromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSuccess?: (updatedPost: Post) => void;
}
export function PromoteDialog({ open, onOpenChange, post, onSuccess }: PromoteDialogProps) {
  const { user, refreshUser } = useAuth();
  const [isPromoting, setIsPromoting] = useState(false);
  const COST = 750;
  const DURATION_HOURS = 24;
  const handlePromote = async () => {
    if (!user) return;
    if ((user.echoes || 0) < COST) {
      toast.error("Insufficient Echoes. Earn more to promote!");
      return;
    }
    setIsPromoting(true);
    try {
      const res = await api<{ success: boolean, balance: number, post: Post }>(`/api/posts/${post.id}/promote`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      await refreshUser(); // Update local balance
      toast.success("Post promoted successfully! ��");
      if (onSuccess) onSuccess(res.post);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to promote post");
    } finally {
      setIsPromoting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
            Boost Your Pulse
          </DialogTitle>
          <DialogDescription>
            Get more eyes on your content by promoting it to the top of the feed.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-white">24 Hours</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white flex items-center justify-end gap-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                {COST}
              </p>
              <p className="text-xs text-muted-foreground">Cost</p>
            </div>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <span className={cn(
              "font-bold flex items-center gap-1",
              (user?.echoes || 0) >= COST ? "text-white" : "text-red-400"
            )}>
              <Sparkles className="w-4 h-4 text-yellow-400" />
              {(user?.echoes || 0).toLocaleString()}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handlePromote}
            disabled={isPromoting || (user?.echoes || 0) < COST}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white shadow-glow"
          >
            {isPromoting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
            Promote Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}