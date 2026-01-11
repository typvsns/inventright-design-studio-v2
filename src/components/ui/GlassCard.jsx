import React from 'react';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className, variant = 'default', ...props }) {
  const variants = {
    default: 'glass text-black',
    strong: 'glass-strong text-black',
    dark: 'glass-dark text-white'
  };
  
  return (
    <div
      className={cn(
        'rounded-2xl p-6 shadow-lg',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}