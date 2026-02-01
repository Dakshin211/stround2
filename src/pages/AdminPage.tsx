import React, { useState } from 'react';
import { CRTOverlay } from '@/components/CRTOverlay';
import { GlitchText } from '@/components/GlitchText';
import { ScaryButton } from '@/components/ScaryButton';
import { Input } from '@/components/ui/input';
import { 
  database, 
  getPuzzleSet, 
  Room, 
  PuzzleSet,
  getMemoryListAsArray 
} from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

const AdminPage: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [puzzleData, setPuzzleData] = useState<PuzzleSet | null>(null);
  const [teamId, setTeamId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [declaring, setDeclaring] = useState(false);

  const handleFetchRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');
    setRoomData(null);
    setPuzzleData(null);

    try {
      const roomRef = ref(database, `rooms/${roomCode.toUpperCase()}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        setError('Room not found');
        setLoading(false);
        return;
      }

      const room = snapshot.val() as Room;
      setRoomData(room);

      // Fetch puzzle set
      if (room.puzzleSetId) {
        const puzzle = await getPuzzleSet(room.puzzleSetId);
        setPuzzleData(puzzle);
      }

      // Get team ID from firestore or extract from room
      try {
        const { getTeam } = await import('@/lib/firebase');
        const team = await getTeam(roomCode.toUpperCase());
        if (team) {
          setTeamId(team.teamId);
        }
      } catch (e) {
        console.warn('Could not fetch team:', e);
      }

    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to fetch room data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareVictory = async () => {
    if (!roomCode) return;

    setDeclaring(true);
    try {
      const roomRef = ref(database, `rooms/${roomCode.toUpperCase()}`);
      const now = Date.now();
      
      await update(roomRef, {
        status: 'victory',
        stage: 'escaped',
        endTime: now
      });

      // Refresh room data
      await handleFetchRoom();
      setShowConfirm(false);
    } catch (err) {
      console.error('Error declaring victory:', err);
      setError('Failed to declare victory');
    } finally {
      setDeclaring(false);
    }
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const diff = endTime - startTime;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-void p-4 relative overflow-hidden">
      <CRTOverlay />
      
      <div className="relative z-10 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-8">
          <p className="text-primary font-cinzel text-sm tracking-[0.3em] mb-2 stranger-title">
            STRANGER THINGS
          </p>
          <GlitchText as="h1" className="text-2xl md:text-3xl text-accent">
            ADMIN PANEL
          </GlitchText>
        </div>

        {/* Room Code Input */}
        <div className="bg-card/80 border border-border rounded-lg p-4 backdrop-blur-sm space-y-4">
          <label className="text-foreground font-rajdhani text-sm font-semibold block">
            Enter Room Code
          </label>
          <Input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            className="bg-card/80 border-border text-center font-cinzel text-xl tracking-wider uppercase"
            maxLength={6}
          />
          <ScaryButton 
            className="w-full" 
            onClick={handleFetchRoom}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Fetch Room Data'}
          </ScaryButton>

          {error && (
            <p className="text-destructive font-rajdhani text-center text-sm">{error}</p>
          )}
        </div>

        {/* Room Data Display */}
        {roomData && (
          <div className="bg-card/80 border border-border rounded-lg p-4 backdrop-blur-sm space-y-4">
            <GlitchText as="h3" className="text-xl text-primary mb-4">
              ROOM: {roomCode.toUpperCase()}
            </GlitchText>

            <div className="space-y-3">
              {/* Team ID */}
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-rajdhani">Team ID:</span>
                <span className="text-foreground font-cinzel">{teamId || 'N/A'}</span>
              </div>

              {/* Puzzle Set */}
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-rajdhani">Puzzle Set:</span>
                <span className="text-foreground font-cinzel">{roomData.puzzleSetId || 'demo'}</span>
              </div>

              {/* Current Stage */}
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-rajdhani">Current Stage:</span>
                <span className="text-accent font-cinzel">{roomData.stage}</span>
              </div>

              {/* Status */}
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-rajdhani">Status:</span>
                <span className={`font-cinzel ${roomData.status === 'victory' ? 'text-accent' : 'text-foreground'}`}>
                  {roomData.status || 'playing'}
                </span>
              </div>

              {/* Time (if available) */}
              {roomData.startTime && roomData.endTime && (
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground font-rajdhani">Completion Time:</span>
                  <span className="text-primary font-cinzel">
                    {formatDuration(roomData.startTime, roomData.endTime)}
                  </span>
                </div>
              )}

              {/* Memory Round */}
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-rajdhani">Memory Round:</span>
                <span className="text-foreground font-cinzel">{roomData.memoryRoundNumber || 1}</span>
              </div>
            </div>

            {/* Puzzle Data */}
            {puzzleData && (
              <div className="border-t border-primary/30 pt-4 mt-4 space-y-3">
                <p className="text-primary font-cinzel text-lg">PUZZLE DATA</p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground font-rajdhani">Alphabet Clue:</span>
                    <p className="text-foreground font-rajdhani mt-1">{puzzleData.alphabetClue}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground font-rajdhani">Alphabet Answer:</span>
                    <span className="text-accent font-cinzel ml-2">{puzzleData.alphabetAnswer}</span>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground font-rajdhani">Memory Words:</span>
                    <p className="text-foreground font-rajdhani mt-1">
                      {getMemoryListAsArray(puzzleData.memoryList).join(', ')}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground font-rajdhani">Memory Question:</span>
                    <p className="text-foreground font-rajdhani mt-1">{puzzleData.memoryQuestion}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground font-rajdhani">Memory Answer:</span>
                    <span className="text-accent font-cinzel ml-2">{puzzleData.memoryAnswer}</span>
                  </div>
                  
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground font-rajdhani">Code 1:</span>
                      <span className="text-primary font-cinzel ml-2">{puzzleData.partialCode1}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-rajdhani">Code 2:</span>
                      <span className="text-primary font-cinzel ml-2">{puzzleData.partialCode2}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Victory Button */}
            {roomData.status !== 'victory' && (
              <div className="border-t border-primary/30 pt-4 mt-4">
                {!showConfirm ? (
                  <ScaryButton 
                    className="w-full"
                    onClick={() => setShowConfirm(true)}
                  >
                    🏆 DECLARE VICTORY
                  </ScaryButton>
                ) : (
                  <div className="space-y-3">
                    <p className="text-foreground font-rajdhani text-center">
                      Are you sure you want to declare victory for this team?
                    </p>
                    <div className="flex gap-2">
                      <ScaryButton 
                        className="flex-1"
                        variant="secondary"
                        onClick={() => setShowConfirm(false)}
                        disabled={declaring}
                      >
                        Cancel
                      </ScaryButton>
                      <ScaryButton 
                        className="flex-1"
                        onClick={handleDeclareVictory}
                        disabled={declaring}
                      >
                        {declaring ? 'Declaring...' : 'Confirm Victory'}
                      </ScaryButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Victory Badge */}
            {roomData.status === 'victory' && (
              <div className="border-t border-primary/30 pt-4 mt-4">
                <div className="bg-primary/20 border border-primary/50 rounded-lg p-4 text-center">
                  <p className="text-primary font-cinzel text-xl">🏆 VICTORY DECLARED 🏆</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
