import React, { useEffect, useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ThunderEffect } from '@/components/ThunderEffect';

interface EscapeScreenProps {
  teamId: string;
  completionTime?: string; // e.g., "9:32"
}

export const EscapeScreen: React.FC<EscapeScreenProps> = ({ teamId, completionTime }) => {
  const [phase, setPhase] = useState<'dark' | 'portal' | 'emerge' | 'celebrate'>('dark');
  const [showText, setShowText] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [portalScale, setPortalScale] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [particles, setParticles] = useState(false);
  const [lightRays, setLightRays] = useState(false);
  const [emergeProgress, setEmergeProgress] = useState(0);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    // Phase 1: Portal opens from center (0-2s)
    const portalOpen = setTimeout(() => {
      setPhase('portal');
      setPortalScale(1);
      setGlowIntensity(0.5);
    }, 500);

    // Phase 2: Emerge from portal (2-4s)
    const emergeStart = setTimeout(() => {
      setPhase('emerge');
      setLightRays(true);
      // Animate emerge progress
      let progress = 0;
      const emergeInterval = setInterval(() => {
        progress += 0.05;
        setEmergeProgress(Math.min(progress, 1));
        setGlowIntensity(0.5 + progress * 0.5);
        if (progress >= 1) clearInterval(emergeInterval);
      }, 50);
    }, 2000);

    // Phase 3: Celebrate (4-6s)
    const celebrateStart = setTimeout(() => {
      setPhase('celebrate');
      setParticles(true);
      setConfetti(true);
      setShowText(true);
    }, 4000);

    // Show time (5s)
    const showTimeTimer = setTimeout(() => {
      setShowTime(true);
    }, 5500);

    return () => {
      clearTimeout(portalOpen);
      clearTimeout(emergeStart);
      clearTimeout(celebrateStart);
      clearTimeout(showTimeTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-void">
      <CRTOverlay />
      <ThunderEffect intensity="medium" />

      {/* Dark void background with glow */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, 
            hsl(var(--primary) / ${glowIntensity * 0.4}) 0%, 
            hsl(var(--void)) 40%, 
            #000 100%
          )`
        }}
      />

      {/* Portal effect */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '500px',
          height: '500px',
          transform: `translate(-50%, -50%) scale(${portalScale})`,
          transition: 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Outer glow ring */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            border: '4px solid hsl(var(--primary) / 0.8)',
            boxShadow: `
              0 0 60px hsl(var(--primary) / 0.6),
              0 0 120px hsl(var(--primary) / 0.4),
              inset 0 0 80px hsl(var(--primary) / 0.3)
            `,
            animation: phase !== 'dark' ? 'portalPulse 1.5s ease-in-out infinite' : undefined
          }}
        />
        {/* Inner rings */}
        <div 
          className="absolute inset-8 rounded-full"
          style={{
            border: '3px solid hsl(var(--accent) / 0.6)',
            animation: 'spin 6s linear infinite reverse'
          }}
        />
        <div 
          className="absolute inset-16 rounded-full"
          style={{
            border: '2px solid hsl(var(--primary) / 0.4)',
            animation: 'spin 10s linear infinite'
          }}
        />
        
        {/* Emerging figure silhouette */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 transition-all duration-500"
          style={{
            transform: `translate(-50%, ${-50 - emergeProgress * 30}%)`,
            opacity: emergeProgress,
          }}
        >
          <div 
            className="text-8xl"
            style={{
              filter: `drop-shadow(0 0 30px hsl(var(--primary)))`,
              animation: emergeProgress >= 1 ? 'float 2s ease-in-out infinite' : undefined
            }}
          >
            👥
          </div>
        </div>
      </div>

      {/* Light rays */}
      {lightRays && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(24)].map((_, i) => (
            <div
              key={`ray-${i}`}
              className="absolute top-1/2 left-1/2 origin-bottom"
              style={{
                width: '6px',
                height: '150vh',
                background: `linear-gradient(to top, 
                  hsl(var(--primary) / ${0.8 * emergeProgress}), 
                  hsl(var(--accent) / ${0.4 * emergeProgress}) 40%, 
                  transparent 70%
                )`,
                transform: `translate(-50%, -100%) rotate(${i * 15}deg)`,
                animation: 'rayPulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating particles */}
      {particles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(80)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                background: i % 4 === 0 
                  ? 'hsl(var(--primary))' 
                  : i % 4 === 1 
                  ? 'hsl(var(--accent))'
                  : i % 4 === 2
                  ? '#FFD700'
                  : '#fff',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `floatUp ${4 + Math.random() * 4}s ease-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                boxShadow: '0 0 10px currentColor',
              }}
            />
          ))}
        </div>
      )}

      {/* Confetti effect */}
      {confetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute"
              style={{
                width: `${8 + Math.random() * 8}px`,
                height: `${12 + Math.random() * 8}px`,
                background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
                top: '-5%',
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `confettiFall ${3 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="text-center space-y-6 z-20 p-8">
        <div 
          className={`transition-all duration-1000 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="mb-6">
            <p className="text-primary font-cinzel text-lg tracking-[0.3em] mb-2 stranger-title flicker-slow">
              STRANGER THINGS
            </p>
          </div>
          
          <GlitchText as="h1" className="text-4xl md:text-6xl text-accent mb-4">
            YOU ESCAPED
          </GlitchText>
          
          <GlitchText as="h2" className="text-3xl md:text-5xl text-primary">
            THE UPSIDE DOWN
          </GlitchText>
          
          <p className="text-foreground font-rajdhani text-xl mt-6 font-medium">
            The portal has closed. You are safe... for now.
          </p>
        </div>

        {/* Completion time */}
        {showTime && completionTime && (
          <div 
            className="transition-all duration-1000 opacity-100 translate-y-0"
            style={{
              animation: 'fadeIn 1s ease-out'
            }}
          >
            <div className="inline-block px-8 py-4 border-2 border-primary rounded-lg bg-primary/10 backdrop-blur-sm">
              <p className="text-muted-foreground font-rajdhani text-sm uppercase tracking-widest mb-1">
                Escape Time
              </p>
              <p className="text-primary font-cinzel text-4xl tracking-wider">
                {completionTime}
              </p>
            </div>
          </div>
        )}

        {/* Team celebration */}
        {showText && (
          <div 
            className="transition-all duration-1000 delay-500 opacity-100"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            <p className="text-accent font-cinzel text-2xl">
              🏆 CONGRATULATIONS 🏆
            </p>
          </div>
        )}
      </div>

      {/* CRT scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
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

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)`
        }}
      />

      {/* Custom animations */}
      <style>{`
        @keyframes portalPulse {
          0%, 100% { 
            box-shadow: 0 0 60px hsl(var(--primary) / 0.6), 0 0 120px hsl(var(--primary) / 0.4), inset 0 0 80px hsl(var(--primary) / 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 100px hsl(var(--primary) / 0.8), 0 0 180px hsl(var(--primary) / 0.6), inset 0 0 120px hsl(var(--primary) / 0.4);
            transform: scale(1.05);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(-50%, -80%) scale(1); }
          50% { transform: translate(-50%, -85%) scale(1.05); }
        }
        
        @keyframes rayPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes floatUp {
          0% { 
            transform: translateY(0) translateX(0) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px) rotate(720deg); 
            opacity: 0; 
          }
        }
        
        @keyframes confettiFall {
          0% { 
            transform: translateY(0) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100vh) rotate(720deg); 
            opacity: 0; 
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
