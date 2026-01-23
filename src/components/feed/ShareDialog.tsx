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
import { Copy, Check, Twitter, Facebook, Linkedin } from "lucide-react";
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
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={() => toast.info("Shared to Twitter (Mock)")}>
                <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={() => toast.info("Shared to Facebook (Mock)")}>
                <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={() => toast.info("Shared to LinkedIn (Mock)")}>
                <Linkedin className="h-4 w-4" />
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}