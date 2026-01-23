import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { User } from "@shared/types";
interface UserManagementDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  mode: 'edit' | 'ban';
  onSuccess: () => void;
}
export function UserManagementDialog({ open, onClose, user, mode, onSuccess }: UserManagementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Edit Mode State
  const [name, setName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  // Ban Mode State
  const [banDuration, setBanDuration] = useState('1'); // days
  const [banReason, setBanReason] = useState('');
  useEffect(() => {
    if (user) {
      setName(user.name);
      setIsVerified(user.isVerified || false);
      setBanReason('');
      setBanDuration('1');
    }
  }, [user, open]);
  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updates: Partial<User> = {};
      if (mode === 'edit') {
        updates.name = name;
        updates.isVerified = isVerified;
      } else if (mode === 'ban') {
        const durationDays = parseInt(banDuration);
        const bannedUntil = durationDays === -1 
          ? 32503680000000 // Permanent (Year 3000)
          : Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        updates.bannedUntil = bannedUntil;
        updates.banReason = banReason || 'Violation of terms';
      }
      await api(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      toast.success(mode === 'edit' ? 'User updated' : 'User banned');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit User' : 'Ban User'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? `Modify details for ${user.name}` 
              : `Suspend access for ${user.name}`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {mode === 'edit' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/20">
                <div className="space-y-0.5">
                  <Label>Verified Status</Label>
                  <p className="text-xs text-muted-foreground">Grant blue checkmark</p>
                </div>
                <Switch 
                  checked={isVerified} 
                  onCheckedChange={setIsVerified} 
                />
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Banning a user will prevent them from logging in and interacting with the platform.</p>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={banDuration} onValueChange={setBanDuration}>
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">24 Hours</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="-1">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input 
                  placeholder="e.g. Spam, Harassment" 
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            variant={mode === 'ban' ? 'destructive' : 'default'}
            className={mode === 'edit' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Save Changes' : 'Ban User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}