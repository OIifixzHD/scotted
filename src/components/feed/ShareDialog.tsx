import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Twitter, Facebook, Linkedin, Share, Mail } from "lucide-react";
import { toast } from "sonner";
interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}
export function ShareDialog({ open, onOpenChange, postId }: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  // In a real app, this would be the actual public URL
  const shareUrl = `${window.location.origin}/post/${postId}`;
  const shareText = "Check out this amazing video on Pulse!";
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pulse Video',
          text: shareText,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed', err);
      }
    }
  };
  const openSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'email') => {
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent("Watch this on Pulse")}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  const hasNativeShare = typeof navigator.share === 'function';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Share Pulse</DialogTitle>
          <DialogDescription>
            Share this vibe with your friends on social media or copy the link.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="bg-secondary/50 border-white/10"
            />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <div className="flex justify-center gap-4 pt-4">
            {hasNativeShare && (
                <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-white/10 hover:bg-white/5 text-primary"
                    onClick={handleNativeShare}
                    title="Share via System"
                >
                    <Share className="h-4 w-4" />
                </Button>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#1DA1F2]" 
              onClick={() => openSocialShare('twitter')}
              title="Share on Twitter"
            >
                <Twitter className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#4267B2]" 
              onClick={() => openSocialShare('facebook')}
              title="Share on Facebook"
            >
                <Facebook className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#0077b5]" 
              onClick={() => openSocialShare('linkedin')}
              title="Share on LinkedIn"
            >
                <Linkedin className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full border-white/10 hover:bg-white/5 hover:text-red-500" 
              onClick={() => openSocialShare('email')}
              title="Share via Email"
            >
                <Mail className="h-4 w-4" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}