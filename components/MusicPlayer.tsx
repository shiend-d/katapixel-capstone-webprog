'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/lib/gameStore';

const MUSIC_TRACKS = {
  MAIN_MENU: '/audio/menu.mp3',
  LOBBY: '/audio/menu.mp3',
  GAME: '/audio/game.mp3',
  SHOWCASE: '/audio/showcase.mp3',
};

export default function MusicPlayer() {
  const currentView = useGameStore((s) => s.currentView);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSrc, setCurrentSrc] = useState(MUSIC_TRACKS.MAIN_MENU);

  useEffect(() => {
    // Inisialisasi audio hanya di client side
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_TRACKS.MAIN_MENU);
      audioRef.current.loop = true;
      audioRef.current.muted = false; // Coba play tanpa mute untuk persiapan autoplay
    }

    // Fungsi untuk memutar musik pada interaksi pertama
    const handleFirstInteraction = () => {
      if (audioRef.current && isMuted) {
        audioRef.current.muted = false;
        audioRef.current.play().then(() => {
          setIsMuted(false);
          // Hapus event listener setelah berhasil play
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        }).catch(err => console.warn('Autoplay blocked:', err));
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;

    // Tentukan track berdasarkan halaman saat ini
    let targetSrc = MUSIC_TRACKS.MAIN_MENU;
    if (currentView === 'LOBBY') targetSrc = MUSIC_TRACKS.LOBBY;
    else if (currentView === 'GAME') targetSrc = MUSIC_TRACKS.GAME;
    else if (currentView === 'SHOWCASE') targetSrc = MUSIC_TRACKS.SHOWCASE;

    // Hanya ganti lagu jika URL-nya berbeda dengan yang sedang main
    if (currentSrc !== targetSrc) {
      setCurrentSrc(targetSrc);
      audioRef.current.src = targetSrc;

      if (!isMuted) {
        audioRef.current.play().catch(err => console.warn('Audio play failed:', err));
      }
    }
  }, [currentView, currentSrc, isMuted]);

  function toggleMute() {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(err => console.warn('Audio play failed:', err));
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      audioRef.current.pause();
      setIsMuted(true);
    }
  }

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#4a1f2e] bg-[#ffe066] text-[#4a1f2e] shadow-[0_4px_0_0_#4a1f2e] transition hover:scale-110 active:translate-y-1 active:shadow-[0_1px_0_0_#4a1f2e]"
      title={isMuted ? 'Nyalakan Lagu' : 'Matikan Lagu'}
    >
      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
    </button>
  );
}
