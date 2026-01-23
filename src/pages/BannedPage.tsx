import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
export function BannedPage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const isPermanent = user.bannedUntil && user.bannedUntil > 32503680000000; // Rough check for far future
  const banDate = user.bannedUntil ? new Date(user.bannedUntil) : new Date();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-black pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="relative z-10 max-w-md w-full bg-card/50 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-500/20">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Access Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended due to a violation of our Community Guidelines.
          </p>
        </div>
        <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-4 text-left space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-300 uppercase font-bold tracking-wider mb-1">Reason</p>
              <p className="text-sm text-white font-medium">{user.banReason || "Violation of terms"}</p>
            </div>
          </div>
          <div className="h-px bg-red-500/20 w-full" />
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-300 uppercase font-bold tracking-wider mb-1">Lift Date</p>
              <p className="text-sm text-white font-medium">
                {isPermanent ? "Permanent Suspension" : format(banDate, "PPP 'at' p")}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full border-white/10 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}