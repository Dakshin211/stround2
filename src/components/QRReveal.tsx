import React, { useState, useEffect } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';

interface QRRevealProps {
  onKeyFound: () => void;
}

export const QRReveal: React.FC<QRRevealProps> = ({ onKeyFound }) => {
  const [showSecondQR, setShowSecondQR] = useState(false);
  const [secondQROpacity, setSecondQROpacity] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);

  // First QR countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowSecondQR(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fade in second QR
  useEffect(() => {
    if (!showSecondQR) return;

    const fadeStart = Date.now();
    const fadeDuration = 4000; // 4 seconds

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - fadeStart;
      const progress = Math.min(elapsed / fadeDuration, 1);
      setSecondQROpacity(progress);

      if (progress >= 1) {
        clearInterval(fadeInterval);
      }
    }, 50);

    return () => clearInterval(fadeInterval);
  }, [showSecondQR]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-4">
      <GlitchText as="h2" className="text-3xl text-accent">
        FIND THE PORTAL
      </GlitchText>
      
      {/* Main QR Code */}
      <div 
        className="bg-black/90 border-2 border-primary rounded-lg p-4 backdrop-blur-sm"
        style={{ maxWidth: '280px' }}
      >
        <img 
          src="https://i.postimg.cc/34XDsFJt/image.png"
          alt="QR Code"
          className="w-full"
          style={{ 
            filter: 'invert(1) sepia(100%) saturate(300%) hue-rotate(-50deg)',
          }}
        />
      </div>
      
      {!showSecondQR && (
        <p className="text-muted-foreground/70 font-rajdhani text-lg">
          {timeLeft}s remaining...
        </p>
      )}

      {/* Second QR with fade effect */}
      {showSecondQR && (
        <div 
          className="flex flex-col items-center space-y-4 transition-opacity"
          style={{ opacity: secondQROpacity }}
        >
          <div 
            className="bg-black/90 border border-primary/50 rounded-lg p-2"
            style={{ maxWidth: '140px' }}
          >
            <img 
              src="https://i.postimg.cc/SnH2jvXk/image.png"
              alt="Key QR Code"
              className="w-full"
              style={{ 
                filter: 'invert(1) sepia(100%) saturate(300%) hue-rotate(-50deg)',
              }}
            />
          </div>
          
          <ScaryButton 
            className="text-lg py-4 px-8"
            onClick={onKeyFound}
          >
            Found the Key for Upside Down
          </ScaryButton>
        </div>
      )}
    </div>
  );
};
