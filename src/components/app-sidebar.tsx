import React from "react";
import { Home, Compass, PlusSquare, MessageCircle, User, Zap, LogIn } from "lucide-react";
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
export function AppSidebar(): JSX.Element {
  const { user, logout } = useAuth();
  return (
    <Sidebar className="border-r border-white/5 bg-sidebar/95 backdrop-blur-xl">
      <SidebarHeader className="pb-6 pt-8">
        <div className="flex items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-teal-400 shadow-glow">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight text-white">
            Pulse
          </span>
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
              <NavLink to="/messages">
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="h-12 px-4 text-base font-medium hover:bg-white/5 data-[active=true]:bg-white/10 data-[active=true]:text-purple-400 transition-all duration-200"
                  >
                    <span className="flex items-center gap-3 cursor-pointer">
                      <MessageCircle className="h-5 w-5" />
                      <span>Messages</span>
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
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        {user ? (
          <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 p-4 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <button onClick={logout} className="text-xs text-red-400 hover:underline">Logout</button>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white truncate">{user.name}</span>
            </div>
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