'use client';
import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Download, Home, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';
import { downloadAlbumAsPng } from '@/lib/downloadAlbum';
import { AVATARS } from '@/lib/types';

export default function ShowcaseView() {
  const showcaseAlbumHeader = useGameStore((s) => s.showcaseAlbumHeader);
  const showcaseEntries = useGameStore((s) => s.showcaseEntries);
  const showcaseAlbumDone = useGameStore((s) => s.showcaseAlbumDone);
  const showcaseComplete = useGameStore((s) => s.showcaseComplete);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const roomData = useGameStore((s) => s.roomData);
  const currentAlbumIndex = useGameStore((s) => s.currentAlbumIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const last = scrollRef.current.lastElementChild;
      if (last) last.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showcaseEntries.length]);

  function handleNextAlbum() {
    getSocket().emit('next_album');
  }

  function handlePreviousAlbum() {
    if (currentAlbumIndex <= 0) return;
    const prevIdx = currentAlbumIndex - 1;
    getSocket().emit('request_album', { albumIndex: prevIdx });
  }

  function handleDownloadAlbum() {
    if (!showcaseAlbumHeader || showcaseEntries.length === 0) return;
    downloadAlbumAsPng(
      showcaseAlbumHeader.ownerName,
      AVATARS[showcaseAlbumHeader.ownerAvatarId],
      showcaseEntries,
    );
  }

  function handleBackToLobby() { useGameStore.getState().resetForLobby(); }

  const players = roomData?.players ?? [];

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          {showcaseComplete ? (
            <button onClick={handleBackToLobby}
              className="gartic-btn flex items-center gap-2 bg-[#ffe066] px-4 py-2 text-sm text-[#4a1f2e]"
              style={{ fontWeight: 700 }}>
              <Home className="h-4 w-4" /> LOBI
            </button>
          ) : (
            <div />
          )}
          <div className="gartic-panel bg-gradient-to-b from-[#ff8a5b] to-[#ff5e5e] px-5 py-1.5">
            <span className="text-white" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
              SHOW<span className="text-[#ffe066]">CASE</span>
            </span>
          </div>
          {showcaseAlbumHeader ? (
            <span className="rounded-lg border-[3px] border-[#4a1f2e] bg-[#fff5e1] px-3 py-1.5 text-sm text-[#9a3556]" style={{ fontWeight: 700 }}>
              ALBUM {showcaseAlbumHeader.albumIndex + 1}/{showcaseAlbumHeader.totalAlbums}
            </span>
          ) : <div />}
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          {/* Player list */}
          <div className="gartic-panel bg-[#fff5e1] p-3">
            <div className="mb-3 inline-block rounded-lg bg-[#ffe066] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
              Pemain
            </div>
            <div className="space-y-2">
              {players.map((p) => {
                const isOwner = showcaseAlbumHeader
                  && p.username === showcaseAlbumHeader.ownerName
                  && p.avatarId === showcaseAlbumHeader.ownerAvatarId;
                return (
                  <div key={p.socketId}
                    className={`flex items-center gap-2 rounded-xl border-[3px] border-[#4a1f2e] p-2 ${isOwner ? 'bg-[#ff8a5b]' : 'bg-[#ffe0b8]'}`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#4a1f2e] bg-[#ffe066] text-base">
                      {AVATARS[p.avatarId]}
                    </div>
                    <span className="text-[#4a1f2e]" style={{ fontWeight: 700 }}>{p.username}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Album content */}
          <div className="gartic-panel bg-[#fff5e1] p-5">
            {/* Album owner header */}
            {showcaseAlbumHeader && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[#4a1f2e]" style={{ fontWeight: 800 }}>
                  {AVATARS[showcaseAlbumHeader.ownerAvatarId]} Album Milik {showcaseAlbumHeader.ownerName}
                </h2>
                <div className="flex gap-2">
                  {/* Download button */}
                  {showcaseAlbumDone && (
                    <button onClick={handleDownloadAlbum}
                      className="gartic-btn flex items-center gap-1.5 bg-[#9a5dff] px-4 py-2 text-sm text-white hover:bg-[#8047d8]"
                      style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
                      <Download className="h-4 w-4" /> UNDUH
                    </button>
                  )}
                  {/* Previous album (anyone can re-view) */}
                  {showcaseAlbumDone && currentAlbumIndex > 0 && (
                    <button onClick={handlePreviousAlbum}
                      className="gartic-btn flex items-center gap-1.5 bg-[#ffa500] px-4 py-2 text-sm text-white hover:bg-[#ff8c00]"
                      style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
                      <ArrowLeft className="h-4 w-4" /> SEBELUMNYA
                    </button>
                  )}
                  {/* Next album (host only, during live flow) */}
                  {myIsHost && showcaseAlbumDone && !showcaseComplete && (
                    <button onClick={handleNextAlbum}
                      className="gartic-btn flex items-center gap-1.5 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-4 py-2 text-sm text-white"
                      style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
                      {showcaseAlbumHeader && currentAlbumIndex === showcaseAlbumHeader.totalAlbums - 1 ? (
                        <>SELESAI & KEMBALI</>
                      ) : (
                        <>BERIKUTNYA <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Waterfall chat entries */}
            <div ref={scrollRef} className="space-y-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {showcaseEntries.length === 0 && (
                <div className="py-8 text-center text-[#9a3556]/60 italic">Menunggu data...</div>
              )}

              {showcaseEntries.map((entry, i) => {
                const isImage = entry.type === 'IMAGE' || entry.type === 'EMPTY_CANVAS';
                const onLeft = isImage;
                return (
                  <div key={i} className={`flex ${onLeft ? 'justify-start' : 'justify-end'}`}>
                    <div className={`flex max-w-[80%] gap-2 ${onLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-[#4a1f2e] bg-[#ffe066] text-lg">
                        {AVATARS[entry.authorAvatarId ?? 0]}
                      </div>
                      {/* Content */}
                      <div className={onLeft ? 'text-left' : 'text-right'}>
                        <div className={`mb-1 flex items-center gap-1.5 ${onLeft ? '' : 'justify-end'}`}>
                          <span className="text-[#4a1f2e]" style={{ fontWeight: 700 }}>{entry.authorName || '?'}</span>
                          <span className="flex items-center gap-1 rounded-md border-2 border-[#4a1f2e] bg-[#a8d8e0] px-1.5 text-xs text-[#4a1f2e]">
                            {entry.type === 'TEXT' || entry.type === 'FALLBACK_TEXT'
                              ? <><MessageSquare className="h-3 w-3" /> TEKS</>
                              : entry.type === 'EMPTY_CANVAS'
                                ? <><ImageIcon className="h-3 w-3" /> KOSONG</>
                                : <><ImageIcon className="h-3 w-3" /> GAMBAR</>
                            }
                          </span>
                        </div>

                        {/* TEXT bubble */}
                        {(entry.type === 'TEXT' || entry.type === 'FALLBACK_TEXT') && (
                          <div className={`inline-block border-[3px] border-[#4a1f2e] px-4 py-2.5 shadow-[0_3px_0_0_#4a1f2e] ${
                            onLeft ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-tr-sm'
                          } ${entry.type === 'FALLBACK_TEXT' ? 'bg-[#ffe0b8] italic text-[#9a3556]' : 'bg-[#ffe066] text-[#4a1f2e]'}`}
                            style={{ fontWeight: 600 }}>
                            {entry.content}
                          </div>
                        )}

                        {/* EMPTY_CANVAS */}
                        {entry.type === 'EMPTY_CANVAS' && (
                          <div className="halftone flex aspect-[16/9] w-[28rem] max-w-full items-center justify-center rounded-xl border-[3px] border-dashed border-[#4a1f2e]/50 bg-[#fff8e1] text-[#4a1f2e]/60 italic">
                            [Tidak ada gambar]
                          </div>
                        )}

                        {/* IMAGE */}
                        {entry.type === 'IMAGE' && (
                          <div className="halftone w-[28rem] max-w-full overflow-hidden rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff8e1] shadow-[0_3px_0_0_#4a1f2e]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={entry.content} alt={`Gambar oleh ${entry.authorName}`}
                              className="w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status messages */}
            {!myIsHost && showcaseAlbumDone && !showcaseComplete && (
              <div className="mt-4 text-center text-sm text-[#9a3556] italic">
                Menunggu Host menekan &quot;Berikutnya&quot;...
              </div>
            )}

            {showcaseComplete && (
              <div className="mt-4 text-center">
                <button onClick={handleBackToLobby}
                  className="gartic-btn flex items-center justify-center gap-2 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-6 py-3 text-white mx-auto"
                  style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
                  <Home className="h-5 w-5" /> KEMBALI KE LOBI
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
