import React, { useEffect, useState } from 'react';
import { GlitchText } from '@/components/GlitchText';

interface VictoryScreenProps {
  teamId: string;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ teamId }) => {
  const [showGlitch, setShowGlitch] = useState(true);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Glitch effect timing
    const glitchInterval = setInterval(() => {
      setShowGlitch((prev) => !prev);
    }, 100);

    // Rotation animation
    const rotationTimer = setTimeout(() => {
      setRotation(180);
    }, 1000);

    // Clean up glitch after animation
    const cleanupTimer = setTimeout(() => {
      clearInterval(glitchInterval);
      setShowGlitch(false);
    }, 3000);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(rotationTimer);
      clearTimeout(cleanupTimer);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-void flex items-center justify-center transition-transform duration-1000 ease-in-out"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Glitch tear effect */}
      {showGlitch && (
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(90deg, transparent 0%, hsl(0 100% 50% / 0.1) 25%, transparent 50%),
                linear-gradient(180deg, transparent 0%, hsl(180 100% 50% / 0.1) 50%, transparent 100%)
              `,
              animation: 'glitch 0.1s steps(3) infinite'
            }}
          />
          {/* Horizontal glitch lines */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 bg-primary/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: 0,
                right: 0,
                transform: `translateX(${(Math.random() - 0.5) * 20}px)`,
                opacity: Math.random()
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center space-y-8 z-10 p-8">
        <GlitchText as="h1" className="text-4xl md:text-6xl text-accent">
          YOU CAN ENTER
        </GlitchText>
        
        <GlitchText as="h2" className="text-3xl md:text-5xl">
          THE UPSIDE DOWN
        </GlitchText>

        <div className="mt-8">
          <p className="text-muted-foreground font-rajdhani text-lg font-medium">
            Team {teamId} has been rescued!
          </p>
        </div>

        <div className="animate-pulse">
          <p className="text-primary font-cinzel text-xl tracking-widest">
            ★ VICTORY ★
          </p>
        </div>
      </div>

      {/* CRT scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.1) 2px,
            rgba(0,0,0,0.1) 4px
          )`
        }}
      />
    </div>
  );
};