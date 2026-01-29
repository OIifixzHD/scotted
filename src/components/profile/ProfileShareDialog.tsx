import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Twitter, Facebook, Linkedin, Share } from "lucide-react";
import { toast } from "sonner";
interface ProfileShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
}
export function ProfileShareDialog({ open, onOpenChange, profileId, profileName }: ProfileShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/profile/${profileId}`;
  // Using a dark background QR code to match the theme
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}&bgcolor=0f0f16&color=7c3aed&margin=10`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Profile link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${profileName} on Scotted`,
          text: `Follow ${profileName} on Scotted - The next gen video platform.`,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };
  const openSocialShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    let url = '';
    const text = `Check out ${profileName} on Scotted!`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);
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
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
          <DialogDescription>
            Share {profileName}'s profile with the world.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          <div className="relative group">
            <div className="w-48 h-48 rounded-xl overflow-hidden border-4 border-white/10 bg-[#0f0f16] shadow-glow transition-transform hover:scale-105">
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20">
              SCAN ME
            </div>
          </div>
          {/* Link Copy */}
          <div className="flex items-center space-x-2 w-full">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="bg-secondary/50 border-white/10"
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {/* Social Actions */}
          <div className="flex justify-center gap-4 w-full pt-2">
            {typeof navigator.share === 'function' && (
               <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={handleNativeShare} title="Share via System">
                 <Share className="h-4 w-4" />
               </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#1DA1F2]" onClick={() => openSocialShare('twitter')} title="Share on Twitter">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#4267B2]" onClick={() => openSocialShare('facebook')} title="Share on Facebook">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5 hover:text-[#0077b5]" onClick={() => openSocialShare('linkedin')} title="Share on LinkedIn">
              <Linkedin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}