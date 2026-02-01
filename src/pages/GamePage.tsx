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
import { CodeReveal } from '@/components/CodeReveal';
import { QRReveal } from '@/components/QRReveal';
import { FinalPasscode } from '@/components/FinalPasscode';
import { VictoryScreen } from '@/components/VictoryScreen';
import { EscapeScreen } from '@/components/EscapeScreen';
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
  GameStage,
  database
} from '@/lib/firebase';
import { ref, update, get } from 'firebase/database';
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
  const [completionTime, setCompletionTime] = useState<string | null>(null);
  const [symbolPhase, setSymbolPhase] = useState<'waiting_envelope' | 'symbol_decode' | 'code_input' | 'transmitted' | 'h_waiting' | 'h_code_reveal' | 'h_qr'>('waiting_envelope');
  const [showCode1Reveal, setShowCode1Reveal] = useState(false);
  const [showCode2Reveal, setShowCode2Reveal] = useState(false);
  const [showQRReveal, setShowQRReveal] = useState(false);
  const [showFinalPasscode, setShowFinalPasscode] = useState(false);
  const [uVictoryComplete, setUVictoryComplete] = useState(false);

  // Sync memoryRoundNumber from Firebase on mount and when room updates
  useEffect(() => {
    if (!roomCode) return;
    
    const memoryRoundRef = ref(database, `rooms/${roomCode}/memoryRoundNumber`);
    get(memoryRoundRef).then(snapshot => {
      if (snapshot.exists()) {
        setMemoryRoundNumber(snapshot.val());
      }
    });
  }, [roomCode, room?.stage]);

  // Load puzzle data - critical for both players
  // First try to get puzzleSetId from room (Realtime DB), then fallback to team (Firestore)
  useEffect(() => {
    if (!roomCode) return;
    
    // Don't reload if we already have puzzleSet and it's valid
    if (puzzleSet && !puzzleLoading) return;
    
    setPuzzleLoading(true);
    
    const loadPuzzle = async () => {
      try {
        console.log('[GamePage] Loading puzzle for room:', roomCode);
        
        // First check if room has puzzleSetId directly (new structure)
        if (room?.puzzleSetId) {
          console.log('[GamePage] Using puzzleSetId from room:', room.puzzleSetId);
          const puzzle = await getPuzzleSet(room.puzzleSetId);
          console.log('[GamePage] Loaded puzzle from room.puzzleSetId:', puzzle);
          setPuzzleSet(puzzle);
          setPuzzleLoading(false);
          return;
        }
        
        // Fallback: try to get from team document in Firestore
        const team = await getTeam(roomCode);
        console.log('[GamePage] Team data:', team);
        
        if (team) {
          setTeamId(team.teamId || 'TEAM');
          console.log('[GamePage] Loading puzzleSet from team:', team.puzzleSet);
          const puzzle = await getPuzzleSet(team.puzzleSet || 'demo');
          console.log('[GamePage] Loaded puzzle:', puzzle);
          setPuzzleSet(puzzle);
        } else {
          console.warn('[GamePage] No team found, using demo puzzle');
          const demoPuzzle = await getPuzzleSet('demo');
          setPuzzleSet(demoPuzzle);
        }
      } catch (err) {
        console.error('[GamePage] Error loading puzzle:', err);
        const demoPuzzle = await getPuzzleSet('demo');
        setPuzzleSet(demoPuzzle);
      } finally {
        setPuzzleLoading(false);
      }
    };
    
    loadPuzzle();
  }, [roomCode, room?.puzzleSetId]);

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
      // Update room stage to symbol so both players transition
      await updateRoomStage(roomCode, 'symbol');
      
      // H shows partialCode1 reveal, U waits for envelope
      if (role === 'H') {
        setShowCode1Reveal(true);
        setCodesH(puzzleSet.partialCode1);
      } else {
        // U goes to waiting for envelope phase
        setSymbolPhase('waiting_envelope');
      }
    } else {
      // Increment round number for next attempt - persist to Firebase
      const newRound = memoryRoundNumber + 1;
      setMemoryRoundNumber(newRound);
      await update(ref(database, `rooms/${roomCode}`), { memoryRoundNumber: newRound });
    }
  };

  const handleCode1RevealComplete = async () => {
    if (!roomCode) return;
    setShowCode1Reveal(false);
    // H goes to waiting, U gets envelope prompt
    await updateRoomStage(roomCode, 'symbol');
    setSymbolPhase(role === 'U' ? 'waiting_envelope' : 'h_waiting');
  };

  const handleEnvelopeReceived = () => {
    setSymbolPhase('symbol_decode');
  };

  const handleSymbolCodeTransmit = async (code: string) => {
    if (!roomCode || !puzzleSet) return;
    setCodesU(puzzleSet.partialCode2);
    setReceivedSymbolCode(code);
    setSymbolPhase('transmitted');
    
    // Update room to notify H
    await update(ref(database, `rooms/${roomCode}`), {
      symbolCode: code
    });
    await updateRoomStage(roomCode, 'symbol_received');
  };

  // Watch for symbol code received
  useEffect(() => {
    if (role !== 'H' || !room || room.stage !== 'symbol_received') return;
    
    // H received the code - show code reveal
    if (puzzleSet?.partialCode2) {
      setReceivedSymbolCode(puzzleSet.partialCode2);
      setShowCode2Reveal(true);
    }
  }, [room?.stage, role, puzzleSet]);

  const handleCode2RevealComplete = () => {
    setShowCode2Reveal(false);
    setShowQRReveal(true);
  };

  const handleKeyFound = async () => {
    if (!roomCode) return;
    setShowQRReveal(false);
    setShowFinalPasscode(true);
    await updateRoomStage(roomCode, 'final');
  };

  const handleVictory = async () => {
    if (!roomCode) return;
    setShowVictory(true);
    await updateRoomStage(roomCode, 'victory');
  };

  // Calculate completion time when escaped
  useEffect(() => {
    if (room?.status === 'victory' && room?.startTime && room?.endTime) {
      const diff = room.endTime - room.startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCompletionTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  }, [room?.status, room?.startTime, room?.endTime]);

  if (!roomCode) return null;

  // Handle U victory complete - go back to waiting
  const handleUVictoryComplete = () => {
    setUVictoryComplete(true);
    setShowVictory(false);
  };

  // Admin declared victory - show escape screen for both players
  if (room?.status === 'victory' || room?.stage === 'escaped') {
    return (
      <EscapeScreen 
        teamId={teamId} 
        completionTime={completionTime || undefined}
      />
    );
  }

  // Victory Screen - different message for U and H (after H enters final code)
  if ((showVictory || room?.stage === 'victory') && !uVictoryComplete) {
    return (
      <VictoryScreen 
        teamId={teamId} 
        role={role} 
        onUComplete={role === 'U' ? handleUVictoryComplete : undefined}
      />
    );
  }
  
  // U player after victory complete - show waiting screen
  if (role === 'U' && uVictoryComplete) {
    return (
      <div 
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          backgroundImage: `url(${upsideDownBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'rotate(180deg)'
        }}
      >
        <CRTOverlay />
        <ThunderEffect intensity="light" />
        <div className="absolute inset-0 page-overlay" />
        
        <div className="relative z-10 flex flex-col flex-1 items-center justify-center p-8">
          <div className="text-center space-y-6">
            <p className="text-primary font-cinzel text-lg tracking-[0.3em] stranger-title flicker-slow">
              STRANGER THINGS
            </p>
            <GlitchText as="h2" className="text-3xl text-accent">
              YOU HAVE DONE EVERYTHING
            </GlitchText>
            <p className="text-foreground font-rajdhani text-xl font-medium">
              Wait until they reach the Upside Down...
            </p>
            <div className="animate-pulse mt-8">
              <div className="inline-block px-6 py-3 border border-primary/50 rounded-lg bg-primary/10">
                <p className="text-primary font-cinzel text-lg tracking-widest">
                  AWAITING RESCUE...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stage = room?.stage || 'alphabet';

  // Loading component for consistent branding
  const LoadingScreen = ({ message = "Establishing connection to the Upside Down..." }: { message?: string }) => (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <p className="text-primary font-cinzel text-2xl flicker-slow">CONNECTING...</p>
        </div>
        <p className="text-muted-foreground font-rajdhani font-medium">
          {message}
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  // Check if data is ready for current stage
  const isDataReady = !puzzleLoading && puzzleSet !== null && room !== null;

  // Render based on stage - ALWAYS check for data before rendering
  const renderContent = () => {
    // CRITICAL: If puzzle data or room data isn't loaded, show loading screen
    // This prevents black screen when one client transitions before data is synced
    if (!isDataReady) {
      return <LoadingScreen message="Syncing game data..." />;
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
            roomCode={roomCode}
            onComplete={handleMemoryComplete}
            onAnswer={handleMemoryAnswer}
            roundNumber={memoryRoundNumber}
          />
        );
      
      case 'symbol':
      case 'symbol_received':
        // Show code reveals first
        if (showCode1Reveal && role === 'H') {
          return (
            <CodeReveal 
              code={puzzleSet.partialCode1}
              title="CODE RECEIVED"
              duration={15}
              onComplete={handleCode1RevealComplete}
            />
          );
        }
        
        if (showCode2Reveal && role === 'H') {
          return (
            <CodeReveal 
              code={puzzleSet.partialCode2}
              title="TRANSMISSION RECEIVED"
              duration={15}
              onComplete={handleCode2RevealComplete}
            />
          );
        }
        
        if (showQRReveal && role === 'H') {
          return <QRReveal onKeyFound={handleKeyFound} />;
        }
        
        return (
          <SymbolPuzzle 
            role={role}
            partialCode1={puzzleSet.partialCode1}
            partialCode2={puzzleSet.partialCode2}
            receivedCode={receivedSymbolCode}
            phase={symbolPhase}
            onEnvelopeReceived={handleEnvelopeReceived}
            onCodeTransmit={handleSymbolCodeTransmit}
          />
        );
      
      case 'final':
        // U player sees waiting message, H player gets passcode input
        if (role === 'U') {
          return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <GlitchText as="h2" className="text-3xl text-accent">
                YOU HAVE DONE EVERYTHING
              </GlitchText>
              <p className="text-foreground font-rajdhani text-xl font-medium text-center">
                Wait until they reach the Upside Down...
              </p>
              <div className="animate-pulse">
                <p className="text-primary font-cinzel text-lg tracking-widest">
                  AWAITING FINAL TRANSMISSION...
                </p>
              </div>
            </div>
          );
        }
        
        return (
          <FinalPasscode 
            partialCode1={puzzleSet.partialCode1}
            teamId={teamId}
            partialCode2={puzzleSet.partialCode2}
            expectedCode=""
            onSuccess={handleVictory}
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
            <p className="text-primary font-cinzel text-lg tracking-[0.3em] mb-1 stranger-title">STRANGER THINGS</p>
            <GlitchText as="h1" className="text-3xl text-accent" noFlicker>
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
          <p className="text-primary font-cinzel text-lg tracking-[0.3em] mb-1 stranger-title">STRANGER THINGS</p>
          <GlitchText as="h1" className="text-3xl text-accent">
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
