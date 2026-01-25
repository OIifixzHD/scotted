import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertTriangle, Shield, Sparkles, Award, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@shared/types";
import { cn, getDecorationClass } from "@/lib/utils";
import { getBadgeIcon } from "@/components/ui/badge-icons";
interface UserManagementDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  mode: 'edit' | 'ban' | 'unban';
  onSuccess: () => void;
}
export function UserManagementDialog({ open, onClose, user, mode, onSuccess }: UserManagementDialogProps) {
  const { user: currentUser, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // Edit Mode State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [followers, setFollowers] = useState(0);
  const [avatarDecoration, setAvatarDecoration] = useState('none');
  const [badge, setBadge] = useState('none');
  const [isAdmin, setIsAdmin] = useState(false);
  // Ban Mode State
  const [banDurationType, setBanDurationType] = useState<'preset' | 'custom'>('preset');
  const [banDuration, setBanDuration] = useState('1'); // days (preset)
  const [customBanValue, setCustomBanValue] = useState('1');
  const [customBanUnit, setCustomBanUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('hours');
  const [banReason, setBanReason] = useState('');
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setFollowers(user.followers || 0);
      setAvatarDecoration(user.avatarDecoration || 'none');
      setBadge(user.badge || 'none');
      setIsAdmin(user.isAdmin || false);
      // Reset ban fields
      setBanReason('');
      setBanDuration('1');
      setBanDurationType('preset');
      setCustomBanValue('1');
      setCustomBanUnit('hours');
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
        updates.badge = badge;
        updates.isAdmin = isAdmin;
      } else if (mode === 'ban') {
        let bannedUntil = 0;
        if (banDurationType === 'preset') {
          const durationDays = parseInt(banDuration);
          bannedUntil = durationDays === -1 
            ? 32503680000000 // Permanent (Year 3000)
            : Date.now() + (durationDays * 24 * 60 * 60 * 1000);
        } else {
          // Custom duration
          const val = parseInt(customBanValue) || 0;
          let multiplier = 1000; // seconds
          if (customBanUnit === 'minutes') multiplier = 60 * 1000;
          if (customBanUnit === 'hours') multiplier = 60 * 60 * 1000;
          if (customBanUnit === 'days') multiplier = 24 * 60 * 60 * 1000;
          bannedUntil = Date.now() + (val * multiplier);
        }
        updates.bannedUntil = bannedUntil;
        updates.banReason = banReason || 'Violation of terms';
        updates.bannedBy = currentUser?.name || 'System Administrator';
      } else if (mode === 'unban') {
        updates.bannedUntil = 0;
        updates.banReason = '';
        updates.bannedBy = '';
      }
      await api(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      if (currentUser && user.id === currentUser.id) {
        await refreshUser();
      }

      let successMessage = 'User updated';
      if (mode === 'ban') successMessage = 'User banned';
      if (mode === 'unban') successMessage = 'User unbanned';
      toast.success(successMessage);
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
  ];
  const badges = [
    { value: 'none', label: 'None' },
    { value: 'verified-pro', label: 'Verified Pro (Blue Check)' },
    { value: 'owner', label: 'Owner (Gold Shield)' },
    { value: 'ultra-verified', label: 'Ultra Verified (Cyan Zap)' },
    { value: 'crystal', label: 'Crystal (Indigo Gem)' },
    { value: 'magma', label: 'Magma (Orange Flame)' },
    { value: 'holographic', label: 'Holographic (Pink Sparkles)' },
    { value: 'steampunk', label: 'Steampunk (Amber CPU)' },
    { value: 'phantom', label: 'Phantom (Slate Ghost)' },
  ];
  if (!user) return null;
  const getTitle = () => {
    if (mode === 'edit') return 'Edit User';
    if (mode === 'ban') return 'Ban User';
    return 'Unban User';
  };
  const getDescription = () => {
    if (mode === 'edit') return `Modify details for ${user.name}`;
    if (mode === 'ban') return `Suspend access for ${user.name}`;
    return `Restore access for ${user.name}`;
  };
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {mode === 'edit' && (
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
                  <div className="flex items-center gap-2">
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="bg-secondary/50 border-white/10"
                    />
                    {getBadgeIcon(badge)}
                  </div>
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
                    Avatar Ring
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
                  <Label className="flex items-center gap-2">
                    <Award className="w-3 h-3 text-primary" />
                    Badge Icon
                  </Label>
                  <Select value={badge} onValueChange={setBadge}>
                    <SelectTrigger className="bg-secondary/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {badges.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          <div className="flex items-center gap-2">
                            {getBadgeIcon(b.value)}
                            <span>{b.label}</span>
                          </div>
                        </SelectItem>
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
              <div className="flex items-center justify-between p-3 rounded-lg border border-purple-500/20 bg-purple-500/10 mt-2">
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
          )}
          {mode === 'ban' && (
            <>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Banning a user will prevent them from logging in and interacting with the platform.</p>
              </div>
              <div className="space-y-2">
                <Label>Duration Type</Label>
                <Select 
                  value={banDurationType} 
                  onValueChange={(val: 'preset' | 'custom') => setBanDurationType(val)}
                >
                  <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset">Standard Presets</SelectItem>
                    <SelectItem value="custom">Custom Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {banDurationType === 'preset' ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={customBanValue} 
                      onChange={(e) => setCustomBanValue(e.target.value)}
                      className="bg-secondary/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select 
                      value={customBanUnit} 
                      onValueChange={(val: 'seconds' | 'minutes' | 'hours' | 'days') => setCustomBanUnit(val)}
                    >
                      <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
          {mode === 'unban' && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3 text-green-400 text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <p>Are you sure you want to unban this user? They will regain full access to the platform immediately.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            variant={mode === 'ban' ? 'destructive' : 'default'}
            className={mode === 'edit' || mode === 'unban' ? 'bg-primary hover:bg-primary/90' : ''}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'edit' ? 'Save Changes' : mode === 'ban' ? 'Ban User' : 'Unban User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}