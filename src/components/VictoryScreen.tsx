import React, { useEffect, useState } from 'react';
import { GlitchText } from '@/components/GlitchText';

interface VictoryScreenProps {
  teamId: string;
  role: 'U' | 'H';
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ teamId, role }) => {
  const [phase, setPhase] = useState<'dark' | 'reveal' | 'complete'>('dark');
  const [showText, setShowText] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Phase 1: Dark with glitch (1.5s)
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      setShowText(true);
    }, 1500);

    // Phase 2: Show second text (3s)
    const secondTextTimer = setTimeout(() => {
      setShowSecondText(true);
    }, 3000);

    // Phase 3: Show stars and complete (4s)
    const starsTimer = setTimeout(() => {
      setShowStars(true);
      setPhase('complete');
    }, 4000);

    // Rotation for U player (flip from upside down to right side up)
    const rotationTimer = setTimeout(() => {
      if (role === 'U') {
        setRotation(180);
      }
    }, 2000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(secondTextTimer);
      clearTimeout(starsTimer);
      clearTimeout(rotationTimer);
    };
  }, [role]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out overflow-hidden"
      style={{ 
        transform: role === 'U' ? `rotate(${rotation}deg)` : undefined,
        background: phase === 'dark' 
          ? 'radial-gradient(ellipse at center, hsl(var(--void)) 0%, #000 100%)'
          : 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.2) 0%, hsl(var(--void)) 50%, #000 100%)'
      }}
    >
      {/* Glitch tear effect during dark phase */}
      {phase === 'dark' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 bg-primary/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: 0,
                right: 0,
                transform: `translateX(${(Math.random() - 0.5) * 40}px)`,
                opacity: Math.random(),
                animation: 'glitch 0.15s steps(2) infinite'
              }}
            />
          ))}
        </div>
      )}

      {/* Radial light burst on reveal */}
      {phase !== 'dark' && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            background: `radial-gradient(circle at center, 
              hsl(var(--primary) / 0.3) 0%, 
              hsl(var(--primary) / 0.1) 30%, 
              transparent 60%
            )`,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
      )}

      {/* Floating particles/stars */}
      {showStars && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.4 + Math.random() * 0.6
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="text-center space-y-8 z-10 p-8">
        {/* Main title with fade-in */}
        <div 
          className={`transition-all duration-1000 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <GlitchText as="h1" className="text-4xl md:text-6xl text-primary mb-4">
            HAWKINS LAB
          </GlitchText>
          <GlitchText as="h2" className="text-3xl md:text-5xl text-accent">
            IS UNLOCKED
          </GlitchText>
        </div>

        {/* Second text - only for H player */}
        {role === 'H' && (
          <div 
            className={`transition-all duration-1000 delay-500 ${showSecondText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <p className="text-foreground font-cinzel text-2xl md:text-3xl tracking-wide">
              You can enter
            </p>
            <GlitchText as="h3" className="text-3xl md:text-4xl text-accent mt-2">
              THE UPSIDE DOWN
            </GlitchText>
          </div>
        )}

        {/* Team info */}
        <div 
          className={`transition-all duration-700 delay-1000 ${showStars ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-muted-foreground font-rajdhani text-lg font-medium">
            Team {teamId} has escaped!
          </p>
        </div>

        {/* Victory badge */}
        <div 
          className={`transition-all duration-700 delay-1000 ${showStars ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        >
          <div className="inline-block px-8 py-4 border-2 border-primary rounded-lg bg-primary/10 backdrop-blur-sm">
            <p className="text-primary font-cinzel text-2xl tracking-[0.3em]">
              ★ VICTORY ★
            </p>
          </div>
        </div>
      </div>

      {/* CRT scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
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

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)`
        }}
      />

      {/* Add float animation to index.css keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
