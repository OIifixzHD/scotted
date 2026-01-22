import React from "react";
import { Home, Compass, PlusSquare, MessageCircle, User, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
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
export function AppSidebar(): JSX.Element {
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
              <NavLink to="/profile/u1">
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
        <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-slate-900/50 p-4 border border-white/5">
          <p className="text-xs text-muted-foreground mb-2">Logged in as</p>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs">
              ND
            </div>
            <span className="text-sm font-medium text-white">NeonDrifter</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}