'use client';
// app/page.tsx — SPA Root: switches views based on global state + socket events

import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { useGameStore } from '../lib/gameStore';
import MainMenuView from '../components/views/MainMenuView';
import LobbyView from '../components/views/LobbyView';
import GameTextView from '../components/views/GameTextView';
import GameCanvasView from '../components/views/GameCanvasView';
import ShowcaseView from '../components/views/ShowcaseView';

export default function Home() {
  const currentView = useGameStore((s) => s.currentView);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const errorMessage = useGameStore((s) => s.errorMessage);

  // ── Socket event wiring ───────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    const store = useGameStore.getState;
    const set = useGameStore.setState;

    socket.on('connect', () => {
      set({ mySocketId: socket.id || null });
    });

    socket.on('public_rooms_list', (rooms) => {
      useGameStore.getState().setPublicRooms(rooms);
    });

    socket.on('room_created', () => {
      set({ currentView: 'LOBBY' });
    });

    socket.on('room_state_update', (room) => {
      const state = store();
      useGameStore.getState().setRoomData(room);
      // If we just joined and are on MAIN_MENU, move to LOBBY
      if (state.currentView === 'MAIN_MENU' && room) {
        set({ currentView: 'LOBBY' });
      }
      // If showcase complete and room reset to LOBBY
      if (room?.status === 'LOBBY' && state.currentView === 'SHOWCASE') {
        useGameStore.getState().resetForLobby();
      }
    });

    socket.on('game_started', () => {
      // Wait for phase_sync to determine the actual view
    });

    socket.on('phase_sync', (phase) => {
      useGameStore.getState().setGamePhase(phase);
      set({ currentView: 'GAME', hasSubmitted: false });
    });

    socket.on('timer_tick', ({ timeLeft }) => {
      set({ timeLeft });
    });

    socket.on('showcase_start', () => {
      set({
        currentView: 'SHOWCASE',
        showcaseEntries: [],
        showcaseAlbumDone: false,
        showcaseComplete: false,
        showcaseAlbumHeader: null,
      });
    });

    socket.on('showcase_album_header', (header) => {
      useGameStore.getState().setShowcaseAlbumHeader(header);
      useGameStore.getState().resetForNewAlbum();
    });

    socket.on('showcase_step', (entry) => {
      useGameStore.getState().addShowcaseEntry(entry);
    });

    socket.on('showcase_album_done', () => {
      set({ showcaseAlbumDone: true });
    });

    socket.on('showcase_complete', () => {
      set({ showcaseComplete: true });
    });

    socket.on('error_alert', ({ message }) => {
      set({ errorMessage: message });
      // If kicked or host DC, go back to main menu
      if (message.includes('dikeluarkan') || message.includes('dibubarkan') || message.includes('Host')) {
        setTimeout(() => {
          useGameStore.getState().resetAll();
        }, 2000);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('public_rooms_list');
      socket.off('room_created');
      socket.off('room_state_update');
      socket.off('game_started');
      socket.off('phase_sync');
      socket.off('timer_tick');
      socket.off('showcase_start');
      socket.off('showcase_album_header');
      socket.off('showcase_step');
      socket.off('showcase_album_done');
      socket.off('showcase_complete');
      socket.off('error_alert');
    };
  }, []);

  // ── Error popup ───────────────────────────────────────────────────────────
  const dismissError = () => useGameStore.getState().setErrorMessage(null);

  // ── Render view ───────────────────────────────────────────────────────────
  let view: React.ReactNode;

  switch (currentView) {
    case 'MAIN_MENU':
      view = <MainMenuView />;
      break;
    case 'LOBBY':
      view = <LobbyView />;
      break;
    case 'GAME':
      if (gamePhase?.expectedInput === 'CANVAS') {
        view = <GameCanvasView />;
      } else {
        view = <GameTextView />;
      }
      break;
    case 'SHOWCASE':
      view = <ShowcaseView />;
      break;
    default:
      view = <MainMenuView />;
  }

  return (
    <div>
      {errorMessage && (
        <div style={{ background: '#fee', border: '1px solid red', padding: 12, margin: 8 }}>
          <strong>⚠️ Error:</strong> {errorMessage}
          <button onClick={dismissError} style={{ marginLeft: 12 }}>✕</button>
        </div>
      )}
      {view}
    </div>
  );
}
