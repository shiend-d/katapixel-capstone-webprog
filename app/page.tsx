'use client';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';
import MainMenuView from '@/components/views/MainMenuView';
import LobbyView from '@/components/views/LobbyView';
import GameTextView from '@/components/views/GameTextView';
import GameCanvasView from '@/components/views/GameCanvasView';
import ShowcaseView from '@/components/views/ShowcaseView';
import MusicPlayer from '@/components/MusicPlayer';
import { X } from 'lucide-react';

export default function Home() {
  const currentView = useGameStore((s) => s.currentView);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const errorMessage = useGameStore((s) => s.errorMessage);

  useEffect(() => {
    const socket = getSocket();
    const store = useGameStore.getState;
    const set = useGameStore.setState;

    socket.on('connect', () => { set({ mySocketId: socket.id || null }); });
    socket.on('public_rooms_list', (rooms) => { store().setPublicRooms(rooms); });
    socket.on('room_created', () => { set({ currentView: 'LOBBY' }); });

    socket.on('room_state_update', (room) => {
      const s = store();
      store().setRoomData(room);
      if (s.currentView === 'MAIN_MENU' && room) set({ currentView: 'LOBBY' });
      if (room?.status === 'LOBBY' && s.currentView === 'SHOWCASE') store().resetForLobby();
    });

    socket.on('game_started', () => {});
    socket.on('phase_sync', (phase) => {
      store().setGamePhase(phase);
      set({ currentView: 'GAME', hasSubmitted: false });
    });
    socket.on('timer_tick', ({ timeLeft }) => { set({ timeLeft }); });

    socket.on('showcase_start', () => {
      set({
        currentView: 'SHOWCASE',
        showcaseEntries: [], showcaseAlbumDone: false,
        showcaseComplete: false, showcaseAlbumHeader: null,
        finishedAlbums: [],
      });
    });

    socket.on('showcase_album_header', (header) => {
      store().setShowcaseAlbumHeader(header);
      set({ showcaseEntries: [], showcaseAlbumDone: false, currentAlbumIndex: header.albumIndex });
    });

    socket.on('showcase_step', (entry) => { store().addShowcaseEntry(entry); });

    socket.on('showcase_album_done', () => {
      store().saveCurrentAlbum();
      set({ showcaseAlbumDone: true });
    });

    socket.on('showcase_complete', () => {
      store().saveCurrentAlbum();
      set({ showcaseComplete: true });
    });

    socket.on('force_auto_submit', () => { set({ timeLeft: 0 }); });

    socket.on('error_alert', ({ message }) => {
      set({ errorMessage: message });
      if (message.includes('dikeluarkan') || message.includes('dibubarkan') || message.includes('Host')) {
        setTimeout(() => { store().resetAll(); }, 2000);
      }
    });

    return () => {
      socket.off('connect'); socket.off('public_rooms_list');
      socket.off('room_created'); socket.off('room_state_update');
      socket.off('game_started'); socket.off('phase_sync');
      socket.off('timer_tick'); socket.off('showcase_start');
      socket.off('showcase_album_header'); socket.off('showcase_step');
      socket.off('showcase_album_done'); socket.off('showcase_complete');
      socket.off('force_auto_submit'); socket.off('error_alert');
    };
  }, []);

  const dismissError = () => useGameStore.getState().setErrorMessage(null);

  let view: React.ReactNode;
  switch (currentView) {
    case 'MAIN_MENU': view = <MainMenuView />; break;
    case 'LOBBY': view = <LobbyView />; break;
    case 'GAME':
      view = gamePhase?.expectedInput === 'CANVAS' ? <GameCanvasView /> : <GameTextView />;
      break;
    case 'SHOWCASE': view = <ShowcaseView />; break;
    default: view = <MainMenuView />;
  }

  return (
    <div className="relative">
      {errorMessage && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
          <div className="gartic-btn flex items-center gap-3 bg-[#ff5e5e] px-5 py-3 text-white"
               style={{ fontWeight: 700, textShadow: '1px 1px 0 #4a1f2e' }}>
            <span>⚠️ {errorMessage}</span>
            <button onClick={dismissError} className="rounded-lg bg-[#4a1f2e]/30 p-1 hover:bg-[#4a1f2e]/50">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {view}
      <MusicPlayer />
    </div>
  );
}
