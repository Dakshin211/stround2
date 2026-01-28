import React, { useState, useEffect, forwardRef } from 'react';

interface ThunderEffectProps {
  intensity?: 'light' | 'medium' | 'strong';
}

export const ThunderEffect = forwardRef<HTMLDivElement, ThunderEffectProps>(
  ({ intensity = 'medium' }, ref) => {
    const [flash, setFlash] = useState(false);

    useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      
      const triggerThunder = () => {
        const delay = 4000 + Math.random() * 6000; // Random 4-10 seconds
        
        timeoutId = setTimeout(() => {
          setFlash(true);
          
          // Multiple flashes for realism
          setTimeout(() => setFlash(false), 50);
          setTimeout(() => setFlash(true), 100);
          setTimeout(() => setFlash(false), 150);
          if (intensity === 'strong') {
            setTimeout(() => setFlash(true), 200);
            setTimeout(() => setFlash(false), 250);
          }
          
          triggerThunder();
        }, delay);
      };
      
      triggerThunder();
      
      return () => clearTimeout(timeoutId);
    }, [intensity]);

    const opacityMap = {
      light: 0.08,
      medium: 0.12,
      strong: 0.18
    };

    return (
      <div 
        ref={ref}
        className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-50"
        style={{
          backgroundColor: flash ? `rgba(255, 255, 255, ${opacityMap[intensity]})` : 'transparent'
        }}
      />
    );
  }
);

ThunderEffect.displayName = 'ThunderEffect';
