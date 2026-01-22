import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true} className="h-screen w-full bg-background overflow-hidden">
      <AppSidebar />
      <SidebarInset className={cn("flex flex-col h-full overflow-hidden relative bg-background", className)}>
        {/* Mobile Trigger */}
        <div className="absolute left-4 top-4 z-50 md:hidden">
          <SidebarTrigger className="bg-black/50 backdrop-blur-md text-white border border-white/10" />
        </div>
        <main className={cn(
          "flex-1 h-full overflow-hidden", 
          container ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12" : "",
          contentClassName
        )}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}