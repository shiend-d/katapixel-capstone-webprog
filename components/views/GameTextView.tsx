'use client';
// View 3: Game Text Input Phase
import { useState } from 'react';
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../lib/gameStore';

export default function GameTextView() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const hasSubmitted = useGameStore((s) => s.hasSubmitted);
  const roomData = useGameStore((s) => s.roomData);
  const [text, setText] = useState('');

  if (!gamePhase || !roomData) return <p>Loading...</p>;

  const isFirstRound = gamePhase.roundNumber === 1;

  function handleSubmit() {
    if (!text.trim()) return alert('Tulis sesuatu dulu!');
    getSocket().emit('submit_turn', {
      roomId: roomData!.roomId,
      type: 'TEXT',
      content: text.trim(),
    });
    useGameStore.getState().setHasSubmitted(true);
  }

  if (hasSubmitted) {
    return (
      <div>
        <h2>⏳ Menunggu pemain lain selesai...</h2>
        <p>Waktu tersisa: {timeLeft} detik</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header>
        <h1>
          ✍️ Ronde {gamePhase.roundNumber}/{gamePhase.totalRounds}
          {' — '}
          <span style={{ color: timeLeft <= 10 ? 'red' : 'inherit', fontSize: 28 }}>
            ⏱ {timeLeft}s
          </span>
        </h1>
      </header>
      <hr />

      {/* Reference Area */}
      <section>
        {isFirstRound ? (
          <div>
            <h2>📝 Tulis Premis Awal</h2>
            <p>Tulis kalimat aneh atau lucu yang harus digambar orang lain!</p>
            {roomData.theme && <p><strong>Tema:</strong> {roomData.theme}</p>}
          </div>
        ) : gamePhase.referenceData ? (
          <div>
            <h2>🔍 Tebak Gambar Ini</h2>
            {gamePhase.referenceData.type === 'IMAGE' ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gamePhase.referenceData.content}
                  alt="Gambar dari pemain sebelumnya"
                  style={{ maxWidth: '100%', maxHeight: 400, border: '1px solid gray' }}
                />
              </div>
            ) : gamePhase.referenceData.type === 'EMPTY_CANVAS' ? (
              <p><em>⬜ Pemain sebelumnya tidak menggambar apa-apa.</em></p>
            ) : (
              <p>Referensi: {gamePhase.referenceData.content}</p>
            )}
          </div>
        ) : (
          <p>Tidak ada referensi.</p>
        )}
      </section>
      <hr />

      {/* Text Input */}
      <section>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isFirstRound
            ? 'Tuliskan premis anehmu di sini... (misal: "Kucing oren meretas server NASA")'
            : 'Apa yang kamu lihat di gambar itu?'
          }
          rows={4}
          style={{ width: '100%', maxWidth: 600, fontSize: 16 }}
          maxLength={200}
        />
        <br />
        <button onClick={handleSubmit} style={{ fontSize: 18, marginTop: 8 }}>
          ✅ Kirim
        </button>
      </section>
    </div>
  );
}
