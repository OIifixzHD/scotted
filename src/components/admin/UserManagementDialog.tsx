import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertTriangle, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@shared/types";
import { cn, getDecorationClass } from "@/lib/utils";
interface UserManagementDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  mode: 'edit' | 'ban';
  onSuccess: () => void;
}
export function UserManagementDialog({ open, onClose, user, mode, onSuccess }: UserManagementDialogProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // Edit Mode State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [followers, setFollowers] = useState(0);
  const [avatarDecoration, setAvatarDecoration] = useState('none');
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Ban Mode State
  const [banDuration, setBanDuration] = useState('1'); // days
  const [banReason, setBanReason] = useState('');
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setFollowers(user.followers || 0);
      setAvatarDecoration(user.avatarDecoration || 'none');
      setIsVerified(user.isVerified || false);
      setIsAdmin(user.isAdmin || false);
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
        updates.bio = bio;
        updates.avatar = avatar;
        updates.followers = followers;
        updates.avatarDecoration = avatarDecoration;
        updates.isVerified = isVerified;
        updates.isAdmin = isAdmin;
      } else if (mode === 'ban') {
        const durationDays = parseInt(banDuration);
        const bannedUntil = durationDays === -1
          ? 32503680000000 // Permanent (Year 3000)
          : Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        updates.bannedUntil = bannedUntil;
        updates.banReason = banReason || 'Violation of terms';
        updates.bannedBy = currentUser?.name || 'System Administrator';
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
  const decorations = [
    { value: 'none', label: 'None' },
    { value: 'gold-border', label: 'Gold Border' },
    { value: 'neon-glow', label: 'Neon Glow' },
    { value: 'blue-fire', label: 'Blue Fire' },
    { value: 'rainbow-ring', label: 'Rainbow Ring' },
    { value: 'cyber-glitch', label: 'Cyber Glitch' },
    { value: 'verified-pro', label: 'Verified Pro' },
  ];
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
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
              {/* Avatar Preview */}
              <div className="flex justify-center mb-6">
                <div className={cn("rounded-full transition-all duration-300", getDecorationClass(avatarDecoration))}>
                  <Avatar className="w-24 h-24 border-2 border-white/10">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary/50 border-white/10"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="bg-secondary/50 border-white/10"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followers">Followers</Label>
                  <Input
                    id="followers"
                    type="number"
                    value={followers}
                    onChange={(e) => setFollowers(parseInt(e.target.value) || 0)}
                    className="bg-secondary/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Decoration
                  </Label>
                  <Select value={avatarDecoration} onValueChange={setAvatarDecoration}>
                    <SelectTrigger className="bg-secondary/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {decorations.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-secondary/50 border-white/10 min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-secondary/20 mt-2">
                <div className="space-y-0.5">
                  <Label>Verified Status</Label>
                  <p className="text-xs text-muted-foreground">Grant blue checkmark</p>
                </div>
                <Switch
                  checked={isVerified}
                  onCheckedChange={setIsVerified}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-500/10">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-purple-300">
                    <Shield className="w-4 h-4" />
                    Admin Access
                  </Label>
                  <p className="text-xs text-purple-200/70">Grant full system control</p>
                </div>
                <Switch
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                  className="data-[state=checked]:bg-purple-500"
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