import React, { useEffect, useState } from "react";
import { Home, Compass, PlusSquare, MessageCircle, User, Zap, LogIn, LogOut, Settings, Shield } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { GlitchText } from "@/components/ui/glitch-text";
export function AppSidebar(): JSX.Element {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api<{ count: number }>(`/api/notifications/unread-count?userId=${user.id}`);
        setUnreadCount(res.count);
      } catch (e) {
        console.error("Failed to fetch unread count", e);
      }
    };
    fetchUnread();
    // Poll every minute for updates
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);
  return (
    <Sidebar className="border-r border-white/5 bg-sidebar/95 backdrop-blur-xl">
      <SidebarHeader className="pb-6 pt-8">
        <div className="flex items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-teal-400 shadow-glow">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <GlitchText text="Pulse" className="text-2xl font-display tracking-tight" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            <SidebarMenuItem>
              <NavLink to="/" end>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <Home className="h-5 w-5" />
                      <span>For You</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink to="/discover">
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <Compass className="h-5 w-5" />
                      <span>Discover</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink to="/upload">
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <PlusSquare className="h-5 w-5" />
                      <span>Upload</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink to="/inbox">
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer w-full">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageCircle className="h-5 w-5" />
                        <span>Inbox</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink to={user ? `/profile/${user.id}` : "/login"}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NavLink to="/settings">
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
            {/* Admin Link - Accessible to any admin or the seeded super-admin */}
            {(user?.isAdmin || user?.name === 'AdminUser001') && (
              <SidebarMenuItem>
                <NavLink to="/admin">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                    >
                      <span className="flex items-center gap-3 cursor-pointer">
                        <Shield className="h-5 w-5" />
                        <span>Admin Panel</span>
                      </span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        {user ? (
          <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 p-4 border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">{user.displayName || user.name}</span>
                <span className="text-xs text-muted-foreground truncate">@{user.name.toLowerCase().replace(/\s/g, '')}</span>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full justify-start bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 p-4 border border-white/5 space-y-3">
            <p className="text-sm text-white font-medium">Join the Pulse</p>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 shadow-glow" size="sm">
              <Link to="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}