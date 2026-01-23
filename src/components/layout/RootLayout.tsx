import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { BannedPage } from "@/pages/BannedPage";
import { LoadingScreen } from "@/components/ui/loading-screen";
export function RootLayout() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  // Show loading screen while auth is initializing
  // This prevents the "flash of unauthenticated content"
  if (isLoading) {
    return <LoadingScreen />;
  }
  // Global Ban Guard
  // If user is logged in AND banned, show BannedPage instead of app shell
  if (user?.bannedUntil && user.bannedUntil > Date.now()) {
    return <BannedPage />;
  }
  return (
    <SidebarProvider defaultOpen={true} className="h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden relative bg-background">
        <main className="flex-1 h-full overflow-hidden pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}