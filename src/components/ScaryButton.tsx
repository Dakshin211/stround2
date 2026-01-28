import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ScaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const ScaryButton = forwardRef<HTMLButtonElement, ScaryButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'btn-scary',
    secondary: 'bg-muted border-2 border-muted-foreground/40 text-foreground hover:bg-muted/80 hover:border-primary/50 font-cinzel uppercase tracking-widest',
    danger: 'bg-destructive border-2 border-destructive text-destructive-foreground font-cinzel uppercase tracking-widest'
  };

  return (
    <button
      ref={ref}
      className={cn(
        'relative rounded transition-all duration-300',
        sizeClasses[size],
        variantClasses[variant],
        isLoading && 'opacity-70 cursor-wait',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flicker-slow">Loading...</span>
      ) : (
        children
      )}
    </button>
  );
});

ScaryButton.displayName = 'ScaryButton';
