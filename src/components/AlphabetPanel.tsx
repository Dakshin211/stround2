import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AlphabetPanelProps {
  onLetterClick: (letter: string) => void;
  disabled?: boolean;
  hidden?: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AlphabetPanel: React.FC<AlphabetPanelProps> = ({
  onLetterClick,
  disabled = false,
  hidden = false
}) => {
  // Keyboard mapping - listen for actual keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled || hidden) return;
    
    const key = e.key.toUpperCase();
    if (ALPHABET.includes(key)) {
      onLetterClick(key);
    }
  }, [disabled, hidden, onLetterClick]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (hidden) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-elite text-lg flicker">
          Signal weakening...
        </p>
        <p className="text-muted-foreground/50 font-elite text-sm mt-2">
          Panel will reappear soon
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-7 gap-2 p-4 bg-card/50 border border-border rounded-lg">
        {ALPHABET.map((letter) => (
          <button
            key={letter}
            onClick={() => onLetterClick(letter)}
            disabled={disabled}
            className={cn(
              'alphabet-key rounded',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {letter}
          </button>
        ))}
      </div>
      <p className="text-center text-muted-foreground/60 font-rajdhani text-xs mt-2">
        You can also use your keyboard to type letters
      </p>
    </div>
  );
};
