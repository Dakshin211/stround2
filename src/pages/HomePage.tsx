import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRTOverlay } from '@/components/CRTOverlay';
import { ThunderEffect } from '@/components/ThunderEffect';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';
import { useGameRoom, PlayerRole } from '@/hooks/useGameRoom';
import upsideDownBg from '@/assets/upside-down-bg.png';

type Mode = 'select' | 'create' | 'join';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { createNewRoom, joinRoom, isLoading, error } = useGameRoom();
  
  const [mode, setMode] = useState<Mode>('select');
  const [teamId, setTeamId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<PlayerRole>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!teamId.trim()) return;
    
    try {
      const code = await createNewRoom(teamId.trim());
      setCreatedCode(code);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim() || !selectedRole) return;
    
    const success = await joinRoom(roomCode.trim(), selectedRole);
    if (success) {
      navigate('/start', { 
        state: { roomCode: roomCode.trim().toUpperCase(), role: selectedRole } 
      });
    }
  };

  const handleGoToStart = () => {
    if (createdCode) {
      navigate('/start', { 
        state: { roomCode: createdCode, role: 'U' } 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 upside-down-bg"
        style={{
          backgroundImage: `url(${upsideDownBg})`
        }}
      />
      
      <CRTOverlay />
      <ThunderEffect intensity="medium" />
      
      {/* Slight darkness overlay */}
      <div className="absolute inset-0 page-overlay" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        {/* Title */}
        <div className="space-y-3">
          <GlitchText as="h1" className="text-4xl md:text-5xl">
            STRANGER THINGS
          </GlitchText>
          <p className="text-primary/90 font-cinzel text-xl tracking-widest flicker-slow">
            THE UPSIDE DOWN
          </p>
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <ScaryButton 
              size="lg" 
              className="w-full"
              onClick={() => setMode('create')}
            >
              Create Room
            </ScaryButton>
            
            <ScaryButton 
              size="lg" 
              variant="secondary"
              className="w-full"
              onClick={() => setMode('join')}
            >
              Join Room
            </ScaryButton>
          </div>
        )}

        {/* Create Room */}
        {mode === 'create' && !createdCode && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-2">
              <label className="text-foreground font-rajdhani text-sm font-semibold tracking-wide">
                Enter Team ID
              </label>
              <Input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Your team name..."
                className="bg-card/90 border-border text-center font-rajdhani text-lg"
              />
            </div>
            
            <ScaryButton 
              size="lg" 
              className="w-full"
              onClick={handleCreate}
              isLoading={isLoading}
              disabled={!teamId.trim()}
            >
              Enter the Void
            </ScaryButton>
            
            <button 
              onClick={() => setMode('select')}
              className="text-muted-foreground font-rajdhani text-sm hover:text-foreground transition font-semibold"
            >
              ← Go Back
            </button>
            
            {error && (
              <p className="text-destructive font-rajdhani text-sm font-semibold">{error}</p>
            )}
          </div>
        )}

        {/* Room Created */}
        {mode === 'create' && createdCode && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-card/80 border border-primary/50 rounded-lg p-6 backdrop-blur-sm">
              <p className="text-muted-foreground font-rajdhani text-sm mb-2 font-semibold">
                Share this code with Player H
              </p>
              <p className="text-4xl font-cinzel text-primary tracking-widest flicker-slow">
                {createdCode}
              </p>
            </div>
            
            <p className="text-muted-foreground font-rajdhani text-sm font-medium">
              You are Player U - The one in the Upside Down
            </p>
            
            <ScaryButton 
              size="lg" 
              className="w-full"
              onClick={handleGoToStart}
            >
              Continue
            </ScaryButton>
          </div>
        )}

        {/* Join Room */}
        {mode === 'join' && (
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-2">
              <label className="text-foreground font-rajdhani text-sm font-semibold tracking-wide">
                Enter Room Code
              </label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="bg-card/90 border-border text-center font-cinzel text-2xl tracking-widest"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-foreground font-rajdhani text-sm font-semibold tracking-wide">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedRole('H')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'H' 
                      ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20' 
                      : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="font-cinzel text-xl block">H</span>
                  <span className="font-rajdhani text-xs font-medium">The Receiver</span>
                </button>
                
                <button
                  onClick={() => setSelectedRole('U')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'U' 
                      ? 'border-primary bg-primary/20 text-primary shadow-lg shadow-primary/20' 
                      : 'border-border bg-card/60 text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="font-cinzel text-xl block">U</span>
                  <span className="font-rajdhani text-xs font-medium">Upside Down</span>
                </button>
              </div>
            </div>
            
            <ScaryButton 
              size="lg" 
              className="w-full"
              onClick={handleJoin}
              isLoading={isLoading}
              disabled={!roomCode.trim() || !selectedRole}
            >
              Enter
            </ScaryButton>
            
            <button 
              onClick={() => setMode('select')}
              className="text-muted-foreground font-rajdhani text-sm hover:text-foreground transition font-semibold"
            >
              ← Go Back
            </button>
            
            {error && (
              <p className="text-destructive font-rajdhani text-sm font-semibold">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
