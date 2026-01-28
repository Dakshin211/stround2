import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  noFlicker?: boolean;
}

export const GlitchText = forwardRef<HTMLElement, GlitchTextProps>(
  ({ children, className, as: Component = 'span', noFlicker = false }, ref) => {
    return (
      <Component 
        ref={ref as any}
        className={cn(
          'stranger-title',
          !noFlicker && 'glitch-text',
          className
        )}
      >
        {children}
      </Component>
    );
  }
);

GlitchText.displayName = 'GlitchText';
