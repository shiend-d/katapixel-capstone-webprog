// lib/gameStore.ts — Zustand global state for Katapixel
import { create } from 'zustand';
import type { AppView, Room, PhaseSync, PublicRoom, ShowcaseAlbumHeader, Entry, AvatarId } from './types';

interface GameState {
  // Navigation
  currentView: AppView;

  // My player
  mySocketId: string | null;
  myUsername: string;
  myAvatarId: AvatarId;
  myIsHost: boolean;

  // Room
  roomData: Room | null;

  // Game phase
  gamePhase: PhaseSync | null;
  timeLeft: number;
  hasSubmitted: boolean;

  // Showcase
  showcaseAlbumHeader: ShowcaseAlbumHeader | null;
  showcaseEntries: Entry[];
  showcaseAlbumDone: boolean;
  showcaseComplete: boolean;
  currentAlbumIndex: number;
  allAlbums: Entry[][];

  // Public rooms
  publicRooms: PublicRoom[];

  // Error
  errorMessage: string | null;

  // Actions
  setView: (view: AppView) => void;
  setMySocketId: (id: string) => void;
  setMyUsername: (name: string) => void;
  setMyAvatarId: (id: AvatarId) => void;
  setRoomData: (room: Room | null) => void;
  setGamePhase: (phase: PhaseSync | null) => void;
  setTimeLeft: (t: number) => void;
  setHasSubmitted: (v: boolean) => void;
  setShowcaseAlbumHeader: (h: ShowcaseAlbumHeader | null) => void;
  addShowcaseEntry: (e: Entry) => void;
  setShowcaseAlbumDone: (v: boolean) => void;
  setShowcaseComplete: (v: boolean) => void;
  setCurrentAlbumIndex: (index: number) => void;
  setAllAlbums: (albums: Entry[][]) => void;
  setPublicRooms: (rooms: PublicRoom[]) => void;
  setErrorMessage: (msg: string | null) => void;
  resetForNewAlbum: () => void;
  resetForLobby: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentView: 'MAIN_MENU',
  mySocketId: null,
  myUsername: '',
  myAvatarId: 0,
  myIsHost: false,
  roomData: null,
  gamePhase: null,
  timeLeft: 0,
  hasSubmitted: false,
  showcaseAlbumHeader: null,
  showcaseEntries: [],
  showcaseAlbumDone: false,
  showcaseComplete: false,
  currentAlbumIndex: 0,
  allAlbums: [],
  publicRooms: [],
  errorMessage: null,

  setView: (view) => set({ currentView: view }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setMyUsername: (name) => set({ myUsername: name }),
  setMyAvatarId: (id) => set({ myAvatarId: id }),
  setRoomData: (room) => {
    if (room) {
      set((state) => {
        const me = room.players.find((p) => p.socketId === state.mySocketId);
        return { roomData: room, myIsHost: me?.isHost ?? false };
      });
    } else {
      set({ roomData: null, myIsHost: false });
    }
  },
  setGamePhase: (phase) => set({ gamePhase: phase, hasSubmitted: false }),
  setTimeLeft: (t) => set({ timeLeft: t }),
  setHasSubmitted: (v) => set({ hasSubmitted: v }),
  setShowcaseAlbumHeader: (h) => set({ showcaseAlbumHeader: h }),
  addShowcaseEntry: (e) => set((state) => ({ showcaseEntries: [...state.showcaseEntries, e] })),
  setShowcaseAlbumDone: (v) => set({ showcaseAlbumDone: v }),
  setShowcaseComplete: (v) => set({ showcaseComplete: v }),
  setCurrentAlbumIndex: (index) => set({ currentAlbumIndex: index }),
  setAllAlbums: (albums) => set({ allAlbums: albums }),
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  resetForNewAlbum: () => set({ showcaseEntries: [], showcaseAlbumDone: false, currentAlbumIndex: 0 }),
  resetForLobby: () => set({
    currentView: 'LOBBY',
    gamePhase: null,
    timeLeft: 0,
    hasSubmitted: false,
    showcaseAlbumHeader: null,
    showcaseEntries: [],
    showcaseAlbumDone: false,
    showcaseComplete: false,
    currentAlbumIndex: 0,
    allAlbums: [],
  }),
  resetAll: () => set({
    currentView: 'MAIN_MENU',
    roomData: null,
    gamePhase: null,
    timeLeft: 0,
    hasSubmitted: false,
    myIsHost: false,
    showcaseAlbumHeader: null,
    showcaseEntries: [],
    showcaseAlbumDone: false,
    showcaseComplete: false,
    errorMessage: null,
  }),
}));
