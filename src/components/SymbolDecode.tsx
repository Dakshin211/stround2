import React, { useState, useMemo } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';

interface SymbolDecodeProps {
  partialCode2: string;
  onCodeCorrect: () => void;
}

const SYMBOLS = [
  { emoji: '⭐', name: 'Star' },
  { emoji: '❄', name: 'Snowflake' },
  { emoji: '⚡', name: 'Lightning' },
  { emoji: '🌀', name: 'Spiral' },
];

export const SymbolDecode: React.FC<SymbolDecodeProps> = ({ 
  partialCode2,
  onCodeCorrect 
}) => {
  const [showInput, setShowInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  // Shuffle symbols and assign random numbers 1-4
  const symbolsWithNumbers = useMemo(() => {
    const shuffledSymbols = [...SYMBOLS].sort(() => Math.random() - 0.5);
    const numbers = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    return shuffledSymbols.map((symbol, index) => ({
      ...symbol,
      number: numbers[index]
    }));
  }, []);

  const handleDecodeClick = () => {
    setShowInput(true);
  };

  const handleSubmit = () => {
    if (codeInput.trim() === partialCode2) {
      onCodeCorrect();
    } else {
      setIsWrong(true);
      setCodeInput('');
      setTimeout(() => setIsWrong(false), 2000);
    }
  };

  if (showInput) {
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
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Enter code..."
            className={`bg-card/80 border-border text-center font-cinzel text-3xl tracking-widest py-6 ${
              isWrong ? 'border-destructive animate-shake' : ''
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
      <div className="grid grid-cols-2 gap-6">
        {symbolsWithNumbers.map((symbol, index) => (
          <div 
            key={index}
            className="bg-card/60 border-2 border-primary/50 rounded-lg p-6 text-center backdrop-blur-sm"
          >
            <div 
              className="text-7xl mb-4"
              style={{ 
                filter: 'grayscale(100%) brightness(0.8) sepia(100%) hue-rotate(-50deg) saturate(300%)',
              }}
            >
              {symbol.emoji}
            </div>
            <p className="text-primary font-cinzel text-4xl font-bold">
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
};
