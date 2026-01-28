import React, { useState, useEffect, useMemo, useRef } from 'react';
import alphabetWallBg from '@/assets/alphabet-wall-original.png';

interface AlphabetWallProps {
  activeLetter: string;
  transmissionId?: number; // Unique ID for each letter transmission
}

// Light colors for the alphabet wall
const LIGHT_COLORS = [
  { name: 'yellow', hsl: '45 100% 60%', glow: '45 100% 70%' },
  { name: 'red', hsl: '0 100% 50%', glow: '0 100% 60%' },
  { name: 'blue', hsl: '210 100% 50%', glow: '210 100% 60%' },
  { name: 'green', hsl: '120 100% 40%', glow: '120 100% 50%' }
];

// Precisely calibrated positions - using provided coordinates
const LETTER_POSITIONS: { letter: string; left: string; top: string }[] = [
  // --- First Row (A - I) ---
  { letter: 'A', left: '19.5%', top: '30%' },
  { letter: 'B', left: '27.5%', top: '29%' },
  { letter: 'C', left: '35.0%', top: '29%' },
  { letter: 'D', left: '42.0%', top: '31%' },
  { letter: 'E', left: '49.0%', top: '31%' },
  { letter: 'F', left: '56.5%', top: '30%' },
  { letter: 'G', left: '63.5%', top: '29%' },
  { letter: 'H', left: '71.0%', top: '28%' },
  { letter: 'I', left: '78.0%', top: '28%' },

  // --- Second Row (J - R) ---
  { letter: 'J', left: '19.0%', top: '51%' },
  { letter: 'K', left: '26.5%', top: '53%' },
  { letter: 'L', left: '33.5%', top: '53%' },
  { letter: 'M', left: '40.5%', top: '53%' },
  { letter: 'N', left: '47.5%', top: '53%' },
  { letter: 'O', left: '54.5%', top: '53%' },
  { letter: 'P', left: '61.5%', top: '51%' },
  { letter: 'Q', left: '68.5%', top: '50%' },
  { letter: 'R', left: '75.5%', top: '51%' },

  // --- Third Row (S - Z) ---
  { letter: 'S', left: '27.5%', top: '72%' },
  { letter: 'T', left: '34.5%', top: '73%' },
  { letter: 'U', left: '41.5%', top: '75%' },
  { letter: 'V', left: '48.5%', top: '75%' },
  { letter: 'W', left: '56.0%', top: '74%' },
  { letter: 'X', left: '63.5%', top: '72%' },
  { letter: 'Y', left: '71.0%', top: '70%' },
  { letter: 'Z', left: '78.5%', top: '71%' }
];

// Preload the alphabet wall image immediately
const preloadImage = new Image();
preloadImage.src = alphabetWallBg;

export const AlphabetWall: React.FC<AlphabetWallProps> = ({ activeLetter, transmissionId = 0 }) => {
  const [glowing, setGlowing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(preloadImage.complete);
  const [currentColor, setCurrentColor] = useState<typeof LIGHT_COLORS[0]>(LIGHT_COLORS[0]);
  const lastTransmissionRef = useRef<number>(0);
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random colors for each letter (stable per session)
  const letterColors = useMemo(() => {
    const colors: Record<string, typeof LIGHT_COLORS[0]> = {};
    LETTER_POSITIONS.forEach(pos => {
      colors[pos.letter] = LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)];
    });
    return colors;
  }, []);

  // Ensure image is loaded
  useEffect(() => {
    if (!preloadImage.complete) {
      preloadImage.onload = () => setImageLoaded(true);
    }
  }, []);

  // Handle letter changes with repeat detection
  useEffect(() => {
    if (!activeLetter) return;

    // Clear any existing timeout
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current);
    }

    // If same letter transmitted again (transmissionId changed), toggle off first
    if (transmissionId !== lastTransmissionRef.current) {
      lastTransmissionRef.current = transmissionId;
      
      // For repeated letters, turn off briefly then on
      setGlowing(false);
      
      // Small delay to create visible "off" state
      setTimeout(() => {
        // Pick a random color for this activation
        setCurrentColor(LIGHT_COLORS[Math.floor(Math.random() * LIGHT_COLORS.length)]);
        setGlowing(true);
        
        // Keep glowing for 2 seconds
        glowTimeoutRef.current = setTimeout(() => {
          setGlowing(false);
        }, 2000);
      }, 50);
    }

    return () => {
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current);
      }
    };
  }, [activeLetter, transmissionId]);

  const activePosition = LETTER_POSITIONS.find(
    (pos) => pos.letter === activeLetter.toUpperCase()
  );

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Wall background - fills the entire container */}
      {imageLoaded ? (
        <img 
          src={alphabetWallBg} 
          alt="Alphabet Wall" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-card/50 flex items-center justify-center">
          <p className="text-muted-foreground font-rajdhani">Loading wall...</p>
        </div>
      )}
      
      {/* Light bulb glow - only shows when glowing is true */}
      {activePosition && glowing && (
        <div
          key={`glow-${transmissionId}`}
          className="absolute pointer-events-none"
          style={{
            left: activePosition.left,
            top: activePosition.top,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          {/* Large outer glow */}
          <div 
            className="absolute animate-pulse"
            style={{
              width: '120px',
              height: '120px',
              background: `radial-gradient(circle, hsl(${currentColor.glow} / 1) 0%, hsl(${currentColor.hsl} / 0.7) 35%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
              borderRadius: '50%',
              boxShadow: `0 0 80px 40px hsl(${currentColor.hsl} / 0.6), 0 0 120px 60px hsl(${currentColor.glow} / 0.3)`
            }}
          />
          
          {/* Inner bright bulb */}
          <div 
            style={{
              width: '24px',
              height: '24px',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, white 0%, hsl(${currentColor.hsl}) 70%)`,
              boxShadow: `0 0 30px 15px hsl(${currentColor.glow} / 0.9), 0 0 60px 30px hsl(${currentColor.hsl} / 0.5)`
            }}
          />
        </div>
      )}
    </div>
  );
};
