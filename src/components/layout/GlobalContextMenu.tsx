import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { ArrowLeft, ArrowRight, RotateCw, Home, Compass, Upload } from 'lucide-react';
interface GlobalContextMenuProps {
  children: React.ReactNode;
}
export function GlobalContextMenu({ children }: GlobalContextMenuProps) {
  const navigate = useNavigate();
  return (
    <ContextMenu>
      <ContextMenuTrigger className="h-full w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-white/10 text-foreground">
        <ContextMenuItem onSelect={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
          <ContextMenuShortcut>Alt+←</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => navigate(1)}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Forward
          <ContextMenuShortcut>Alt+→</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => window.location.reload()}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reload
          <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem onSelect={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" />
          Home
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => navigate('/discover')}>
          <Compass className="mr-2 h-4 w-4" />
          Discover
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => navigate('/upload')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Pulse
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}