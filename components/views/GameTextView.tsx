'use client';
import { useState, useEffect, useRef } from 'react';
import { Timer, Check } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';

export default function GameTextView() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const hasSubmitted = useGameStore((s) => s.hasSubmitted);
  const roomData = useGameStore((s) => s.roomData);
  const [text, setText] = useState('');
  const textRef = useRef(''); // ref to avoid stale closure in auto-submit

  // Keep ref in sync with state
  useEffect(() => { textRef.current = text; }, [text]);

  // Auto-submit saat timer habis — gunakan store & ref langsung
  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted && gamePhase?.expectedInput === 'TEXT_FORM') {
      const timer = setTimeout(() => {
        const rd = useGameStore.getState().roomData;
        if (!rd) return;
        if (useGameStore.getState().hasSubmitted) return;
        const content = textRef.current.trim() || '[Tidak Ada Tebakan]';
        getSocket().emit('submit_turn', { roomId: rd.roomId, type: 'TEXT', content });
        useGameStore.getState().setHasSubmitted(true);
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasSubmitted, gamePhase]);

  if (!gamePhase || !roomData) return <div className="flex min-h-screen items-center justify-center"><p className="text-[#4a1f2e]">Loading...</p></div>;

  const isFirstRound = gamePhase.roundNumber === 1;

  function handleSubmit() {
    if (!text.trim()) return alert('Tulis sesuatu dulu!');
    getSocket().emit('submit_turn', { roomId: roomData!.roomId, type: 'TEXT', content: text.trim() });
    useGameStore.getState().setHasSubmitted(true);
  }

  if (hasSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="gartic-panel bg-[#fff5e1] p-8 text-center">
          <div className="mb-3 text-4xl">⏳</div>
          <h2 className="text-xl text-[#4a1f2e]" style={{ fontWeight: 800 }}>Menunggu pemain lain...</h2>
          <div className="gartic-btn mt-4 inline-flex items-center gap-2 bg-[#ffe066] px-4 py-2 text-[#4a1f2e]" style={{ fontWeight: 800 }}>
            <Timer className="h-4 w-4" />
            <span style={{ fontSize: '1.25rem' }}>{timeLeft}s</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="gartic-btn bg-[#ffe066] px-4 py-2 text-[#4a1f2e]" style={{ fontWeight: 800 }}>
            {gamePhase.roundNumber}/{gamePhase.totalRounds}
          </div>
          <div className="gartic-panel bg-gradient-to-b from-[#ff8a5b] to-[#ff5e5e] px-5 py-1.5">
            <span className="text-white" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
              KATA<span className="text-[#ffe066]">PIXEL</span>
            </span>
          </div>
          <div className={`gartic-btn flex items-center gap-2 px-4 py-2 ${timeLeft <= 10 ? 'bg-[#ff5e5e] text-white' : 'bg-[#ffe066] text-[#4a1f2e]'}`}
            style={{ fontWeight: 800 }}>
            <Timer className="h-4 w-4" />
            <span style={{ fontSize: '1.25rem' }}>{timeLeft}s</span>
          </div>
        </div>

        {/* Prompt banner */}
        <div className="gartic-panel mb-4 bg-gradient-to-b from-[#d63384] to-[#9a2553] p-3 text-center">
          <div className="text-white uppercase" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
            {isFirstRound ? 'Tulis kalimat yang berhubungan dengan tema!' : 'Apa yang kamu lihat di gambar ini?'}
          </div>
        </div>

        {/* Reference Area */}
        {isFirstRound && roomData.theme && (
          <div className="gartic-panel mb-4 bg-[#fff5e1] p-4 text-center">
            <span className="text-sm text-[#9a3556]">Tema: </span>
            <span className="text-[#4a1f2e]" style={{ fontWeight: 700 }}>{roomData.theme}</span>
          </div>
        )}

        {!isFirstRound && gamePhase.referenceData && (
          <div className="gartic-panel mb-4 bg-white p-3">
            {gamePhase.referenceData.type === 'IMAGE' ? (
              <div className="flex items-center justify-center rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff8e1] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gamePhase.referenceData.content} alt="Gambar dari pemain sebelumnya"
                  className="max-h-[400px] max-w-full rounded-lg" />
              </div>
            ) : gamePhase.referenceData.type === 'EMPTY_CANVAS' ? (
              <div className="halftone flex aspect-[16/9] items-center justify-center rounded-xl border-[3px] border-dashed border-[#4a1f2e]/50 bg-[#fff8e1] text-[#4a1f2e]/60 italic">
                [Tidak ada gambar]
              </div>
            ) : null}
          </div>
        )}

        {/* Input */}
        <div className="gartic-panel bg-[#fff5e1] p-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="gartic-btn mb-3 w-full bg-white px-4 py-3 text-[#4a1f2e] outline-none"
            placeholder={isFirstRound ? 'Tulis kalimat disini...' : 'Ketik tebakanmu di sini...'}
            maxLength={200}
          />
          <button onClick={handleSubmit}
            className="gartic-btn flex w-full items-center justify-center gap-2 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] py-3 text-white"
            style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e', letterSpacing: '0.1em' }}>
            <Check className="h-5 w-5" /> DONE!
          </button>
        </div>
      </div>
    </div>
  );
}
