import React, { useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';

interface FinalPasscodeProps {
  onSuccess: () => void;
  expectedCode: string;
  partialCode1: string;
  teamId: string;
  partialCode2: string;
}

export const FinalPasscode: React.FC<FinalPasscodeProps> = ({ 
  onSuccess,
  partialCode1,
  teamId,
  partialCode2
}) => {
  const [passcode, setPasscode] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  // Correct passcode is partialCode1 + teamId + partialCode2 (concatenation)
  const expectedCode = `${partialCode1}${teamId}${partialCode2}`;

  const handleSubmit = () => {
    if (passcode.trim().toUpperCase() === expectedCode.toUpperCase()) {
      onSuccess();
    } else {
      setIsWrong(true);
      setPasscode('');
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-4">
      <div className="text-center space-y-2">
        <p className="text-primary font-cinzel text-lg tracking-[0.3em] stranger-title">
          STRANGER THINGS
        </p>
        <GlitchText as="h1" className="text-4xl text-accent">
          FINAL ESCAPE
        </GlitchText>
      </div>
      
      <div className="bg-card/80 border border-border rounded-lg p-8 backdrop-blur-sm w-full max-w-md space-y-6">
        <p className="text-foreground font-rajdhani text-2xl font-semibold text-center">
          Enter the final passcode for Hawkins Lab Escape
        </p>
        
        <Input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value.toUpperCase())}
          placeholder="ENTER PASSCODE..."
          className={`bg-card/80 border-border text-center font-cinzel text-2xl tracking-widest py-6 ${
            isWrong ? 'border-destructive animate-shake' : ''
          }`}
          autoFocus
        />

        {isWrong && (
          <p className="text-destructive font-rajdhani text-center text-lg flicker font-semibold">
            WRONG PASSCODE!
          </p>
        )}

        <ScaryButton 
          className="w-full text-xl py-6"
          onClick={handleSubmit}
          disabled={!passcode.trim()}
        >
          Escape the Upside Down
        </ScaryButton>
      </div>
    </div>
  );
};
