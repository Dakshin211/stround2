import React, { useState, useEffect, useMemo } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';
import { PuzzleSet } from '@/lib/firebase';

interface MemoryRoundProps {
  role: 'U' | 'H';
  puzzleSet: PuzzleSet;
  onComplete: () => void;
  onAnswer: (correct: boolean) => void;
  roundNumber?: number; // Track which round we're on
}

export const MemoryRound: React.FC<MemoryRoundProps> = ({ 
  role, 
  puzzleSet, 
  onComplete,
  onAnswer,
  roundNumber = 1
}) => {
  const [phase, setPhase] = useState<'memorize' | 'waiting' | 'question' | 'no_signal'>('memorize');
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute for U
  const [hWaitTimeLeft, setHWaitTimeLeft] = useState(60); // 1 minute wait for H
  const [questionTimeLeft, setQuestionTimeLeft] = useState(30); // 30 seconds for H input
  const [noSignalTimeLeft, setNoSignalTimeLeft] = useState(30); // 30 seconds no signal
  const [answer, setAnswer] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Generate random subset of memory list for rounds after first
  const displayedMemoryList = useMemo(() => {
    if (roundNumber === 1) {
      return puzzleSet.memoryList;
    }
    
    // For subsequent rounds, select 4-5 random items but include guaranteed words
    const guaranteed = puzzleSet.memoryGuaranteedWords || [];
    const otherItems = puzzleSet.memoryList.filter(item => !guaranteed.includes(item));
    
    // Shuffle other items
    const shuffled = [...otherItems].sort(() => Math.random() - 0.5);
    
    // Pick 4-5 total, including guaranteed
    const targetCount = 4 + Math.floor(Math.random() * 2); // 4 or 5
    const remainingSlots = targetCount - guaranteed.length;
    const selected = [...guaranteed, ...shuffled.slice(0, Math.max(0, remainingSlots))];
    
    // Shuffle final result
    return selected.sort(() => Math.random() - 0.5);
  }, [puzzleSet.memoryList, puzzleSet.memoryGuaranteedWords, roundNumber]);

  // U Player: Memorize timer (60 seconds)
  useEffect(() => {
    if (role !== 'U' || phase !== 'memorize') return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('waiting');
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, phase, onComplete]);

  // H Player: Wait 1 minute then show question
  useEffect(() => {
    if (role !== 'H' || phase !== 'memorize') return;
    
    const interval = setInterval(() => {
      setHWaitTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('question');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, phase]);

  // H Player: Question timer (30 seconds)
  useEffect(() => {
    if (role !== 'H' || phase !== 'question') return;
    
    const interval = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - go to no signal
          setPhase('no_signal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, phase]);

  // H Player: No signal timer (30 seconds)
  useEffect(() => {
    if (role !== 'H' || phase !== 'no_signal') return;
    
    const interval = setInterval(() => {
      setNoSignalTimeLeft((prev) => {
        if (prev <= 1) {
          // Reset to waiting phase for next attempt
          setPhase('memorize');
          setHWaitTimeLeft(60);
          setQuestionTimeLeft(30);
          setNoSignalTimeLeft(30);
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, phase]);

  // U Player: Waiting phase timer (reconnect countdown)
  useEffect(() => {
    if (role !== 'U' || phase !== 'waiting') return;
    
    // U waits 1 minute for reconnection
    let reconnectTime = 60;
    const interval = setInterval(() => {
      reconnectTime -= 1;
      if (reconnectTime <= 0) {
        // Reset for next round
        setPhase('memorize');
        setTimeLeft(60);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, phase]);

  const handleSubmitAnswer = () => {
    const isCorrect = answer.toUpperCase().trim() === puzzleSet.memoryAnswer.toUpperCase();
    
    if (isCorrect) {
      onAnswer(true);
    } else {
      setAttempts((prev) => prev + 1);
      setIsWrong(true);
      setAnswer('');
      setTimeout(() => setIsWrong(false), 2000);
      
      if (attempts >= 1) {
        // Two wrong attempts - go to no signal
        setPhase('no_signal');
        onAnswer(false);
      }
    }
  };

  // U Player View - No headers here, they come from GamePage
  if (role === 'U') {
    return (
      <div className="space-y-6">
        {phase === 'memorize' && (
          <div className="text-center">
            <p className="text-muted-foreground font-rajdhani text-sm font-medium">
              You have 1 minute to memorize
            </p>
          </div>
        )}

        {phase === 'memorize' && (
          <>
            {/* Timer */}
            <div className="text-center">
              <p className={`text-4xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Memory List */}
            <div className="bg-card/80 border border-border rounded-lg p-6 backdrop-blur-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {displayedMemoryList.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-secondary/50 border border-border rounded p-3 text-center"
                  >
                    <span className="text-foreground font-cinzel text-lg">{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Only show memoryText on first round */}
              {roundNumber === 1 && (
                <div className="border-t border-border pt-4">
                  <p className="text-foreground font-rajdhani leading-relaxed text-lg font-medium">
                    {puzzleSet.memoryText}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {phase === 'waiting' && (
          <div className="text-center space-y-4">
            <GlitchText as="h3" className="text-xl">
              TIME'S UP
            </GlitchText>
            <p className="text-muted-foreground font-rajdhani font-medium">
              Hawkins Lab is trying to decode your transmission...
            </p>
            <p className="text-muted-foreground/70 font-rajdhani text-sm">
              You can reconnect in 1 minute
            </p>
          </div>
        )}
      </div>
    );
  }

  // H Player View - No headers here, they come from GamePage
  return (
    <div className="space-y-6">

      {phase === 'memorize' && (
        <div className="text-center space-y-4">
          {/* Wait countdown */}
          <p className={`text-4xl font-cinzel ${hWaitTimeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
            {Math.floor(hWaitTimeLeft / 60)}:{(hWaitTimeLeft % 60).toString().padStart(2, '0')}
          </p>
          
          <div className="static-noise p-8 rounded-lg">
            <p className="text-muted-foreground font-rajdhani font-medium text-lg">
              Communicate with the Upside Down
            </p>
            <p className="text-muted-foreground/70 font-rajdhani text-sm mt-2">
              Prepare to solve the upcoming problem together
            </p>
          </div>
        </div>
      )}

      {phase === 'question' && (
        <div className="space-y-4">
          {/* Question Timer */}
          <div className="text-center">
            <p className={`text-3xl font-cinzel ${questionTimeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
              {questionTimeLeft}s
            </p>
          </div>
          
          <div className="bg-card/80 border border-primary/50 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-foreground font-rajdhani text-xl font-semibold text-center">
              {puzzleSet.memoryQuestion}
            </p>
          </div>

          <div className="space-y-2">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              placeholder="TYPE YOUR ANSWER..."
              className={`bg-card/80 border-border text-center font-cinzel text-xl tracking-wider ${
                isWrong ? 'border-destructive animate-shake' : ''
              }`}
              autoFocus
            />
          </div>

          {isWrong && (
            <p className="text-destructive font-rajdhani text-center text-sm flicker font-semibold">
              WRONG! {2 - attempts} attempt{2 - attempts !== 1 ? 's' : ''} remaining
            </p>
          )}

          <ScaryButton 
            className="w-full"
            onClick={handleSubmitAnswer}
            disabled={!answer.trim()}
          >
            Submit Answer
          </ScaryButton>
        </div>
      )}

      {phase === 'no_signal' && (
        <div className="text-center space-y-4 bg-destructive/20 p-8 rounded-lg border border-destructive/50">
          <p className="text-destructive font-cinzel text-2xl flicker">
            NO SIGNAL
          </p>
          <p className="text-muted-foreground font-rajdhani font-medium">
            Can't use walkie-talkie right now...
          </p>
          <p className="text-muted-foreground/70 font-rajdhani text-sm">
            Reconnecting in {noSignalTimeLeft}s
          </p>
        </div>
      )}
    </div>
  );
};
