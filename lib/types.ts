// lib/types.ts — Shared TypeScript types for Katapixel

export type AvatarId = number; // 0-9

export const AVATARS: string[] = ['🐱', '🐶', '🐸', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮'];

export interface Player {
  socketId: string;
  username: string;
  avatarId: AvatarId;
  isHost: boolean;
}

export type RoomStatus = 'LOBBY' | 'IN_GAME' | 'SHOWCASE';

export interface Room {
  roomId: string;
  status: RoomStatus;
  isPrivate: boolean;
  maxPlayers: number;
  drawTime: number;
  guessTime: number;
  theme: string;
  players: Player[];
  currentRound: number;
}

export type EntryType = 'TEXT' | 'IMAGE' | 'EMPTY_CANVAS' | 'FALLBACK_TEXT';

export interface Entry {
  authorId: string;
  authorName?: string;
  authorAvatarId?: AvatarId;
  type: EntryType;
  content: string;
}

export type ExpectedInput = 'TEXT_FORM' | 'CANVAS';

export interface PhaseSync {
  roundNumber: number;
  totalRounds: number;
  expectedInput: ExpectedInput;
  referenceData: { type: EntryType; content: string } | null;
}

export interface PublicRoom {
  roomId: string;
  hostName: string;
  hostAvatarId: AvatarId;
  playerCount: number;
  maxPlayers: number;
  theme: string;
}

export interface ShowcaseAlbumHeader {
  ownerName: string;
  ownerAvatarId: AvatarId;
  albumIndex: number;
  totalAlbums: number;
}

export type AppView = 'MAIN_MENU' | 'LOBBY' | 'GAME' | 'SHOWCASE';

export interface FinishedAlbum {
  header: ShowcaseAlbumHeader;
  entries: Entry[];
}
