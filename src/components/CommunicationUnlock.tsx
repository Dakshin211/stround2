import React, { useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';

interface CommunicationUnlockProps {
  onReady: () => void;
  isReady?: boolean;
  otherReady?: boolean;
}

export const CommunicationUnlock: React.FC<CommunicationUnlockProps> = ({ 
  onReady, 
  isReady = false,
  otherReady = false
}) => {
  const [answered, setAnswered] = useState(false);

  const handleYes = () => {
    setAnswered(true);
    onReady();
  };

  const handleNo = () => {
    // Show waiting message
    setAnswered(true);
  };

  if (answered || isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
        <GlitchText as="h1" className="text-2xl md:text-3xl text-accent">
          {otherReady ? 'SYNCHRONIZING...' : 'WAITING...'}
        </GlitchText>
        <p className="text-muted-foreground font-rajdhani font-medium">
          {otherReady 
            ? 'Both players confirmed! Proceeding...' 
            : 'Waiting for the other player to confirm...'}
        </p>
        {isReady && !otherReady && (
          <div className="text-primary/60 font-rajdhani text-sm animate-pulse">
            You are ready ✓
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center">
      <div className="space-y-4">
        <GlitchText as="h1" className="text-3xl md:text-4xl text-accent">
          COMMUNICATION
        </GlitchText>
        <GlitchText as="h2" className="text-2xl md:text-3xl">
          ESTABLISHED
        </GlitchText>
      </div>

      <div className="bg-card/80 border border-accent/50 rounded-lg p-6 backdrop-blur-sm max-w-sm">
        <p className="text-foreground font-rajdhani text-lg font-medium">
          Did you receive your walkie-talkie?
        </p>
      </div>

      <div className="flex gap-4">
        <ScaryButton 
          size="lg"
          onClick={handleYes}
        >
          YES
        </ScaryButton>
        <ScaryButton 
          size="lg"
          variant="secondary"
          onClick={handleNo}
        >
          NO
        </ScaryButton>
      </div>
    </div>
  );
};
