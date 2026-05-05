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
  const [volume, setVolume] = useState(0.3);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    // Inisialisasi audio hanya di client side
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_TRACKS.MAIN_MENU);
      audioRef.current.loop = true;
      audioRef.current.muted = false;
      audioRef.current.volume = volume;
    }

    // Fungsi untuk memutar musik pada interaksi pertama
    const handleFirstInteraction = () => {
      if (hasInteractedRef.current) return;
      hasInteractedRef.current = true;

      // Hapus event listener segera
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);

      if (audioRef.current && isMuted) {
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
        audioRef.current.play().then(() => {
          setIsMuted(false);
        }).catch(err => console.warn('Autoplay blocked:', err));
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isMuted, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current) return;

    let targetSrc = MUSIC_TRACKS.MAIN_MENU;
    if (currentView === 'LOBBY') targetSrc = MUSIC_TRACKS.LOBBY;
    else if (currentView === 'GAME') targetSrc = MUSIC_TRACKS.GAME;
    else if (currentView === 'SHOWCASE') targetSrc = MUSIC_TRACKS.SHOWCASE;

    if (currentSrc !== targetSrc) {
      setCurrentSrc(targetSrc);
      audioRef.current.src = targetSrc;
      audioRef.current.volume = volume;

      if (!isMuted) {
        audioRef.current.play().catch(err => console.warn('Audio play failed:', err));
      }
    }
  }, [currentView, currentSrc, isMuted, volume]);

  function toggleMute() {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(err => console.warn('Audio play failed:', err));
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      audioRef.current.pause();
      setIsMuted(true);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 group">
      <button
        onClick={toggleMute}
        className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#4a1f2e] bg-[#ffe066] text-[#4a1f2e] shadow-[0_4px_0_0_#4a1f2e] transition hover:scale-110 active:translate-y-1 active:shadow-[0_1px_0_0_#4a1f2e]"
        title={isMuted ? 'Nyalakan Lagu' : 'Matikan Lagu'}
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </button>

      {/* Volume Slider - Muncul saat hover di area player */}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
        <div className="gartic-panel bg-[#fff5e1] px-4 py-2 flex items-center gap-3" style={{ boxShadow: '0 4px 0 0 #4a1f2e' }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-2 accent-[#9a3556] cursor-pointer"
          />
          <span className="text-[10px] font-bold text-[#4a1f2e] w-6 uppercase">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
