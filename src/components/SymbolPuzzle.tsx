import React, { useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';

interface SymbolPuzzleProps {
  role: 'U' | 'H';
  partialCode2: string;
  receivedCode: string | null;
  onCodeSubmit: (code: string) => void;
}

export const SymbolPuzzle: React.FC<SymbolPuzzleProps> = ({ 
  role, 
  partialCode2,
  receivedCode,
  onCodeSubmit 
}) => {
  const [symbolInput, setSymbolInput] = useState('');
  const [numericInput, setNumericInput] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleScanComplete = () => {
    setHasScanned(true);
  };

  const handleSubmit = () => {
    onCodeSubmit(numericInput);
    setSubmitted(true);
  };

  // U Player View
  if (role === 'U') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <GlitchText as="h2" className="text-2xl mb-2">
            SYMBOL TRANSMISSION
          </GlitchText>
        </div>

        {!hasScanned && (
          <div className="space-y-4">
            <div className="bg-card/80 border border-primary/50 rounded-lg p-6 backdrop-blur-sm text-center">
              <p className="text-foreground font-rajdhani text-xl font-semibold mb-4">
                RECEIVE THE ENVELOPE
              </p>
              <p className="text-muted-foreground font-rajdhani font-medium">
                A volunteer will give you a symbol + hash card
              </p>
            </div>

            <ScaryButton 
              className="w-full"
              onClick={handleScanComplete}
            >
              I Have The Card
            </ScaryButton>
          </div>
        )}

        {hasScanned && !submitted && (
          <div className="space-y-4">
            <div className="bg-card/80 border border-border rounded-lg p-6 backdrop-blur-sm">
              <p className="text-muted-foreground font-rajdhani text-sm font-medium mb-2">
                Enter the 3 letters from your card:
              </p>
              <Input
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                placeholder="ABC"
                maxLength={3}
                className="bg-secondary/50 border-border text-center font-cinzel text-2xl tracking-widest mb-4"
              />
              
              <p className="text-muted-foreground font-rajdhani text-sm font-medium mb-2">
                Enter numeric code:
              </p>
              <Input
                value={numericInput}
                onChange={(e) => setNumericInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123"
                className="bg-secondary/50 border-border text-center font-cinzel text-2xl tracking-widest"
              />
            </div>

            <ScaryButton 
              className="w-full"
              onClick={handleSubmit}
              disabled={!symbolInput.trim() || !numericInput.trim()}
            >
              Transmit Code
            </ScaryButton>
          </div>
        )}

        {submitted && (
          <div className="text-center space-y-4">
            <GlitchText as="h3" className="text-xl text-accent">
              CODE TRANSMITTED
            </GlitchText>
            <p className="text-muted-foreground font-rajdhani font-medium">
              You have done everything you can.
            </p>
            <p className="text-foreground font-cinzel text-lg">
              WAIT FOR RESCUE
            </p>
          </div>
        )}
      </div>
    );
  }

  // H Player View
  return (
    <div className="space-y-6">
      <div className="text-center">
        <GlitchText as="h2" className="text-2xl mb-2">
          INCOMING SIGNAL
        </GlitchText>
      </div>

      {!receivedCode && (
        <div className="text-center space-y-4 static-noise p-8 rounded-lg">
          <div className="flicker-slow">
            <p className="text-muted-foreground font-cinzel text-xl tracking-wide">
              WAITING FOR
            </p>
            <p className="text-primary font-cinzel text-2xl tracking-widest">
              TRANSMISSION
            </p>
          </div>
        </div>
      )}

      {receivedCode && (
        <div className="space-y-4">
          <div className="bg-card/80 border border-accent/50 rounded-lg p-6 backdrop-blur-sm text-center">
            <p className="text-muted-foreground font-rajdhani text-sm font-medium mb-2">
              MESSAGE RECEIVED
            </p>
            <p className="text-accent font-cinzel text-4xl tracking-widest flicker-slow">
              CODE: {receivedCode}
            </p>
          </div>
          
          <p className="text-muted-foreground font-rajdhani text-center font-medium">
            Remember this code for the final rescue!
          </p>
        </div>
      )}
    </div>
  );
};