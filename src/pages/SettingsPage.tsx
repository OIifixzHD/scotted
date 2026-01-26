import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut, Moon, Sun, Shield, Info, Lock, UserX, Loader2, Trash2,
  AlertTriangle, Bell, Eye, Keyboard
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { User, UserSettings } from '@shared/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KeyboardShortcutsDialog } from '@/components/settings/KeyboardShortcutsDialog';
export function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // Local state for settings, initialized from user object
  const [settings, setSettings] = useState<UserSettings>({
    notifications: { paused: false, newFollowers: true, interactions: true },
    privacy: { privateAccount: false },
    content: { autoplay: true, reducedMotion: false }
  });
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  // Sync state with user object when it loads/updates
  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
      // Sync local storage for immediate UI effects (theme/motion)
      localStorage.setItem('pulse_autoplay', String(user.settings.content.autoplay));
      localStorage.setItem('pulse_reduced_motion', String(user.settings.content.reducedMotion));
      if (user.settings.content.reducedMotion) {
        document.documentElement.classList.add('motion-reduce');
      } else {
        document.documentElement.classList.remove('motion-reduce');
      }
    }
  }, [user]);
  const updateSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    setSettings(newSettings); // Optimistic update
    setIsUpdating(true);
    try {
      await api(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ settings: newSettings })
      });
      await refreshUser();
      toast.success('Settings saved');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings');
      // Revert would go here in a more complex implementation
    } finally {
      if (isMounted.current) setIsUpdating(false);
    }
  };
  const handleNotificationChange = (key: keyof UserSettings['notifications'], value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    };
    updateSettings(newSettings);
  };
  const handlePrivacyChange = (key: keyof UserSettings['privacy'], value: boolean) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, [key]: value }
    };
    updateSettings(newSettings);
  };
  const handleContentChange = (key: keyof UserSettings['content'], value: boolean) => {
    const newSettings = {
      ...settings,
      content: { ...settings.content, [key]: value }
    };
    updateSettings(newSettings);
  };
  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingBlocked(true);
      const res = await api<User[]>(`/api/users/blocked?userId=${user.id}`);
      if (isMounted.current) {
        setBlockedUsers(res);
      }
    } catch (error) {
      console.error(`Failed to fetch blocked users`, error);
    } finally {
      if (isMounted.current) {
        setLoadingBlocked(false);
      }
    }
  }, [user]);
  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);
  const handleUnblock = async (targetId: string) => {
    if (!user) return;
    try {
      await api(`/api/users/${targetId}/block`, {
        method: 'POST',
        body: JSON.stringify({ currentUserId: user.id })
      });
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch (error) {
      toast.error(`Failed to unblock user`);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await api(`/api/users/${user.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ currentUserId: user.id })
      });
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to delete account`);
      if (isMounted.current) {
        setIsDeleting(false);
      }
    }
  };
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account.</p>
        </div>
        {/* Account Overview */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account
            </CardTitle>
            <CardDescription>Manage your session and identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-white/5">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-white/10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() ?? '??'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{user?.displayName || user?.name}</p>
                  <p className="text-xs text-muted-foreground">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={logout} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Content & Display */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-400" />
              Content & Display
            </CardTitle>
            <CardDescription>Customize your viewing experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-mode" className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark themes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                <Switch
                  id="theme-mode"
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoplay" className="text-base">Autoplay Videos</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play videos when they appear in the feed.
                </p>
              </div>
              <Switch
                id="autoplay"
                checked={settings.content.autoplay}
                onCheckedChange={(val) => handleContentChange('autoplay', val)}
                disabled={isUpdating}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduced-motion" className="text-base">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations for a calmer experience.
                </p>
              </div>
              <Switch
                id="reduced-motion"
                checked={settings.content.reducedMotion}
                onCheckedChange={(val) => handleContentChange('reducedMotion', val)}
                disabled={isUpdating}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Keyboard Shortcuts</Label>
                <p className="text-sm text-muted-foreground">
                  View available hotkeys for navigation.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowShortcuts(true)} className="border-white/10 hover:bg-white/5">
                <Keyboard className="w-4 h-4 mr-2" />
                View Shortcuts
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Notifications */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              Notifications
            </CardTitle>
            <CardDescription>Control how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pause-notifs" className="text-base">Pause All</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily silence all notifications.
                </p>
              </div>
              <Switch
                id="pause-notifs"
                checked={settings.notifications.paused}
                onCheckedChange={(val) => handleNotificationChange('paused', val)}
                disabled={isUpdating}
              />
            </div>
            <div className={`flex items-center justify-between transition-opacity ${settings.notifications.paused ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-0.5">
                <Label className="text-base">New Followers</Label>
                <p className="text-sm text-muted-foreground">
                  Notify me when someone follows my profile.
                </p>
              </div>
              <Switch 
                checked={settings.notifications.newFollowers} 
                onCheckedChange={(val) => handleNotificationChange('newFollowers', val)}
                disabled={isUpdating}
              />
            </div>
            <div className={`flex items-center justify-between transition-opacity ${settings.notifications.paused ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-0.5">
                <Label className="text-base">Interactions</Label>
                <p className="text-sm text-muted-foreground">
                  Likes, comments, and mentions.
                </p>
              </div>
              <Switch 
                checked={settings.notifications.interactions} 
                onCheckedChange={(val) => handleNotificationChange('interactions', val)}
                disabled={isUpdating}
              />
            </div>
          </CardContent>
        </Card>
        {/* Privacy & Security */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-400" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage blocked users and visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private-account" className="text-base">Private Account</Label>
                <p className="text-sm text-muted-foreground">
                  Only approved followers can see your posts.
                </p>
              </div>
              <Switch
                id="private-account"
                checked={settings.privacy.privateAccount}
                onCheckedChange={(val) => handlePrivacyChange('privateAccount', val)}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-4 pt-2">
              <Label className="text-base">Blocked Users</Label>
              {loadingBlocked ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-white/10 text-center text-sm text-muted-foreground">
                  You haven't blocked anyone yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{u.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-white">{u.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleUnblock(u.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <UserX className="w-4 h-4 mr-2" /> Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Danger Zone */}
        <Card className="bg-red-950/10 backdrop-blur-sm border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions for your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-500/10 bg-red-500/5">
              <div className="space-y-1">
                <p className="font-medium text-red-400">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-white/10 text-foreground">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
        {/* About */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              About
            </CardTitle>
            <CardDescription>Application information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-white">v1.2.0-beta</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Build</span>
              <span className="font-mono text-white">Production</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}