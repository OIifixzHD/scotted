import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    { key: "Space", description: "Play / Pause video" },
    { key: "M", description: "Mute / Unmute" },
    { key: "L", description: "Like video" },
    { key: "↑ / ↓", description: "Scroll to previous/next video" },
    { key: "?", description: "Open this help dialog" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate Scotted like a pro.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between group">
              <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">
                {shortcut.description}
              </span>
              <kbd className="pointer-events-none inline-flex h-8 items-center gap-1 rounded border border-white/10 bg-secondary/50 px-2.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}