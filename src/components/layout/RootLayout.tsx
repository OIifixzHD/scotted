import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";
export function RootLayout() {
  const location = useLocation();
  return (
    <SidebarProvider defaultOpen={true} className="h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden relative bg-background">
        {/* Mobile Trigger */}
        <div className="absolute left-4 top-4 z-50 md:hidden">
          <SidebarTrigger className="bg-black/50 backdrop-blur-md text-white border border-white/10" />
        </div>
        <main className="flex-1 h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}