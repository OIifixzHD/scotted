import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Palette, Lock, Sparkles, ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@shared/types";
import { cn, getDecorationClass } from "@/lib/utils";
import { ImageCropper } from "./ImageCropper";
interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
}
const DECORATIONS = [
  { id: 'none', label: 'None', cost: 0 },
  { id: 'gold-border', label: 'Gold Border', cost: 100 },
  { id: 'neon-glow', label: 'Neon Glow', cost: 250 },
  { id: 'blue-fire', label: 'Blue Fire', cost: 500 },
  { id: 'rainbow-ring', label: 'Rainbow Ring', cost: 1000 },
  { id: 'cyber-glitch', label: 'Cyber Glitch', cost: 2000 },
];
export function EditProfileDialog({ open, onOpenChange, currentUser }: EditProfileDialogProps) {
  const { login, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser.displayName || currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [bannerStyle, setBannerStyle] = useState(currentUser.bannerStyle || 'default');
  const [avatarDecoration, setAvatarDecoration] = useState(currentUser.avatarDecoration || 'none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  // Cropper State
  const [tempImage, setTempImage] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setDisplayName(currentUser.displayName || currentUser.name);
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');
      setBannerStyle(currentUser.bannerStyle || 'default');
      setAvatarDecoration(currentUser.avatarDecoration || 'none');
      setTempImage(null);
    }
  }, [open, currentUser]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };
  const handleCropComplete = (croppedImage: string) => {
    setAvatar(croppedImage);
    setTempImage(null);
  };
  const handleCropCancel = () => {
    setTempImage(null);
  };
  const handlePurchase = async (decorationId: string, cost: number) => {
    if ((currentUser.echoes || 0) < cost) {
        toast.error("Insufficient Echoes!");
        return;
    }
    setPurchasingId(decorationId);
    try {
        const updatedUser = await api<User>(`/api/users/${currentUser.id}/purchase-decoration`, {
            method: 'POST',
            body: JSON.stringify({ decorationId, cost })
        });
        login(updatedUser); // Update global context
        setAvatarDecoration(decorationId); // Auto-select
        toast.success("Purchased & Equipped!");
    } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Purchase failed");
    } finally {
        setPurchasingId(null);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      // Only send user-editable fields.
      const updatedUser = await api<User>(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ displayName, bio, avatar, bannerStyle, avatarDecoration })
      });
      login(updatedUser);
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  const bannerStyles = [
    { value: 'default', label: 'Default (Purple/Indigo)' },
    { value: 'cosmic', label: 'Cosmic (Dark/Purple)' },
    { value: 'neon', label: 'Neon (Fuchsia/Cyan)' },
    { value: 'sunset', label: 'Sunset (Orange/Red)' },
    { value: 'ocean', label: 'Ocean (Blue/Teal)' },
    { value: 'midnight', label: 'Midnight (Gray/Black)' },
  ];
  const unlocked = currentUser.unlockedDecorations || ['none'];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground max-h-[90vh] overflow-y-auto">
        {tempImage ? (
          <>
            <DialogHeader>
              <DialogTitle>Adjust Profile Picture</DialogTitle>
              <DialogDescription>
                Drag to reposition. Use the slider to zoom in/out.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex justify-center">
              <ImageCropper
                imageSrc={tempImage}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your public profile information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer">
                  <div className={cn("rounded-full transition-all duration-300", getDecorationClass(avatarDecoration))}>
                    <Avatar className="w-24 h-24 border-2 border-white/10 group-hover:border-primary transition-colors">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                  placeholder="Your visible name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-secondary/50 border-white/10 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Banner Theme
                </Label>
                <Select value={bannerStyle} onValueChange={setBannerStyle}>
                    <SelectTrigger className="bg-secondary/50 border-white/10">
                        <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                        {bannerStyles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                                {style.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              {/* Decoration Marketplace */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Avatar Ring
                    </Label>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Balance: <span className="text-yellow-400 font-bold">{currentUser.echoes || 0}</span>
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {DECORATIONS.map((deco) => {
                        const isOwned = unlocked.includes(deco.id);
                        const isSelected = avatarDecoration === deco.id;
                        return (
                            <div 
                                key={deco.id} 
                                className={cn(
                                    "p-3 rounded-lg border flex flex-col items-center gap-2 transition-all",
                                    isSelected 
                                        ? "bg-primary/10 border-primary" 
                                        : "bg-secondary/20 border-white/5 hover:bg-secondary/40"
                                )}
                            >
                                <div className={cn("w-12 h-12 rounded-full bg-black/50", getDecorationClass(deco.id))} />
                                <span className="text-xs font-medium">{deco.label}</span>
                                {isOwned ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isSelected ? "default" : "outline"}
                                        className={cn("w-full h-7 text-xs", isSelected ? "bg-primary" : "border-white/10")}
                                        onClick={() => setAvatarDecoration(deco.id)}
                                    >
                                        {isSelected ? <Check className="w-3 h-3 mr-1" /> : null}
                                        {isSelected ? "Equipped" : "Equip"}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="w-full h-7 text-xs bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20"
                                        onClick={() => handlePurchase(deco.id, deco.cost)}
                                        disabled={purchasingId === deco.id}
                                    >
                                        {purchasingId === deco.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                            <>
                                                <ShoppingBag className="w-3 h-3 mr-1" /> {deco.cost}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}