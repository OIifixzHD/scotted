import React from 'react';
import { cn } from '@/lib/utils';
interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}
export function GlitchText({ text, className, as: Component = 'span' }: GlitchTextProps) {
  return (
    <Component className={cn("glitch-wrapper relative inline-block", className)}>
      <span className="glitch" data-text={text}>
        {text}
      </span>
      <style>{`
        .glitch {
          position: relative;
          color: white;
          font-weight: bold;
        }
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0f0f16; /* Match background to hide original */
        }
        .glitch::before {
          left: 2px;
          text-shadow: -1px 0 #ff00c1;
          clip-path: inset(44% 0 61% 0);
          animation: glitch-anim-1 2s infinite linear alternate-reverse;
        }
        .glitch::after {
          left: -2px;
          text-shadow: -1px 0 #00fff9;
          clip-path: inset(58% 0 43% 0);
          animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); }
          20% { clip-path: inset(60% 0 10% 0); }
          40% { clip-path: inset(40% 0 50% 0); }
          60% { clip-path: inset(80% 0 5% 0); }
          80% { clip-path: inset(10% 0 70% 0); }
          100% { clip-path: inset(30% 0 20% 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); }
          20% { clip-path: inset(30% 0 10% 0); }
          40% { clip-path: inset(70% 0 20% 0); }
          60% { clip-path: inset(20% 0 50% 0); }
          80% { clip-path: inset(50% 0 30% 0); }
          100% { clip-path: inset(5% 0 80% 0); }
        }
      `}</style>
    </Component>
  );
}