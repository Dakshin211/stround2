import { useState, useEffect, useCallback } from 'react';
import { 
  Room, 
  GameStage,
  subscribeToRoom, 
  updateRoomStage, 
  updateAlphabetCurrent,
  createRoom,
  createTeam,
  getRandomPuzzleSet,
  generateRoomCode,
  getRoomData,
  getTeam,
  getPuzzleSet,
  PuzzleSet,
  Team
} from '@/lib/firebase';

export type PlayerRole = 'U' | 'H' | null;

interface UseGameRoomReturn {
  roomCode: string | null;
  room: Room | null;
  team: Team | null;
  puzzleSet: PuzzleSet | null;
  role: PlayerRole;
  isLoading: boolean;
  error: string | null;
  createNewRoom: (teamId: string) => Promise<string>;
  joinRoom: (code: string, role: PlayerRole) => Promise<boolean>;
  setStage: (stage: GameStage) => Promise<void>;
  sendLetter: (letter: string) => Promise<void>;
  currentLetter: string;
}

export function useGameRoom(): UseGameRoomReturn {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [puzzleSet, setPuzzleSet] = useState<PuzzleSet | null>(null);
  const [role, setRole] = useState<PlayerRole>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLetter, setCurrentLetter] = useState('');

  // Subscribe to room changes
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToRoom(roomCode, (roomData) => {
      setRoom(roomData);
      if (roomData?.alphabet?.current) {
        setCurrentLetter(roomData.alphabet.current);
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Load team and puzzle data
  useEffect(() => {
    if (!roomCode) return;

    const loadTeamData = async () => {
      try {
        const teamData = await getTeam(roomCode);
        if (teamData) {
          setTeam(teamData);
          const puzzle = await getPuzzleSet(teamData.puzzleSet);
          setPuzzleSet(puzzle);
        }
      } catch (err) {
        console.error('Error loading team data:', err);
      }
    };

    loadTeamData();
  }, [roomCode]);

  const createNewRoom = useCallback(async (teamId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const code = generateRoomCode();
      const puzzleData = await getRandomPuzzleSet();
      
      if (!puzzleData) {
        throw new Error('Failed to get puzzle set');
      }

      await createRoom(code);
      await createTeam(code, teamId, puzzleData.id);
      
      setRoomCode(code);
      setPuzzleSet(puzzleData.data);
      setRole('U'); // Creator is always U (Upside Down)
      
      return code;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (code: string, playerRole: PlayerRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const roomData = await getRoomData(code.toUpperCase());
      
      if (!roomData) {
        setError('Room not found');
        return false;
      }

      setRoomCode(code.toUpperCase());
      setRole(playerRole);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setStage = useCallback(async (stage: GameStage): Promise<void> => {
    if (!roomCode) return;
    
    try {
      await updateRoomStage(roomCode, stage);
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  }, [roomCode]);

  const sendLetter = useCallback(async (letter: string): Promise<void> => {
    if (!roomCode) return;
    
    try {
      await updateAlphabetCurrent(roomCode, letter);
    } catch (err) {
      console.error('Error sending letter:', err);
    }
  }, [roomCode]);

  return {
    roomCode,
    room,
    team,
    puzzleSet,
    role,
    isLoading,
    error,
    createNewRoom,
    joinRoom,
    setStage,
    sendLetter,
    currentLetter
  };
}
