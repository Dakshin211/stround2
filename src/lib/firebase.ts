import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, push } from 'firebase/database';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEliAzXuxO7KtCnyyQcLc6KymyYAzq9Rk",
  authDomain: "soulsync-8f81f.firebaseapp.com",
  databaseURL: "https://soulsync-8f81f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "soulsync-8f81f",
  storageBucket: "soulsync-8f81f.firebasestorage.app",
  messagingSenderId: "408782154454",
  appId: "1:408782154454:web:46648c1f9bcadd9d7ef777"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const firestore = getFirestore(app);

// Room types
export type GameStage = 'waiting' | 'countdown' | 'alphabet' | 'alphabet_retransmit' | 'no_signal' | 'communication_unlock' | 'memory1' | 'memory1_wait' | 'memory1_answer' | 'symbol' | 'symbol_received' | 'final' | 'victory';

export interface Room {
  u: boolean;
  h: boolean;
  stage: GameStage;
  alphabet: {
    current: string;
    transmissionId: number; // Unique ID for each letter transmission
    transmissionComplete: boolean; // Flag when U finishes transmission
  };
  uReady?: boolean;
  hReady?: boolean;
}

export interface PuzzleSet {
  alphabetClue: string;
  alphabetAnswer: string;
  memoryList: string[];
  memoryText: string;
  memoryQuestion: string;
  memoryAnswer: string;
  memoryGuaranteedWords?: string[]; // Words that must be included in random selection
  partialCode1: string;
  partialCode2: string;
  navigationQR: string;
}

export interface Team {
  teamId: string;
  puzzleSet: string;
  stage: GameStage;
  attempts: {
    alphabet: number;
    memory: number;
  };
  codes: {
    h: string;
    u: string;
  };
}

// Generate a 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Realtime Database functions
export async function createRoom(roomCode: string): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await set(roomRef, {
    u: true,
    h: true,
    stage: 'waiting',
    alphabet: {
      current: '',
      transmissionId: 0,
      transmissionComplete: false
    },
    uReady: false,
    hReady: false
  });
}

export function subscribeToRoom(roomCode: string, callback: (room: Room | null) => void): () => void {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
  return unsubscribe;
}

export async function updateRoomStage(roomCode: string, stage: GameStage): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, { stage });
}

export async function updateAlphabetCurrent(roomCode: string, letter: string): Promise<void> {
  // Get current transmissionId and increment it
  const roomRef = ref(database, `rooms/${roomCode}/alphabet`);
  const snapshot = await get(roomRef);
  const currentData = snapshot.val() || { transmissionId: 0 };
  
  await update(roomRef, { 
    current: letter,
    transmissionId: (currentData.transmissionId || 0) + 1
  });
}

export async function setPlayerReady(roomCode: string, player: 'u' | 'h', ready: boolean): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, { 
    [`${player}Ready`]: ready 
  });
}

export async function resetPlayerReady(roomCode: string): Promise<void> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, { 
    uReady: false,
    hReady: false 
  });
}

export async function getRoomData(roomCode: string): Promise<Room | null> {
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  return snapshot.val();
}

// Firestore functions
export async function getRandomPuzzleSet(): Promise<{ id: string; data: PuzzleSet } | null> {
  const puzzleSetsRef = collection(firestore, 'puzzleSets');
  const snapshot = await getDocs(puzzleSetsRef);
  
  if (snapshot.empty) {
    // Return default puzzle set for demo
    return {
      id: 'demo',
      data: {
        alphabetClue: 'I am stuck in darkness. Find me in the void.',
        alphabetAnswer: 'HELP',
        memoryList: ['Eleven', 'Will', 'Dustin', 'Mike', 'Lucas', 'Nancy', 'Jonathan', 'Hopper'],
        memoryText: 'The gate opened in 1983 when a young girl with extraordinary powers escaped from Hawkins Lab. She had the number 011 on her wrist.',
        memoryQuestion: 'Who opened the gate?',
        memoryAnswer: 'ELEVEN',
        memoryGuaranteedWords: ['Eleven'],
        partialCode1: '1983',
        partialCode2: '011',
        navigationQR: ''
      }
    };
  }
  
  const docs = snapshot.docs;
  const randomIndex = Math.floor(Math.random() * docs.length);
  const randomDoc = docs[randomIndex];
  
  return {
    id: randomDoc.id,
    data: randomDoc.data() as PuzzleSet
  };
}

export async function createTeam(roomCode: string, teamId: string, puzzleSetId: string): Promise<void> {
  const teamRef = doc(firestore, 'teams', roomCode);
  await setDoc(teamRef, {
    teamId,
    puzzleSet: puzzleSetId,
    stage: 'waiting',
    attempts: {
      alphabet: 0,
      memory: 0
    },
    codes: {
      h: '',
      u: ''
    }
  });
}

export async function getTeam(roomCode: string): Promise<Team | null> {
  const teamRef = doc(firestore, 'teams', roomCode);
  const snapshot = await getDoc(teamRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as Team;
}

export async function getPuzzleSet(puzzleSetId: string): Promise<PuzzleSet | null> {
  if (puzzleSetId === 'demo') {
    return {
      alphabetClue: 'I am stuck in darkness. Find me in the void.',
      alphabetAnswer: 'HELP',
      memoryList: ['Eleven', 'Will', 'Dustin', 'Mike', 'Lucas', 'Nancy', 'Jonathan', 'Hopper'],
      memoryText: 'The gate opened in 1983 when a young girl with extraordinary powers escaped from Hawkins Lab. She had the number 011 on her wrist.',
      memoryQuestion: 'Who opened the gate?',
      memoryAnswer: 'ELEVEN',
      memoryGuaranteedWords: ['Eleven'],
      partialCode1: '1983',
      partialCode2: '011',
      navigationQR: ''
    };
  }
  
  const puzzleRef = doc(firestore, 'puzzleSets', puzzleSetId);
  const snapshot = await getDoc(puzzleRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return snapshot.data() as PuzzleSet;
}

export async function updateTeamAttempts(roomCode: string, field: 'alphabet' | 'memory', value: number): Promise<void> {
  const teamRef = doc(firestore, 'teams', roomCode);
  await setDoc(teamRef, {
    attempts: {
      [field]: value
    }
  }, { merge: true });
}
