import React, { useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';

interface FinalRescueProps {
  role: 'U' | 'H';
  navigationQR: string;
  expectedCode: string; // codes.h + teamId + codes.u
  onVictory: () => void;
}

export const FinalRescue: React.FC<FinalRescueProps> = ({ 
  role, 
  navigationQR,
  expectedCode,
  onVictory
}) => {
  const [phase, setPhase] = useState<'navigate' | 'key' | 'code'>('navigate');
  const [colorInput, setColorInput] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [finalCode, setFinalCode] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleKeyFound = () => {
    setPhase('code');
  };

  const handleSubmitFinalCode = () => {
    const isCorrect = finalCode.toUpperCase().trim() === expectedCode.toUpperCase();
    
    if (isCorrect) {
      onVictory();
    } else {
      setAttempts((prev) => prev + 1);
      setIsWrong(true);
      setFinalCode('');
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  // Safety check - if critical data is missing, show loading
  if (!expectedCode || expectedCode.length < 3) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <p className="text-primary font-cinzel text-2xl flicker-slow">LOADING...</p>
          </div>
          <p className="text-muted-foreground font-rajdhani font-medium">
            Preparing final rescue...
          </p>
        </div>
      </div>
    );
  }

  // U Player View - Waiting
  if (role === 'U') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <GlitchText as="h2" className="text-2xl mb-2">
            AWAITING RESCUE
          </GlitchText>
        </div>

        <div className="text-center space-y-4 static-noise p-8 rounded-lg">
          <div className="flicker-slow">
            <p className="text-foreground font-cinzel text-xl tracking-wide">
              YOU ARE TRAPPED
            </p>
            <p className="text-primary font-cinzel text-2xl tracking-widest">
              IN THE UPSIDE DOWN
            </p>
          </div>
          <p className="text-muted-foreground font-rajdhani font-medium">
            H must complete the final rescue...
          </p>
        </div>
      </div>
    );
  }

  // H Player View
  return (
    <div className="space-y-6">
      <div className="text-center">
        <GlitchText as="h2" className="text-2xl mb-2">
          FINAL RESCUE
        </GlitchText>
      </div>

      {phase === 'navigate' && (
        <div className="space-y-4">
          <div className="bg-card/80 border border-primary/50 rounded-lg p-6 backdrop-blur-sm text-center">
            <p className="text-foreground font-rajdhani text-xl font-semibold mb-4">
              FOLLOW THE PATH
            </p>
            {navigationQR ? (
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={navigationQR} alt="Navigation QR" className="w-48 h-48" />
              </div>
            ) : (
              <p className="text-muted-foreground font-rajdhani font-medium">
                Follow the marked path to find the key
              </p>
            )}
          </div>

          <ScaryButton 
            className="w-full"
            onClick={() => setPhase('key')}
          >
            I Found The Location
          </ScaryButton>
        </div>
      )}

      {phase === 'key' && (
        <div className="space-y-4">
          <div className="bg-card/80 border border-border rounded-lg p-6 backdrop-blur-sm">
            <p className="text-foreground font-rajdhani text-lg font-semibold mb-4 text-center">
              Enter the key details:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-muted-foreground font-rajdhani text-sm font-medium">
                  Key Color:
                </label>
                <Input
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="RED, BLUE, etc."
                  className="bg-secondary/50 border-border text-center font-cinzel text-xl"
                />
              </div>
              
              <div>
                <label className="text-muted-foreground font-rajdhani text-sm font-medium">
                  4-Digit Number:
                </label>
                <Input
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className="bg-secondary/50 border-border text-center font-cinzel text-2xl tracking-widest"
                />
              </div>
            </div>
          </div>

          <ScaryButton 
            className="w-full"
            onClick={handleKeyFound}
            disabled={!colorInput.trim() || numberInput.length !== 4}
          >
            Continue
          </ScaryButton>
        </div>
      )}

      {phase === 'code' && (
        <div className="space-y-4">
          <div className="bg-card/80 border border-accent/50 rounded-lg p-6 backdrop-blur-sm text-center">
            <GlitchText as="h3" className="text-xl mb-4">
              ENTER FINAL CODE
            </GlitchText>
            <p className="text-muted-foreground font-rajdhani text-sm font-medium mb-4">
              Format: [Your Code] + [Team ID] + [U's Code]
            </p>
            
            <Input
              value={finalCode}
              onChange={(e) => setFinalCode(e.target.value.toUpperCase())}
              placeholder="ENTER FULL CODE..."
              className={`bg-secondary/50 border-border text-center font-cinzel text-xl tracking-wider ${
                isWrong ? 'border-destructive animate-shake' : ''
              }`}
            />
          </div>

          {isWrong && (
            <p className="text-destructive font-rajdhani text-center text-sm flicker font-semibold">
              INCORRECT CODE! Attempt {attempts}
            </p>
          )}

          <ScaryButton 
            className="w-full"
            onClick={handleSubmitFinalCode}
            disabled={!finalCode.trim()}
          >
            RESCUE FROM THE UPSIDE DOWN
          </ScaryButton>
        </div>
      )}
    </div>
  );
};