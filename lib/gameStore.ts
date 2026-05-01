// lib/gameStore.ts — Zustand global state for Katapixel
import { create } from 'zustand';
import type { AppView, Room, PhaseSync, PublicRoom, ShowcaseAlbumHeader, Entry, AvatarId, FinishedAlbum } from './types';

interface GameState {
  currentView: AppView;
  mySocketId: string | null;
  myUsername: string;
  myAvatarId: AvatarId;
  myIsHost: boolean;
  roomData: Room | null;
  gamePhase: PhaseSync | null;
  timeLeft: number;
  hasSubmitted: boolean;

  // Showcase
  showcaseAlbumHeader: ShowcaseAlbumHeader | null;
  showcaseEntries: Entry[];
  showcaseAlbumDone: boolean;
  showcaseComplete: boolean;
  currentAlbumIndex: number;
  finishedAlbums: FinishedAlbum[];

  publicRooms: PublicRoom[];
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
  setPublicRooms: (rooms: PublicRoom[]) => void;
  setErrorMessage: (msg: string | null) => void;
  saveCurrentAlbum: () => void;
  viewAlbumByPlayer: (playerName: string, playerAvatarId: AvatarId) => void;
  resetForLobby: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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
  finishedAlbums: [],
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
  addShowcaseEntry: (e) => set((s) => ({ showcaseEntries: [...s.showcaseEntries, e] })),
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  saveCurrentAlbum: () => {
    const s = get();
    if (!s.showcaseAlbumHeader) return;
    const exists = s.finishedAlbums.some((a) => a.header.albumIndex === s.showcaseAlbumHeader!.albumIndex);
    if (exists) return;
    set({
      finishedAlbums: [...s.finishedAlbums, {
        header: { ...s.showcaseAlbumHeader },
        entries: [...s.showcaseEntries],
      }],
    });
  },

  // View a specific player's album (used after showcase completes)
  viewAlbumByPlayer: (playerName, playerAvatarId) => {
    const s = get();
    const album = s.finishedAlbums.find(
      (a) => a.header.ownerName === playerName && a.header.ownerAvatarId === playerAvatarId
    );
    if (!album) return;
    set({
      showcaseAlbumHeader: { ...album.header },
      showcaseEntries: [...album.entries],
      showcaseAlbumDone: true,
      currentAlbumIndex: album.header.albumIndex,
    });
  },

  resetForLobby: () => set({
    currentView: 'LOBBY',
    gamePhase: null, timeLeft: 0, hasSubmitted: false,
    showcaseAlbumHeader: null, showcaseEntries: [],
    showcaseAlbumDone: false, showcaseComplete: false,
    currentAlbumIndex: 0, finishedAlbums: [],
  }),
  resetAll: () => set({
    currentView: 'MAIN_MENU', roomData: null,
    gamePhase: null, timeLeft: 0, hasSubmitted: false, myIsHost: false,
    showcaseAlbumHeader: null, showcaseEntries: [],
    showcaseAlbumDone: false, showcaseComplete: false,
    currentAlbumIndex: 0, finishedAlbums: [], errorMessage: null,
  }),
}));
