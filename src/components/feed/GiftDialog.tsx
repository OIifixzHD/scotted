import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  authorId: string;
}
const GIFT_OPTIONS = [
  { amount: 10, label: 'Spark', icon: '✨', color: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
  { amount: 50, label: 'Flame', icon: '🔥', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
  { amount: 100, label: 'Gem', icon: '💎', color: 'bg-purple-500/20 border-purple-500/50 text-purple-400' },
  { amount: 500, label: 'Crown', icon: '👑', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' },
];
export function GiftDialog({ open, onOpenChange, postId, authorId }: GiftDialogProps) {
  const { user, refreshUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const handleSendGift = async () => {
    if (!user || !selectedAmount) return;
    if ((user.echoes || 0) < selectedAmount) {
        toast.error("Insufficient Echoes. Go earn some more!");
        return;
    }
    setIsSending(true);
    try {
      await api(`/api/posts/${postId}/gift`, {
        method: 'POST',
        body: JSON.stringify({ senderId: user.id, amount: selectedAmount })
      });
      toast.success(`Sent ${selectedAmount} Echoes!`);
      await refreshUser(); // Update local balance
      onOpenChange(false);
      setSelectedAmount(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to send gift");
    } finally {
      setIsSending(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Send a Gift
          </DialogTitle>
          <DialogDescription>
            Support the creator by sending Echoes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <span className="font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {(user?.echoes || 0).toLocaleString()}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {GIFT_OPTIONS.map((option) => (
                    <button
                        key={option.amount}
                        onClick={() => setSelectedAmount(option.amount)}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                            selectedAmount === option.amount 
                                ? "bg-primary/20 border-primary shadow-glow scale-105" 
                                : "bg-secondary/30 border-transparent hover:bg-secondary/50 hover:border-white/10",
                            option.color.replace('bg-', 'hover:bg-').split(' ')[0] // subtle hover tint
                        )}
                    >
                        <span className="text-2xl mb-1">{option.icon}</span>
                        <span className="font-bold text-white">{option.amount}</span>
                        <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
        <Button 
            onClick={handleSendGift} 
            disabled={!selectedAmount || isSending}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
        >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Gift"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}