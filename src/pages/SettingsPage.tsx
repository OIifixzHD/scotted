import React from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LogOut, Moon, Sun, Shield, Info } from 'lucide-react';
export function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account.</p>
        </div>
        {/* Appearance */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              Appearance
            </CardTitle>
            <CardDescription>Customize how Pulse looks on your device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for a better viewing experience at night.
                </p>
              </div>
              <Switch
                id="theme-mode"
                checked={isDark}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>
        {/* Account */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>Manage your session and security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() ?? '??'}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">@{user?.name?.toLowerCase().replace(/\s/g, '')}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
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
              <span className="font-mono">v1.0.0-beta</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Build</span>
              <span className="font-mono">Production</span>
            </div>
            <div className="pt-4 text-center text-xs text-muted-foreground">
              Built with ❤️ by Aurelia
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}