import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@shared/types";
import { cn, getDecorationClass } from "@/lib/utils";
interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
}
export function EditProfileDialog({ open, onOpenChange, currentUser }: EditProfileDialogProps) {
  const { login } = useAuth(); // Used to update local user state
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarDecoration, setAvatarDecoration] = useState(currentUser.avatarDecoration || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');
      setAvatarDecoration(currentUser.avatarDecoration || 'none');
    }
  }, [open, currentUser]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const updatedUser = await api<User>(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, bio, avatar, avatarDecoration })
      });
      login(updatedUser); // Update context
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile information. Changes will be visible immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
              <div className={cn("rounded-full transition-all duration-300", getDecorationClass(avatarDecoration))}>
                <Avatar className="w-24 h-24 border-2 border-white/10 group-hover:border-primary transition-colors">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">Click to change avatar</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary/50 border-white/10 min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Profile Badge
            </Label>
            <Select value={avatarDecoration} onValueChange={setAvatarDecoration}>
                <SelectTrigger className="bg-secondary/50 border-white/10">
                    <SelectValue placeholder="Select a badge" />
                </SelectTrigger>
                <SelectContent>
                    {decorations.map((decoration) => (
                        <SelectItem key={decoration.value} value={decoration.value}>
                            {decoration.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
                Choose a visual style for your avatar.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}