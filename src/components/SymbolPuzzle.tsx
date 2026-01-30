import React, { useState } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';

interface SymbolPuzzleProps {
  role: 'U' | 'H';
  partialCode1: string;
  partialCode2: string;
  receivedCode: string | null;
  phase: 'waiting_envelope' | 'symbol_decode' | 'code_input' | 'transmitted' | 'h_waiting' | 'h_code_reveal' | 'h_qr';
  onEnvelopeReceived: () => void;
  onCodeTransmit: (code: string) => void;
}

const SYMBOLS = [
  { emoji: '⭐', name: 'Star' },
  { emoji: '❄', name: 'Snowflake' },
  { emoji: '⚡', name: 'Lightning' },
  { emoji: '🌀', name: 'Spiral' },
];

export const SymbolPuzzle: React.FC<SymbolPuzzleProps> = ({ 
  role, 
  partialCode1,
  partialCode2,
  receivedCode,
  phase,
  onEnvelopeReceived,
  onCodeTransmit 
}) => {
  const [symbolsWithNumbers] = useState(() => {
    const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
    const numbers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    return shuffledSymbols.map((symbol, index) => ({
      ...symbol,
      number: numbers[index]
    }));
  });
  
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const handleDecodeClick = () => {
    setShowCodeInput(true);
  };

  const handleSubmit = () => {
    if (codeInput.trim() === partialCode2) {
      onCodeTransmit(partialCode2);
    } else {
      setIsWrong(true);
      setCodeInput('');
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  // U Player Views
  if (role === 'U') {
    // Waiting for envelope
    if (phase === 'waiting_envelope') {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <GlitchText as="h2" className="text-4xl mb-4">
              WAITING FOR SIGNAL
            </GlitchText>
          </div>

          <div className="bg-card/80 border border-primary/50 rounded-lg p-8 backdrop-blur-sm text-center">
            <p className="text-foreground font-rajdhani text-2xl font-semibold mb-4">
              RECEIVE THE ENVELOPE
            </p>
            <p className="text-muted-foreground font-rajdhani text-lg font-medium">
              A volunteer will give you a symbol + hash card
            </p>
          </div>

          <ScaryButton 
            className="w-full text-xl py-6"
            onClick={onEnvelopeReceived}
          >
            I Have The Envelope
          </ScaryButton>
        </div>
      );
    }

    // Symbol decode phase
    if (phase === 'symbol_decode') {
      if (showCodeInput) {
        return (
          <div className="space-y-8">
            <div className="text-center">
              <GlitchText as="h2" className="text-4xl mb-4">
                SYMBOL TRANSMISSION
              </GlitchText>
              <p className="text-muted-foreground font-rajdhani text-xl font-medium">
                Enter the decoded code
              </p>
            </div>

            <div className="space-y-4">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter code..."
                className={`w-full bg-card/80 border-2 rounded-lg text-center font-cinzel text-3xl tracking-widest py-4 px-4 text-foreground placeholder:text-muted-foreground/50 ${
                  isWrong ? 'border-destructive animate-shake' : 'border-border'
                }`}
                autoFocus
              />

              {isWrong && (
                <p className="text-destructive font-rajdhani text-center text-lg flicker font-semibold">
                  INCORRECT CODE! Try again...
                </p>
              )}

              <ScaryButton 
                className="w-full text-xl py-6"
                onClick={handleSubmit}
                disabled={!codeInput.trim()}
              >
                Transmit Code
              </ScaryButton>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-8">
          <div className="text-center">
            <GlitchText as="h2" className="text-4xl mb-4">
              DECODE THE SYMBOLS
            </GlitchText>
          </div>

          {/* 4 Symbols Grid */}
          <div className="grid grid-cols-2 gap-4">
            {symbolsWithNumbers.map((symbol, index) => (
              <div 
                key={index}
                className="bg-card/60 border-2 border-primary/50 rounded-lg p-4 text-center backdrop-blur-sm"
              >
                <div 
                  className="text-6xl mb-2"
                  style={{ 
                    filter: 'grayscale(100%) brightness(0.8) sepia(100%) hue-rotate(-50deg) saturate(300%)',
                  }}
                >
                  {symbol.emoji}
                </div>
                <p className="text-primary font-cinzel text-3xl font-bold">
                  {symbol.number}
                </p>
              </div>
            ))}
          </div>

          <ScaryButton 
            className="w-full text-xl py-6"
            onClick={handleDecodeClick}
          >
            Decoded the code?
          </ScaryButton>
        </div>
      );
    }

    // Transmitted
    if (phase === 'transmitted') {
      return (
        <div className="text-center space-y-6">
          <GlitchText as="h2" className="text-4xl text-accent">
            CODE TRANSMITTED
          </GlitchText>
          <p className="text-muted-foreground font-rajdhani text-xl font-medium">
            You have done everything you can.
          </p>
          <p className="text-foreground font-cinzel text-2xl">
            WAIT FOR RESCUE
          </p>
        </div>
      );
    }
  }

  // H Player Views
  if (role === 'H') {
    // Waiting for transmission
    if (phase === 'h_waiting') {
      return (
        <div className="text-center space-y-6 static-noise p-8 rounded-lg">
          <div className="flicker-slow">
            <p className="text-muted-foreground font-cinzel text-2xl tracking-wide">
              WAITING FOR
            </p>
            <p className="text-primary font-cinzel text-3xl tracking-widest">
              TRANSMISSION
            </p>
          </div>
        </div>
      );
    }

    // Code reveal
    if (receivedCode) {
      return (
        <div className="space-y-6">
          <div className="bg-card/80 border border-accent/50 rounded-lg p-8 backdrop-blur-sm text-center">
            <p className="text-muted-foreground font-rajdhani text-lg font-medium mb-4">
              MESSAGE RECEIVED
            </p>
            <p className="text-accent font-cinzel text-5xl tracking-widest flicker-slow">
              CODE: {receivedCode}
            </p>
          </div>
          
          <p className="text-muted-foreground font-rajdhani text-center text-xl font-medium">
            Remember this code for the final rescue!
          </p>
        </div>
      );
    }
  }

  // Fallback loading
  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <p className="text-primary font-cinzel text-3xl flicker-slow">LOADING...</p>
        </div>
        <p className="text-muted-foreground font-rajdhani text-lg font-medium">
          Preparing symbol puzzle...
        </p>
      </div>
    </div>
  );
};
