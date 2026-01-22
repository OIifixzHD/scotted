import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
export function MobileNav() {
  const { user } = useAuth();
  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Home',
      end: true
    },
    {
      to: '/discover',
      icon: Compass,
      label: 'Discover',
      end: false
    },
    {
      to: '/upload',
      icon: PlusSquare,
      label: 'Upload',
      end: false,
      highlight: true
    },
    {
      to: '/messages',
      icon: MessageCircle,
      label: 'Inbox',
      end: false
    },
    {
      to: user ? `/profile/${user.id}` : '/login',
      icon: User,
      label: 'Profile',
      end: false
    }
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-200",
              isActive ? "text-primary" : "text-muted-foreground hover:text-white",
              item.highlight && "text-white"
            )}
          >
            {({ isActive }) => (
              <>
                {item.highlight ? (
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white shadow-glow" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}>
                    <item.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                )}
                {!item.highlight && (
                  <span className="text-[10px] font-medium">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}