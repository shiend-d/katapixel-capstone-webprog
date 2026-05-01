// lib/gameStore.ts — Zustand global state for Katapixel
import { create } from 'zustand';
import type { AppView, Room, PhaseSync, PublicRoom, ShowcaseAlbumHeader, Entry, AvatarId, FinishedAlbum } from './types';

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

  // Showcase — live stream
  showcaseAlbumHeader: ShowcaseAlbumHeader | null;
  showcaseEntries: Entry[];
  showcaseAlbumDone: boolean;
  showcaseComplete: boolean;
  currentAlbumIndex: number;

  // Showcase — client-side album storage for re-navigation
  finishedAlbums: FinishedAlbum[];
  isReviewingPast: boolean;  // true when user is viewing a previously finished album

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
  setPublicRooms: (rooms: PublicRoom[]) => void;
  setErrorMessage: (msg: string | null) => void;

  // Save the current live album into finishedAlbums
  saveCurrentAlbum: () => void;
  // View a previously finished album by index
  viewPastAlbum: (albumIndex: number) => void;
  // Return from reviewing to the current live state
  returnToLive: () => void;

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
  isReviewingPast: false,
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
  addShowcaseEntry: (e) => {
    // Only add entries if not reviewing a past album
    const state = get();
    if (state.isReviewingPast) return;
    set({ showcaseEntries: [...state.showcaseEntries, e] });
  },
  setPublicRooms: (rooms) => set({ publicRooms: rooms }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  saveCurrentAlbum: () => {
    const state = get();
    if (!state.showcaseAlbumHeader) return;
    // Avoid duplicates
    const exists = state.finishedAlbums.some(
      (a) => a.header.albumIndex === state.showcaseAlbumHeader!.albumIndex
    );
    if (exists) return;
    const album: FinishedAlbum = {
      header: { ...state.showcaseAlbumHeader },
      entries: [...state.showcaseEntries],
    };
    set({ finishedAlbums: [...state.finishedAlbums, album] });
  },

  viewPastAlbum: (albumIndex: number) => {
    const state = get();
    const album = state.finishedAlbums.find((a) => a.header.albumIndex === albumIndex);
    if (!album) return;
    set({
      isReviewingPast: true,
      showcaseAlbumHeader: { ...album.header },
      showcaseEntries: [...album.entries],
      showcaseAlbumDone: true,
      currentAlbumIndex: albumIndex,
    });
  },

  returnToLive: () => {
    // This will be triggered automatically when showcase_album_header arrives
    set({ isReviewingPast: false });
  },

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
    finishedAlbums: [],
    isReviewingPast: false,
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
    currentAlbumIndex: 0,
    finishedAlbums: [],
    isReviewingPast: false,
    errorMessage: null,
  }),
}));
