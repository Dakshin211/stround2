import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ThunderEffect } from '@/components/ThunderEffect';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { AlphabetPanel } from '@/components/AlphabetPanel';
import { AlphabetWall } from '@/components/AlphabetWall';
import { CommunicationUnlock } from '@/components/CommunicationUnlock';
import { MemoryRound } from '@/components/MemoryRound';
import { SymbolPuzzle } from '@/components/SymbolPuzzle';
import { FinalRescue } from '@/components/FinalRescue';
import { VictoryScreen } from '@/components/VictoryScreen';
import { Input } from '@/components/ui/input';
import { 
  subscribeToRoom, 
  updateAlphabetCurrent, 
  updateRoomStage,
  setPlayerReady,
  resetPlayerReady,
  getPuzzleSet,
  getTeam,
  Room, 
  PuzzleSet,
  GameStage
} from '@/lib/firebase';
import upsideDownBg from '@/assets/upside-down-bg.png';
import alphabetWallBg from '@/assets/alphabet-wall-original.png';

// Preload alphabet wall image
const preloadAlphabetWall = new Image();
preloadAlphabetWall.src = alphabetWallBg;

const GamePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode, role } = location.state || {};
  
  const [room, setRoom] = useState<Room | null>(null);
  const [puzzleSet, setPuzzleSet] = useState<PuzzleSet | null>(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true); // Track puzzle loading state
  const [teamId, setTeamId] = useState<string>('');
  const [currentLetter, setCurrentLetter] = useState('');
  const [transmissionId, setTransmissionId] = useState(0);
  
  // U player state
  const [timeLeft, setTimeLeft] = useState(60); // 1:00 for U player
  const [timerActive, setTimerActive] = useState(true);
  const [transmissionSent, setTransmissionSent] = useState(false);
  const [retransmitCountdown, setRetransmitCountdown] = useState(60); // 1 min retransmit
  const [canRetransmit, setCanRetransmit] = useState(false);
  
  // H player state
  const [hasSignal, setHasSignal] = useState(false);
  const [hInputTimeLeft, setHInputTimeLeft] = useState(20); // 20 seconds for H input
  const [showHInput, setShowHInput] = useState(false);
  const [hInputActive, setHInputActive] = useState(false);
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showNoSignal, setShowNoSignal] = useState(false);
  const [uTransmissionComplete, setUTransmissionComplete] = useState(false); // Track when U finishes

  // Part 2 state
  const [codesH, setCodesH] = useState('');
  const [codesU, setCodesU] = useState('');
  const [receivedSymbolCode, setReceivedSymbolCode] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const [memoryRoundNumber, setMemoryRoundNumber] = useState(1);

  // Load puzzle data - critical for both players
  useEffect(() => {
    if (!roomCode) return;
    
    setPuzzleLoading(true);
    
    const loadPuzzle = async () => {
      try {
        const team = await getTeam(roomCode);
        if (team) {
          setTeamId(team.teamId);
          const puzzle = await getPuzzleSet(team.puzzleSet);
          setPuzzleSet(puzzle);
        }
      } catch (err) {
        console.error('Error loading puzzle:', err);
      } finally {
        setPuzzleLoading(false);
      }
    };
    
    loadPuzzle();
  }, [roomCode]);

  // Subscribe to room
  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      setRoom(roomData);
      
      if (roomData?.alphabet) {
        if (roomData.alphabet.current) {
          setCurrentLetter(roomData.alphabet.current);
          setTransmissionId(roomData.alphabet.transmissionId || 0);
          setHasSignal(true);
        }
        // Check if U has finished transmission
        if (roomData.alphabet.transmissionComplete) {
          setUTransmissionComplete(true);
        } else {
          // U is retransmitting - reset H player state
          setUTransmissionComplete(false);
          setShowNoSignal(false);
          setAttempts(0);
          setAnswer('');
          setHInputTimeLeft(20);
        }
      }
      
      // Check if both players are ready for communication unlock
      if (roomData?.stage === 'communication_unlock' && roomData.uReady && roomData.hReady) {
        // Both ready, proceed to memory round
        updateRoomStage(roomCode, 'memory1');
        resetPlayerReady(roomCode);
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate]);

  // Timer for U player panel (60 seconds = 1:00)
  useEffect(() => {
    if (role !== 'U' || !timerActive || room?.stage !== 'alphabet' || transmissionSent) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinishTransmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, timerActive, room?.stage, transmissionSent]);

  // Retransmit countdown for U player
  useEffect(() => {
    if (role !== 'U' || !transmissionSent || canRetransmit) return;
    
    const interval = setInterval(() => {
      setRetransmitCountdown((prev) => {
        if (prev <= 1) {
          setCanRetransmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, transmissionSent, canRetransmit]);

  // H player: Start 20 second input timer ONLY when U's transmission is complete
  useEffect(() => {
    if (role !== 'H' || showHInput || hInputActive || showNoSignal || isCorrect) return;
    
    // Only show input when U has explicitly finished transmission
    if (room?.stage === 'alphabet' && uTransmissionComplete && !showHInput && !hInputActive) {
      setShowHInput(true);
      setHInputActive(true);
      setHInputTimeLeft(20); // Reset timer
    }
  }, [role, uTransmissionComplete, showHInput, hInputActive, showNoSignal, isCorrect, room?.stage]);

  // H player: 20 second input countdown
  useEffect(() => {
    if (role !== 'H' || !hInputActive || !showHInput) return;
    
    const interval = setInterval(() => {
      setHInputTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - no answer given
          handleHTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [role, hInputActive, showHInput]);

  const handleLetterClick = useCallback(async (letter: string) => {
    if (!roomCode) return;
    await updateAlphabetCurrent(roomCode, letter);
  }, [roomCode]);

  const handleFinishTransmission = async () => {
    if (!roomCode) return;
    setTransmissionSent(true);
    setTimerActive(false);
    // Reset retransmit countdown
    setRetransmitCountdown(60);
    setCanRetransmit(false);
    
    // Notify H that transmission is complete via Firebase
    const { ref, update } = await import('firebase/database');
    const { database } = await import('@/lib/firebase');
    const roomRef = ref(database, `rooms/${roomCode}/alphabet`);
    await update(roomRef, { transmissionComplete: true });
  };

  const handleRetransmit = async () => {
    if (!roomCode) return;
    // Reset for new transmission
    setTransmissionSent(false);
    setTimerActive(true);
    setTimeLeft(60);
    setCanRetransmit(false);
    setRetransmitCountdown(60);
    
    // Reset transmission complete flag in Firebase
    const { ref, update } = await import('firebase/database');
    const { database } = await import('@/lib/firebase');
    const roomRef = ref(database, `rooms/${roomCode}/alphabet`);
    await update(roomRef, { transmissionComplete: false });
  };

  const handleHTimeUp = () => {
    // H didn't answer in time
    setShowHInput(false);
    setHInputActive(false);
    setShowNoSignal(true);
    setUTransmissionComplete(false); // Reset so we wait for next transmission
  };

  const handleSubmitAnswer = async () => {
    if (!puzzleSet || !roomCode) return;
    
    const isAnswerCorrect = answer.toUpperCase().trim() === puzzleSet.alphabetAnswer.toUpperCase();
    
    if (isAnswerCorrect) {
      setIsCorrect(true);
      setShowHInput(false);
      setHInputActive(false);
      await updateRoomStage(roomCode, 'communication_unlock');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsWrong(true);
      setAnswer('');
      
      setTimeout(() => setIsWrong(false), 2000);
      
      if (newAttempts >= 2) {
        // Two wrong attempts - go to no signal
        setShowHInput(false);
        setHInputActive(false);
        setShowNoSignal(true);
        setUTransmissionComplete(false); // Reset so we wait for next transmission
      }
    }
  };

  // Communication Unlock handlers
  const handleCommunicationReady = async () => {
    if (!roomCode) return;
    await setPlayerReady(roomCode, role.toLowerCase() as 'u' | 'h', true);
  };

  // Part 2 handlers
  const handleMemoryComplete = () => {
    // U finished memorizing - nothing to do, H handles answer
  };

  const handleMemoryAnswer = async (correct: boolean) => {
    if (!roomCode || !puzzleSet) return;
    
    if (correct) {
      setCodesH(puzzleSet.partialCode1);
      await updateRoomStage(roomCode, 'symbol');
    } else {
      // Increment round number for next attempt
      setMemoryRoundNumber(prev => prev + 1);
    }
  };

  const handleSymbolCodeSubmit = async (code: string) => {
    if (!roomCode || !puzzleSet) return;
    setCodesU(puzzleSet.partialCode2);
    setReceivedSymbolCode(code);
    await updateRoomStage(roomCode, 'symbol_received');
  };

  const handleVictory = async () => {
    if (!roomCode) return;
    setShowVictory(true);
    await updateRoomStage(roomCode, 'victory');
  };

  if (!roomCode) return null;

  // Victory Screen
  if (showVictory || room?.stage === 'victory') {
    return <VictoryScreen teamId={teamId} />;
  }

  const stage = room?.stage || 'alphabet';

  // Loading component for consistent branding
  const LoadingScreen = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <p className="text-primary font-cinzel text-2xl flicker-slow">CONNECTING...</p>
        </div>
        <p className="text-muted-foreground font-rajdhani font-medium">
          Establishing connection to the Upside Down...
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  // Render based on stage - ALWAYS check for data before rendering
  const renderContent = () => {
    // CRITICAL: If puzzle data isn't loaded, show loading screen
    if (puzzleLoading || !puzzleSet) {
      return <LoadingScreen />;
    }

    switch (stage) {
      case 'communication_unlock':
        return (
          <CommunicationUnlock 
            onReady={handleCommunicationReady}
            isReady={role === 'U' ? room?.uReady : room?.hReady}
            otherReady={role === 'U' ? room?.hReady : room?.uReady}
          />
        );
      
      case 'memory1':
      case 'memory1_wait':
      case 'memory1_answer':
        return (
          <MemoryRound 
            role={role} 
            puzzleSet={puzzleSet}
            onComplete={handleMemoryComplete}
            onAnswer={handleMemoryAnswer}
            roundNumber={memoryRoundNumber}
          />
        );
      
      case 'symbol':
      case 'symbol_received':
        return (
          <SymbolPuzzle 
            role={role}
            partialCode2={puzzleSet.partialCode2}
            receivedCode={receivedSymbolCode}
            onCodeSubmit={handleSymbolCodeSubmit}
          />
        );
      
      case 'final':
        const expectedCode = `${codesH}${teamId}${codesU}`;
        return (
          <FinalRescue 
            role={role}
            navigationQR={puzzleSet.navigationQR}
            expectedCode={expectedCode}
            onVictory={handleVictory}
          />
        );
      
      default:
        return <LoadingScreen />;
    }
  };

  // Check if we should show alphabet stage content
  const isAlphabetStage = stage === 'alphabet' || stage === 'alphabet_retransmit' || stage === 'no_signal';

  // U Player View (Sender) - Inverted background
  if (role === 'U') {
    return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden">
        {/* Inverted background for Upside Down player */}
        <div 
          className="absolute inset-0 upside-down-bg"
          style={{
            backgroundImage: `url(${upsideDownBg})`,
            transform: 'rotate(180deg)'
          }}
        />
        
        <CRTOverlay />
        <ThunderEffect intensity="light" />
        <div className="absolute inset-0 page-overlay" />
        
        <div className="relative z-10 flex flex-col flex-1">
          {/* Header - Single clean header */}
          <div className="text-center mb-4">
            <p className="text-accent font-cinzel text-xs tracking-[0.3em] mb-1">STRANGER THINGS</p>
            <GlitchText as="h1" className="text-xl" noFlicker>
              {isAlphabetStage ? 'SEND YOUR MESSAGE' : 'THE UPSIDE DOWN'}
            </GlitchText>
          </div>
          
          {/* Alphabet Stage Content */}
          {isAlphabetStage && (
            <>
              {/* Clue */}
              {puzzleSet && !transmissionSent && (
                <div className="bg-card/70 border border-border rounded-lg p-4 mb-4 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground font-rajdhani mb-1 font-semibold tracking-wide">CLUE:</p>
                  <p className="text-foreground font-rajdhani leading-relaxed text-lg font-medium">
                    {puzzleSet.alphabetClue}
                  </p>
                </div>
              )}
              
              {/* Active Transmission */}
              {!transmissionSent && (
                <>
                  {/* Timer */}
                  <div className="text-center mb-4">
                    <p className="text-muted-foreground font-rajdhani text-sm font-medium">Time remaining</p>
                    <p className={`text-3xl font-cinzel ${timeLeft <= 10 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  
                  {/* Alphabet Panel */}
                  <div className="flex-1 flex flex-col justify-center">
                    <AlphabetPanel onLetterClick={handleLetterClick} />
                  </div>
                  
                  {/* Finish Button */}
                  <div className="mt-4">
                    <ScaryButton 
                      className="w-full"
                      onClick={handleFinishTransmission}
                    >
                      Finish Transmission
                    </ScaryButton>
                  </div>
                </>
              )}
              
              {/* Waiting for H / Retransmit */}
              {transmissionSent && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <GlitchText as="h2" className="text-2xl">
                    TRANSMISSION COMPLETE
                  </GlitchText>
                  
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-rajdhani font-medium">
                      Waiting for response from H...
                    </p>
                    
                    {!canRetransmit && (
                      <div>
                        <p className="text-muted-foreground/70 font-rajdhani text-sm">
                          You can retransmit in:
                        </p>
                        <p className="text-2xl font-cinzel text-primary flicker-slow">
                          {Math.floor(retransmitCountdown / 60)}:{(retransmitCountdown % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    )}
                    
                    {canRetransmit && (
                      <ScaryButton onClick={handleRetransmit}>
                        Retransmit Message
                      </ScaryButton>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Other Stages Content - ALWAYS render for non-alphabet stages */}
          {!isAlphabetStage && (
            <div className="flex-1 flex flex-col p-4">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // H Player View (Receiver)
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background - show wall when signal, void otherwise */}
      {hasSignal || !isAlphabetStage ? (
        <div 
          className="absolute inset-0 upside-down-bg"
          style={{
            backgroundImage: `url(${upsideDownBg})`
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-void" />
      )}
      
      <CRTOverlay />
      <ThunderEffect intensity={hasSignal ? 'medium' : 'light'} />
      <div className="absolute inset-0 page-overlay" />
      
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header - Single clean header */}
        <div className="text-center p-4">
          <p className="text-accent font-cinzel text-xs tracking-[0.3em] mb-1">STRANGER THINGS</p>
          <GlitchText as="h1" className="text-xl">
            {isAlphabetStage ? (hasSignal ? 'INCOMING SIGNAL' : 'SEARCHING...') : 'HAWKINS LAB'}
          </GlitchText>
        </div>
        
        {/* Alphabet Stage Content */}
        {isAlphabetStage && (
          <>
            {/* No Signal State - Waiting */}
            {!hasSignal && !showNoSignal && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4 static-noise p-8 rounded-lg">
                  <div className="flicker-slow">
                    <p className="text-muted-foreground font-cinzel text-xl tracking-wide">
                      NO SIGNAL FROM
                    </p>
                    <p className="text-primary font-cinzel text-2xl tracking-widest">
                      UPSIDE DOWN
                    </p>
                  </div>
                  <p className="text-muted-foreground/60 font-rajdhani text-sm font-medium">
                    Waiting for transmission...
                  </p>
                </div>
              </div>
            )}
            
            {/* No Signal Error State */}
            {showNoSignal && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4 bg-destructive/20 p-8 rounded-lg border border-destructive/50">
                  <p className="text-destructive font-cinzel text-2xl flicker">
                    NO SIGNAL
                  </p>
                  <p className="text-muted-foreground font-rajdhani font-medium">
                    Waiting for retransmission from Upside Down...
                  </p>
                </div>
              </div>
            )}
            
            {/* Signal Received - Show Wall */}
            {hasSignal && !showNoSignal && !isCorrect && (
              <>
                {/* Full screen alphabet wall */}
                <div className="absolute inset-0 z-10">
                  <AlphabetWall activeLetter={currentLetter} transmissionId={transmissionId} />
                </div>
                
                {/* Input Timer - shows when input is active */}
                {showHInput && hInputActive && (
                  <div className="absolute top-20 left-0 right-0 z-30 text-center">
                    <p className={`text-4xl font-cinzel ${hInputTimeLeft <= 5 ? 'text-destructive flicker' : 'text-primary flicker-slow'}`}>
                      {hInputTimeLeft}s
                    </p>
                  </div>
                )}
                
                {/* Answer Input - shows after transmission */}
                {showHInput && hInputActive && (
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="space-y-2">
                        <label className="text-foreground font-rajdhani text-sm font-semibold">
                          Enter the decoded message:
                        </label>
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
                  </div>
                )}
              </>
            )}
            
            {/* Success State */}
            {isCorrect && (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                  <GlitchText as="h2" className="text-3xl text-accent">
                    CONNECTION ESTABLISHED
                  </GlitchText>
                  <p className="text-foreground font-rajdhani font-medium text-lg">
                    The message was received...
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Other Stages Content - Use same renderContent with built-in loading */}
        {!isAlphabetStage && (
          <div className="flex-1 flex flex-col p-4">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;
