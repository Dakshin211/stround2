import React, { useState, useEffect } from 'react';
import { GlitchText } from './GlitchText';

interface CountdownOverlayProps {
  onComplete: () => void;
  startFrom?: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ 
  onComplete, 
  startFrom = 5 
}) => {
  const [count, setCount] = useState(startFrom);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-void/90">
      <div className="text-center space-y-4 animate-scale-in">
        <GlitchText as="p" className="text-muted-foreground text-xl tracking-widest" noFlicker>
          ENTERING THE UPSIDE DOWN
        </GlitchText>
        
        <div className="relative">
          <GlitchText 
            as="h1" 
            className="text-[12rem] leading-none"
            key={count}
          >
            {count}
          </GlitchText>
          
          {/* Pulse ring effect */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            key={`ring-${count}`}
          >
            <div 
              className="w-48 h-48 rounded-full border-4 border-primary/50 animate-ping"
              style={{ animationDuration: '1s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
