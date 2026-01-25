import React from 'react';
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-none bg-secondary w-fit">
      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
    </div>
  );
}