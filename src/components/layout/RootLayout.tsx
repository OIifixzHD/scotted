import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "./MobileNav";
import { PageTransition } from "./PageTransition";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { BannedPage } from "@/pages/BannedPage";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { KeyboardShortcutsDialog } from "@/components/settings/KeyboardShortcutsDialog";
import { GlobalContextMenu } from "./GlobalContextMenu";
import { AnimatedBackground } from "./AnimatedBackground";
import { AnnouncementBanner } from "@/components/ui/announcement-banner";
import { api } from "@/lib/api-client";
import { BalanceDisplay } from "@/components/layout/BalanceDisplay";
interface SystemSettings {
  maintenanceMode: boolean;
  disableSignups: boolean;
  readOnlyMode: boolean;
  announcement: string;
  announcementLevel: 'info' | 'warning' | 'destructive';
}
export function RootLayout() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  // Fetch System Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api<SystemSettings>('/api/system');
        setSystemSettings(settings);
      } catch (error) {
        console.error("Failed to fetch system settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);
  // Global Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  // Show loading screen while auth or settings are initializing
  if (isLoading || settingsLoading) {
    return <LoadingScreen />;
  }
  // Maintenance Mode Guard
  // If maintenance mode is active AND user is NOT an admin, show MaintenancePage
  if (systemSettings?.maintenanceMode && !user?.isAdmin) {
    return <MaintenancePage />;
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
        {/* Global Announcement Banner */}
        {systemSettings?.announcement && (
          <AnnouncementBanner
            message={systemSettings.announcement}
            level={systemSettings.announcementLevel}
          />
        )}
        <BalanceDisplay />
        <AnimatedBackground />
        <GlobalContextMenu>
          <main className="flex-1 h-full overflow-hidden pb-16 md:pb-0 relative z-10">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
        </GlobalContextMenu>
        <MobileNav />
        <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
      </SidebarInset>
    </SidebarProvider>
  );
}