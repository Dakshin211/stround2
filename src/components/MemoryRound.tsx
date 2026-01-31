import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';
import { PuzzleSet, getMemoryListAsArray, getMemoryListWithValues, database } from '@/lib/firebase';
import { ref, onValue, update, get, serverTimestamp, set } from 'firebase/database';

interface MemoryRoundProps {
  role: 'U' | 'H';
  puzzleSet: PuzzleSet;
  roomCode: string;
  onComplete: () => void;
  onAnswer: (correct: boolean) => void;
  roundNumber?: number;
}

interface MemoryTimerState {
  phase: 'memorize' | 'input' | 'waiting' | 'no_signal';
  startTime: number; // Server timestamp when phase started
  roundNumber: number;
}

const PHASE_DURATIONS = {
  memorize: 60000, // 1 minute for memorization (U) / communication (H)
  input: 30000,    // 30 seconds for H to input answer
  waiting: 30000,  // 30 seconds wait before retry (was 60s, now 30s)
};

export const MemoryRound: React.FC<MemoryRoundProps> = ({ 
  role, 
  puzzleSet, 
  roomCode,
  onComplete,
  onAnswer,
  roundNumber = 1
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState<'memorize' | 'input' | 'waiting' | 'no_signal'>('memorize');
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get memory list with values for display
  const memoryListWithValues = useMemo(() => {
    return getMemoryListWithValues(puzzleSet.memoryList);
  }, [puzzleSet.memoryList]);

  // Get confirm list (for retry attempts)
  const memoryConfirmListWithValues = useMemo(() => {
    if (puzzleSet.memoryConfirmList) {
      return getMemoryListWithValues(puzzleSet.memoryConfirmList);
    }
    return [];
  }, [puzzleSet.memoryConfirmList]);

  // Generate list based on round number
  // Round 1: Show all 10 memoryList items + memoryText
  // Round 2+: Show memoryConfirmList + remaining items from memoryList (total 5), no memoryText
  const displayedMemoryList = useMemo(() => {
    if (roundNumber === 1) {
      return memoryListWithValues;
    }
    
    // For retry: show memoryConfirmList + remaining from memoryList (not in confirmList) = 5 total
    const confirmNames = memoryConfirmListWithValues.map(item => item.name);
    const remainingItems = memoryListWithValues.filter(item => !confirmNames.includes(item.name));
    
    // Shuffle remaining items deterministically based on roundNumber to prevent re-shuffling on re-render
    const shuffledRemaining = [...remainingItems].sort((a, b) => {
      const hashA = a.name.charCodeAt(0) + roundNumber;
      const hashB = b.name.charCodeAt(0) + roundNumber;
      return hashA - hashB;
    });
    
    // Take enough from remaining to make total of 5
    const targetTotal = 5;
    const remainingSlots = Math.max(0, targetTotal - memoryConfirmListWithValues.length);
    const selected = [...memoryConfirmListWithValues, ...shuffledRemaining.slice(0, remainingSlots)];
    
    // Sort deterministically for display
    return selected.sort((a, b) => a.name.localeCompare(b.name));
  }, [memoryListWithValues, memoryConfirmListWithValues, roundNumber]);

  // Calculate server time offset for synchronization
  useEffect(() => {
    const offsetRef = ref(database, '.info/serverTimeOffset');
    const unsubscribe = onValue(offsetRef, (snapshot) => {
      const offset = snapshot.val() || 0;
      setServerTimeOffset(offset);
    });
    return () => unsubscribe();
  }, []);

  // Get current server time
  const getServerTime = useCallback(() => {
    return Date.now() + serverTimeOffset;
  }, [serverTimeOffset]);

  // Initialize or sync timer state from Firebase
  useEffect(() => {
    if (!roomCode) return;

    const timerRefPath = ref(database, `rooms/${roomCode}/memoryTimer`);
    
    const initializeTimer = async () => {
      const snapshot = await get(timerRefPath);
      const timerState = snapshot.val() as MemoryTimerState | null;
      
      if (!timerState || timerState.roundNumber !== roundNumber) {
        // Initialize new round - only U player initializes
        if (role === 'U') {
          // Use server time offset to get accurate server time
          const serverTime = getServerTime();
          // Round DOWN to nearest second boundary, then add 1 second delay
          // This ensures both clients see the same start time and prevents 57s bug
          const roundedTime = (Math.floor(serverTime / 1000) + 1) * 1000;
          await set(timerRefPath, {
            phase: 'memorize',
            startTime: roundedTime,
            roundNumber: roundNumber
          });
        }
      }
      setIsInitialized(true);
    };

    initializeTimer();
  }, [roomCode, roundNumber, role, getServerTime]);

  // Subscribe to timer state changes
  useEffect(() => {
    if (!roomCode || !isInitialized) return;

    const memoryTimerRef = ref(database, `rooms/${roomCode}/memoryTimer`);
    
    const unsubscribe = onValue(memoryTimerRef, (snapshot) => {
      const timerState = snapshot.val() as MemoryTimerState | null;
      
      if (timerState) {
        setPhase(timerState.phase);
      }
    });

    return () => unsubscribe();
  }, [roomCode, isInitialized]);

  // Calculate and update time left based on server timestamp
  useEffect(() => {
    if (!roomCode || !isInitialized) return;

    const updateTimeLeft = async () => {
      const memoryTimerRef = ref(database, `rooms/${roomCode}/memoryTimer`);
      const snapshot = await get(memoryTimerRef);
      const timerState = snapshot.val() as MemoryTimerState | null;
      
      if (!timerState) return;

      const serverTime = getServerTime();
      const elapsed = serverTime - timerState.startTime;
      const phaseDuration = PHASE_DURATIONS[timerState.phase] || 60000;
      const remaining = Math.max(0, Math.ceil((phaseDuration - elapsed) / 1000));
      
      setTimeLeft(remaining);

      // Handle phase transitions
      if (remaining <= 0) {
        await handlePhaseComplete(timerState.phase);
      }
    };

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimeLeft, 100);
    updateTimeLeft();

    return () => clearInterval(interval);
  }, [roomCode, isInitialized, getServerTime]);

  // Handle phase transitions
  const handlePhaseComplete = async (currentPhase: string) => {
    const memoryTimerRef = ref(database, `rooms/${roomCode}/memoryTimer`);
    const serverTime = getServerTime();

    switch (currentPhase) {
      case 'memorize':
        // Memorize time over - switch to input phase
        if (role === 'U') {
          await update(memoryTimerRef, {
            phase: 'input',
            startTime: serverTime
          });
          onComplete();
        }
        break;
      
      case 'input':
        // Input time over without correct answer - go to waiting
        if (role === 'H') {
          await update(memoryTimerRef, {
            phase: 'waiting',
            startTime: serverTime
          });
          onAnswer(false);
        }
        break;
      
      case 'waiting':
        // Wait time over - restart memorize phase
        if (role === 'U') {
          await update(memoryTimerRef, {
            phase: 'memorize',
            startTime: serverTime,
            roundNumber: roundNumber + 1
          });
        }
        setAttempts(0);
        break;
    }
  };

  const handleSubmitAnswer = async () => {
    const userAnswer = answer.trim();
    const correctAnswer = String(puzzleSet.memoryAnswer);
    const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    
    if (isCorrect) {
      onAnswer(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsWrong(true);
      setAnswer('');
      setTimeout(() => setIsWrong(false), 2000);
      
      if (newAttempts >= 2) {
        // Two wrong attempts - go to no signal
        const memoryTimerRef = ref(database, `rooms/${roomCode}/memoryTimer`);
        const serverTime = getServerTime();
        await update(memoryTimerRef, {
          phase: 'waiting',
          startTime: serverTime
        });
        onAnswer(false);
      }
    }
  };

  // Safety check for data validity
  const isDataValid = Boolean(
    puzzleSet && 
    puzzleSet.memoryList && 
    (Array.isArray(puzzleSet.memoryList) ? puzzleSet.memoryList.length > 0 : Object.keys(puzzleSet.memoryList).length > 0) &&
    puzzleSet.memoryQuestion &&
    puzzleSet.memoryAnswer !== undefined
  );

  if (!isDataValid || !isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <p className="text-primary font-cinzel text-2xl flicker-slow">SYNCING...</p>
          </div>
          <p className="text-muted-foreground font-rajdhani font-medium">
            Establishing connection...
          </p>
        </div>
      </div>
    );
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // U Player View - No headers here, they come from GamePage
  if (role === 'U') {
    return (
      <div className="space-y-6">
        {phase === 'memorize' && (
          <>
            <div className="text-center">
              <p className="text-muted-foreground font-rajdhani text-sm font-medium mb-2">
                Memorize this information
              </p>
              <p className={`text-5xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>

            <div className="bg-card/80 border border-border rounded-lg p-6 backdrop-blur-sm space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {displayedMemoryList.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-secondary/50 border border-border rounded p-3 text-center"
                  >
                    <span className="text-foreground font-cinzel text-xl">{item.name}</span>
                    <span className="text-primary font-rajdhani text-base ml-2">({item.value})</span>
                  </div>
                ))}
              </div>
              
              {roundNumber === 1 && puzzleSet.memoryText && (
                <div className="border-t border-border pt-4">
                  <p className="text-foreground font-rajdhani leading-relaxed text-xl font-medium">
                    {puzzleSet.memoryText}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {(phase === 'input' || phase === 'waiting') && (
          <div className="text-center space-y-6">
            <GlitchText as="h3" className="text-3xl">
              TIME'S UP
            </GlitchText>
            
            <div className="bg-card/60 border border-border rounded-lg p-6 backdrop-blur-sm">
              <p className="text-muted-foreground font-rajdhani font-medium text-xl mb-4">
                Hawkins Lab is trying to decode your transmission...
              </p>
              
              <div className="space-y-2">
                <p className="text-muted-foreground/70 font-rajdhani text-base">
                  {phase === 'input' ? 'Waiting for response...' : 'Reconnecting in:'}
                </p>
                <p className={`text-5xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>
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
          <p className={`text-5xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
            {formatTime(timeLeft)}
          </p>
          
          <div className="static-noise p-8 rounded-lg">
            <p className="text-muted-foreground font-rajdhani font-medium text-2xl">
              Communicate with the Upside Down
            </p>
            <p className="text-muted-foreground/70 font-rajdhani text-base mt-2">
              Prepare to solve the upcoming problem together
            </p>
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className={`text-5xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
              {timeLeft}s
            </p>
          </div>
          
          <div className="bg-card/80 border border-primary/50 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-foreground font-rajdhani text-2xl font-semibold text-center">
              {puzzleSet.memoryQuestion}
            </p>
          </div>

          <div className="space-y-2">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              placeholder="TYPE YOUR ANSWER..."
              className={`bg-card/80 border-border text-center font-cinzel text-2xl tracking-wider ${
                isWrong ? 'border-destructive animate-shake' : ''
              }`}
              autoFocus
            />
          </div>

          {isWrong && (
            <p className="text-destructive font-rajdhani text-center text-base flicker font-semibold">
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

      {phase === 'waiting' && (
        <div className="text-center space-y-4 bg-destructive/20 p-8 rounded-lg border border-destructive/50">
          <p className="text-destructive font-cinzel text-3xl flicker">
            NO SIGNAL
          </p>
          <p className="text-muted-foreground font-rajdhani font-medium text-lg">
            Can't use walkie-talkie right now...
          </p>
          <p className="text-muted-foreground/70 font-rajdhani text-base">
            Reconnecting in:
          </p>
          <p className={`text-5xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>
      )}
    </div>
  );
};
