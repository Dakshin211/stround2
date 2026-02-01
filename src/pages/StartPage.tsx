import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ThunderEffect } from '@/components/ThunderEffect';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { subscribeToRoom, updateRoomStage, Room, database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import upsideDownBg from '@/assets/upside-down-bg.png';

const StartPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode, role } = location.state || {};
  
  const [room, setRoom] = useState<Room | null>(null);
  const [waitingForConfirm, setWaitingForConfirm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      setRoom(roomData);
      
      // If stage changed to countdown, show countdown for both
      if (roomData?.stage === 'countdown') {
        setShowCountdown(true);
      }
      
      // If stage changed to alphabet, navigate to game
      if (roomData?.stage === 'alphabet') {
        navigate('/game', { state: { roomCode, role } });
      }
    });

    return () => unsubscribe();
  }, [roomCode, role, navigate]);

  // Listen for stage change that indicates U pressed start
  useEffect(() => {
    if (room?.stage === 'waiting' && role === 'H') {
      const pendingConfirm = localStorage.getItem(`pending_${roomCode}`);
      if (pendingConfirm === 'true') {
        setShowConfirmDialog(true);
      }
    }
  }, [room, role, roomCode]);

  const handleStart = async () => {
    if (role === 'U') {
      localStorage.setItem(`pending_${roomCode}`, 'true');
      setWaitingForConfirm(true);
      setShowConfirmDialog(true); // Show confirm for demo
    }
  };

  const handleConfirm = async () => {
    localStorage.removeItem(`pending_${roomCode}`);
    // Start countdown stage
    await updateRoomStage(roomCode, 'countdown');
  };

  const handleCountdownComplete = async () => {
    // Record game start time and move to alphabet stage
    await update(ref(database, `rooms/${roomCode}`), { 
      startTime: Date.now(),
      status: 'playing'
    });
    await updateRoomStage(roomCode, 'alphabet');
  };

  const handleDecline = () => {
    localStorage.removeItem(`pending_${roomCode}`);
    setShowConfirmDialog(false);
    setWaitingForConfirm(false);
  };

  if (!roomCode) return null;

  // Determine if background should be inverted (for U player)
  const isUpsideDown = role === 'U';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background - inverted for U player */}
      <div 
        className="absolute inset-0 upside-down-bg"
        style={{
          backgroundImage: `url(${upsideDownBg})`,
          transform: isUpsideDown ? 'rotate(180deg)' : 'none'
        }}
      />
      
      <CRTOverlay />
      <ThunderEffect intensity="strong" />
      
      {/* Slight darkness overlay */}
      <div className="absolute inset-0 page-overlay" />
      
      {/* Countdown Overlay */}
      {showCountdown && (
        <CountdownOverlay onComplete={handleCountdownComplete} startFrom={5} />
      )}
      
      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        {/* Room Info */}
        <div className="bg-card/70 border border-border rounded-lg p-4 backdrop-blur-sm">
          <p className="text-muted-foreground font-rajdhani text-sm font-medium">Room Code</p>
          <p className="text-2xl font-cinzel text-primary tracking-widest flicker-slow">{roomCode}</p>
          <p className="text-xs font-rajdhani text-muted-foreground mt-1 font-medium">
            You are Player {role} {role === 'U' && '- Upside Down'}
          </p>
        </div>

        {/* Main Content */}
        {!showConfirmDialog && !waitingForConfirm && !showCountdown && (
          <div className="space-y-8 animate-fade-in">
            <GlitchText as="h1" className="text-5xl md:text-6xl">
              THE UPSIDE DOWN
            </GlitchText>
            
            <p className="text-foreground/90 font-rajdhani leading-relaxed text-lg font-medium">
              Something is coming. The lights flicker. The walls breathe.
              Are you ready to enter?
            </p>
            
            <ScaryButton 
              size="lg" 
              className="w-full animate-pulse-glow"
              onClick={handleStart}
            >
              START
            </ScaryButton>
          </div>
        )}

        {/* Waiting for Confirmation */}
        {waitingForConfirm && !showConfirmDialog && !showCountdown && (
          <div className="space-y-4 animate-fade-in">
            <div className="flicker-slow">
              <GlitchText as="h2" className="text-3xl">
                WAITING...
              </GlitchText>
            </div>
            <p className="text-muted-foreground font-rajdhani font-medium">
              Waiting for Player H to confirm entry
            </p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && !showCountdown && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-card/80 border-2 border-primary/60 rounded-lg p-6 backdrop-blur-sm">
              <GlitchText as="h2" className="text-2xl mb-4">
                WARNING
              </GlitchText>
              <p className="text-foreground font-rajdhani leading-relaxed text-lg font-medium">
                Confirm to enter the Upside Down?
              </p>
              <p className="text-muted-foreground font-rajdhani text-sm mt-2 font-medium">
                There is no going back...
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <ScaryButton 
                variant="secondary"
                onClick={handleDecline}
              >
                Not Yet
              </ScaryButton>
              
              <ScaryButton 
                onClick={handleConfirm}
              >
                Enter
              </ScaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartPage;
