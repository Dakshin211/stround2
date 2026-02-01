import React, { useEffect, useState } from 'react';
import { GlitchText } from '@/components/GlitchText';

interface VictoryScreenProps {
  teamId: string;
  role: 'U' | 'H';
  onUComplete?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ teamId, role, onUComplete }) => {
  const [phase, setPhase] = useState<'dark' | 'tear' | 'reveal' | 'complete'>('dark');
  const [showText, setShowText] = useState(false);
  const [showSecondText, setShowSecondText] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [portalScale, setPortalScale] = useState(0);
  const [lightBeams, setLightBeams] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [electricArcs, setElectricArcs] = useState(false);

  useEffect(() => {
    // Phase 0: Intense shake and glitch start (0-1s)
    const glitchStart = setTimeout(() => {
      setGlitchIntensity(1);
      setShakeIntensity(5);
    }, 100);

    // Phase 1: Dark tear with portal opening (1-2s)
    const tearTimer = setTimeout(() => {
      setPhase('tear');
      setElectricArcs(true);
      setShakeIntensity(8);
    }, 1000);

    // Phase 2: Portal scales up (2-3s)
    const portalTimer = setTimeout(() => {
      setPortalScale(1);
      setLightBeams(true);
    }, 2000);

    // Phase 3: Reveal phase - shake subsides (3s)
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      setShowText(true);
      setShakeIntensity(2);
    }, 3000);

    // Phase 4: Show second text for H (4s)
    const secondTextTimer = setTimeout(() => {
      if (role === 'H') {
        setShowSecondText(true);
      }
    }, 4000);

    // Phase 5: Show particles and complete (5s)
    const particlesTimer = setTimeout(() => {
      setShowParticles(true);
      setPhase('complete');
      setShakeIntensity(0);
    }, 5000);

    // Rotation for U player (flip from upside down to right side up)
    const rotationTimer = setTimeout(() => {
      if (role === 'U') {
        setRotation(180);
      }
    }, 3500);

    // For U player: call onUComplete after 15 seconds
    let uCompleteTimer: NodeJS.Timeout | null = null;
    if (role === 'U' && onUComplete) {
      uCompleteTimer = setTimeout(() => {
        onUComplete();
      }, 15000);
    }

    return () => {
      clearTimeout(glitchStart);
      clearTimeout(tearTimer);
      clearTimeout(portalTimer);
      clearTimeout(revealTimer);
      clearTimeout(secondTextTimer);
      clearTimeout(particlesTimer);
      clearTimeout(rotationTimer);
      if (uCompleteTimer) clearTimeout(uCompleteTimer);
    };
  }, [role, onUComplete]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ 
        // U page: don't rotate the whole page, just animate
        transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: shakeIntensity > 0 ? `shake ${0.1}s ease-in-out infinite` : undefined,
      }}
    >
      {/* Dynamic background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: phase === 'dark' 
            ? 'radial-gradient(ellipse at center, hsl(var(--void)) 0%, #000 100%)'
            : phase === 'tear'
            ? 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, hsl(var(--void)) 30%, #000 100%)'
            : 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, hsl(var(--void)) 40%, #000 100%)'
        }}
      />

      {/* Dimensional tear/crack effect */}
      {phase !== 'dark' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={`tear-${i}`}
              className="absolute bg-primary/60"
              style={{
                top: '50%',
                left: '50%',
                width: `${150 + i * 30}px`,
                height: '2px',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)',
                animation: 'pulse 0.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
                opacity: phase === 'tear' ? 1 : 0.3,
                transition: 'opacity 1s ease-out'
              }}
            />
          ))}
        </div>
      )}

      {/* Electric arcs during tear */}
      {electricArcs && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={`arc-${i}`}
              className="absolute"
              style={{
                top: `${40 + Math.random() * 20}%`,
                left: `${40 + Math.random() * 20}%`,
                width: '3px',
                height: `${50 + Math.random() * 100}px`,
                background: 'linear-gradient(to bottom, transparent, hsl(var(--primary)), transparent)',
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: 'electricArc 0.2s ease-out infinite',
                animationDelay: `${Math.random() * 0.5}s`,
                opacity: phase === 'complete' ? 0 : 0.8,
                transition: 'opacity 1s ease-out'
              }}
            />
          ))}
        </div>
      )}

      {/* Portal effect */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '400px',
          height: '400px',
          transform: `translate(-50%, -50%) scale(${portalScale})`,
          transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Outer ring */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid hsl(var(--primary) / 0.6)',
            boxShadow: `
              0 0 30px hsl(var(--primary) / 0.5),
              0 0 60px hsl(var(--primary) / 0.3),
              inset 0 0 50px hsl(var(--primary) / 0.2)
            `,
            animation: 'portalPulse 2s ease-in-out infinite'
          }}
        />
        {/* Inner rings */}
        <div 
          className="absolute inset-8 rounded-full"
          style={{
            border: '2px solid hsl(var(--primary) / 0.4)',
            animation: 'spin 8s linear infinite reverse'
          }}
        />
        <div 
          className="absolute inset-16 rounded-full"
          style={{
            border: '1px solid hsl(var(--primary) / 0.3)',
            animation: 'spin 12s linear infinite'
          }}
        />
      </div>

      {/* Light beams */}
      {lightBeams && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <div
              key={`beam-${i}`}
              className="absolute top-1/2 left-1/2 origin-bottom"
              style={{
                width: '4px',
                height: '100vh',
                background: `linear-gradient(to top, 
                  hsl(var(--primary) / 0.8), 
                  hsl(var(--primary) / 0.4) 30%, 
                  transparent 70%
                )`,
                transform: `translate(-50%, -100%) rotate(${i * 22.5}deg)`,
                animation: 'beamPulse 2s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Glitch lines overlay */}
      {glitchIntensity > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={`glitch-${i}`}
              className="absolute h-px bg-primary/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: 0,
                right: 0,
                transform: `translateX(${(Math.random() - 0.5) * 50}px)`,
                opacity: Math.random() * glitchIntensity,
                animation: 'glitch 0.15s steps(2) infinite'
              }}
            />
          ))}
        </div>
      )}

      {/* Floating particles/embers */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                background: i % 3 === 0 
                  ? 'hsl(var(--primary))' 
                  : i % 3 === 1 
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--foreground))',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `floatParticle ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: '0 0 6px currentColor',
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="text-center space-y-8 z-10 p-8">
        {/* Main title with epic fade-in */}
        <div 
          className={`transition-all duration-1000 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="mb-6">
            <p className="text-primary font-cinzel text-lg tracking-[0.3em] mb-2 stranger-title flicker-slow">
              STRANGER THINGS
            </p>
          </div>
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
      </div>

      {/* CRT scanlines overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.15) 2px,
            rgba(0,0,0,0.15) 4px
          )`
        }}
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)`
        }}
      />

      {/* Custom animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(${shakeIntensity}px, -${shakeIntensity}px); }
          50% { transform: translate(-${shakeIntensity}px, ${shakeIntensity}px); }
          75% { transform: translate(${shakeIntensity}px, ${shakeIntensity}px); }
        }
        
        @keyframes electricArc {
          0%, 100% { opacity: 0; transform: rotate(var(--rotation)) scaleY(0.5); }
          50% { opacity: 0.9; transform: rotate(var(--rotation)) scaleY(1.2); }
        }
        
        @keyframes portalPulse {
          0%, 100% { 
            box-shadow: 0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3), inset 0 0 50px hsl(var(--primary) / 0.2);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 50px hsl(var(--primary) / 0.7), 0 0 100px hsl(var(--primary) / 0.5), inset 0 0 80px hsl(var(--primary) / 0.3);
            transform: scale(1.05);
          }
        }
        
        @keyframes beamPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        @keyframes floatParticle {
          0%, 100% { 
            transform: translateY(0) translateX(0) scale(1); 
            opacity: 0.6; 
          }
          25% { 
            transform: translateY(-30px) translateX(10px) scale(1.2); 
          }
          50% { 
            transform: translateY(-20px) translateX(-15px) scale(0.8); 
            opacity: 1; 
          }
          75% { 
            transform: translateY(-40px) translateX(5px) scale(1.1); 
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes glitch {
          0% { transform: translateX(0); }
          25% { transform: translateX(-30px); opacity: 0.5; }
          50% { transform: translateX(20px); opacity: 0.8; }
          75% { transform: translateX(-10px); opacity: 0.3; }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
