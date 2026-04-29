'use client';
// View 5: Showcase / Reveal (Waterfall Chat)
import { useEffect, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../lib/gameStore';
import { AVATARS } from '../../lib/types';

export default function ShowcaseView() {
  const showcaseAlbumHeader = useGameStore((s) => s.showcaseAlbumHeader);
  const showcaseEntries = useGameStore((s) => s.showcaseEntries);
  const showcaseAlbumDone = useGameStore((s) => s.showcaseAlbumDone);
  const showcaseComplete = useGameStore((s) => s.showcaseComplete);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entry
  useEffect(() => {
    if (scrollRef.current) {
      const last = scrollRef.current.lastElementChild;
      if (last) last.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showcaseEntries.length]);

  function handleNextAlbum() {
    getSocket().emit('next_album');
  }

  function handleBackToLobby() {
    useGameStore.getState().resetForLobby();
  }

  return (
    <div>
      <h1>🎭 Showcase</h1>

      {/* Album Header */}
      {showcaseAlbumHeader && (
        <h2>
          Album Milik: {AVATARS[showcaseAlbumHeader.ownerAvatarId]} {showcaseAlbumHeader.ownerName}
          {' '}({showcaseAlbumHeader.albumIndex + 1}/{showcaseAlbumHeader.totalAlbums})
        </h2>
      )}
      <hr />

      {/* Waterfall Chat */}
      <div
        ref={scrollRef}
        style={{ maxHeight: 500, overflowY: 'auto', border: '1px solid gray', padding: 8 }}
      >
        {showcaseEntries.length === 0 && <p><em>Menunggu data...</em></p>}

        {showcaseEntries.map((entry, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #ddd' }}>
            <small>
              {AVATARS[entry.authorAvatarId ?? 0]} <strong>{entry.authorName || '?'}</strong>
              {' — '}
              {entry.type === 'IMAGE' || entry.type === 'EMPTY_CANVAS' ? '🎨 Gambar' : '💬 Teks'}
            </small>

            {entry.type === 'TEXT' || entry.type === 'FALLBACK_TEXT' ? (
              <div style={{
                background: '#f0f0f0',
                padding: 10,
                borderRadius: 8,
                marginTop: 4,
                display: 'inline-block',
              }}>
                {entry.type === 'FALLBACK_TEXT'
                  ? <em style={{ color: 'gray' }}>{entry.content}</em>
                  : entry.content
                }
              </div>
            ) : entry.type === 'IMAGE' ? (
              <div style={{ marginTop: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.content}
                  alt={`Gambar oleh ${entry.authorName}`}
                  style={{ maxWidth: '100%', maxHeight: 300, border: '1px solid gray' }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                <em style={{ color: 'gray' }}>⬜ [Tidak ada gambar]</em>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 12 }}>
        {myIsHost && showcaseAlbumDone && !showcaseComplete && (
          <button onClick={handleNextAlbum} style={{ fontSize: 16 }}>
            ➡️ Album Selanjutnya
          </button>
        )}

        {showcaseComplete && (
          <button onClick={handleBackToLobby} style={{ fontSize: 16 }}>
            🏠 Kembali ke Lobi
          </button>
        )}

        {!myIsHost && showcaseAlbumDone && !showcaseComplete && (
          <p><em>Menunggu Host menekan &quot;Album Selanjutnya&quot;...</em></p>
        )}
      </div>
    </div>
  );
}
