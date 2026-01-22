import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";
export function RootLayout() {
  const location = useLocation();
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