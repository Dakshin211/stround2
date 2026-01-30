import React, { useState, useEffect } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';

interface CodeRevealProps {
  code: string;
  title: string;
  duration?: number; // in seconds
  onComplete: () => void;
}

export const CodeReveal: React.FC<CodeRevealProps> = ({ 
  code,
  title,
  duration = 15,
  onComplete 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-4">
      <GlitchText as="h2" className="text-3xl text-accent">
        {title}
      </GlitchText>
      
      <div className="bg-card/80 border-2 border-primary rounded-lg p-8 backdrop-blur-sm">
        <p className="text-primary font-cinzel text-6xl tracking-[0.3em] flicker-slow">
          {code}
        </p>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-muted-foreground font-rajdhani text-xl font-medium">
          KEEP THIS SAFE
        </p>
        <p className="text-muted-foreground/70 font-rajdhani">
          Memorizing in {timeLeft}s...
        </p>
      </div>
    </div>
  );
};
