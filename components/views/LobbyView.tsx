'use client';
import { useState } from 'react';
import { Copy, Crown, Globe, Lock, X, Play, Trash2, ArrowLeft } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';
import { AVATARS } from '@/lib/types';

export default function LobbyView() {
  const roomData = useGameStore((s) => s.roomData);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const mySocketId = useGameStore((s) => s.mySocketId);
  const [copied, setCopied] = useState(false);

  if (!roomData) return <div className="flex min-h-screen items-center justify-center"><p className="text-[#4a1f2e]">Loading...</p></div>;

  function copyRoomCode() {
    navigator.clipboard.writeText(roomData!.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleKick(targetSocketId: string) {
    getSocket().emit('kick_player', { targetSocketId });
  }

  function handleUpdateSetting(key: string, value: unknown) {
    getSocket().emit('update_room_settings', { [key]: value });
  }

  function handleStart() { getSocket().emit('force_start'); }

  function handleDisband() {
    if (!confirm('Yakin ingin membubarkan ruangan?')) return;
    getSocket().emit('leave_room');
    useGameStore.getState().resetAll();
  }

  function handleLeave() {
    getSocket().emit('leave_room');
    useGameStore.getState().resetAll();
  }

  const emptySlots = Math.max(0, roomData.maxPlayers - roomData.players.length);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          <button onClick={handleLeave}
            className="gartic-btn flex items-center gap-2 bg-[#ffe066] px-4 py-2 text-sm text-[#4a1f2e]"
            style={{ fontWeight: 700 }}>
            <ArrowLeft className="h-4 w-4" /> KELUAR
          </button>
          <div className="gartic-panel bg-gradient-to-b from-[#ff8a5b] to-[#ff5e5e] px-6 py-2">
            <span className="text-white" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
              KATA<span className="text-[#9a3556]">PIXEL</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff5e1] px-4 py-2">
            <span className="text-xs uppercase text-[#9a3556]">Kode</span>
            <span style={{ fontWeight: 800, letterSpacing: '0.15em' }} className="text-[#9a3556]">{roomData.roomId}</span>
            <button onClick={copyRoomCode} className="rounded bg-[#2ec4b6] p-1 text-[#4a1f2e]">
              <Copy className="h-3.5 w-3.5" />
            </button>
            {copied && <span className="text-xs text-[#7bd389]">✓</span>}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Player Roster */}
          <div className="gartic-panel bg-[#fff5e1] p-5">
            <div className="mb-4 inline-block rounded-lg bg-[#ffe066] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
              Pemain {roomData.players.length}/{roomData.maxPlayers}
            </div>
            <div className="space-y-2">
              {roomData.players.map((player) => (
                <div key={player.socketId} className="flex items-center gap-3 rounded-xl border-[3px] border-[#4a1f2e] bg-[#ffe0b8] p-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#4a1f2e] bg-[#ffe066] text-xl">
                    {AVATARS[player.avatarId]}
                  </div>
                  <div className="flex-1 text-[#4a1f2e]">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontWeight: 700 }}>{player.username}</span>
                      {player.isHost && <Crown className="h-3.5 w-3.5 text-[#9a3556]" />}
                      {player.socketId === mySocketId && (
                        <span className="rounded-md border-2 border-[#4a1f2e] bg-[#7bd389] px-1.5 text-xs text-[#4a1f2e]">KAMU</span>
                      )}
                    </div>
                  </div>
                  {myIsHost && !player.isHost && (
                    <button onClick={() => handleKick(player.socketId)}
                      className="rounded-lg border-2 border-[#4a1f2e] bg-[#ff5e5e] p-1.5 text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border-[3px] border-dashed border-[#4a1f2e]/40 p-2.5 text-[#9a3556]/40">
                  <div className="h-10 w-10 rounded-full bg-[#ffe0b8]/50" />
                  <span className="text-sm uppercase tracking-wide">Kosong</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="gartic-panel bg-[#fff5e1] p-5 lg:col-span-2">
            <div className="mb-4 inline-block rounded-lg bg-[#2ec4b6] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
              Pengaturan
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {/* Max Players */}
              <div>
                <label className="mb-1.5 block text-sm text-[#9a3556]">Maks. Pemain</label>
                {myIsHost ? (
                  <select value={roomData.maxPlayers} onChange={(e) => handleUpdateSetting('maxPlayers', Number(e.target.value))}
                    className="gartic-btn w-full bg-white px-3 py-2 text-[#4a1f2e]">
                    {[4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n} Pemain</option>)}
                  </select>
                ) : (
                  <div className="gartic-btn bg-white/50 px-3 py-2 text-[#4a1f2e]">{roomData.maxPlayers} Pemain</div>
                )}
              </div>
              {/* Visibility */}
              <div>
                <label className="mb-1.5 block text-sm text-[#9a3556]">Visibilitas</label>
                {myIsHost ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateSetting('isPrivate', false)}
                      className={`gartic-btn flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm ${!roomData.isPrivate ? 'bg-[#7bd389] text-[#4a1f2e]' : 'bg-white text-[#4a1f2e]'}`}
                      style={{ fontWeight: 700 }}>
                      <Globe className="h-3.5 w-3.5" /> PUBLIK
                    </button>
                    <button onClick={() => handleUpdateSetting('isPrivate', true)}
                      className={`gartic-btn flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm ${roomData.isPrivate ? 'bg-[#7bd389] text-[#4a1f2e]' : 'bg-white text-[#4a1f2e]'}`}
                      style={{ fontWeight: 700 }}>
                      <Lock className="h-3.5 w-3.5" /> PRIVAT
                    </button>
                  </div>
                ) : (
                  <div className="gartic-btn bg-white/50 px-3 py-2 text-[#4a1f2e]">{roomData.isPrivate ? '🔒 Privat' : '🌐 Publik'}</div>
                )}
              </div>
              {/* Draw Time */}
              <div>
                <label className="mb-1.5 block text-sm text-[#9a3556]">Waktu Menggambar</label>
                {myIsHost ? (
                  <select value={roomData.drawTime} onChange={(e) => handleUpdateSetting('drawTime', Number(e.target.value))}
                    className="gartic-btn w-full bg-white px-3 py-2 text-[#4a1f2e]">
                    <option value={60}>60 detik</option>
                    <option value={90}>90 detik</option>
                    <option value={120}>120 detik</option>
                  </select>
                ) : (
                  <div className="gartic-btn bg-white/50 px-3 py-2 text-[#4a1f2e]">{roomData.drawTime} detik</div>
                )}
              </div>
              {/* Guess Time */}
              <div>
                <label className="mb-1.5 block text-sm text-[#9a3556]">Waktu Menebak</label>
                {myIsHost ? (
                  <select value={roomData.guessTime} onChange={(e) => handleUpdateSetting('guessTime', Number(e.target.value))}
                    className="gartic-btn w-full bg-white px-3 py-2 text-[#4a1f2e]">
                    <option value={30}>30 detik</option>
                    <option value={45}>45 detik</option>
                    <option value={60}>60 detik</option>
                  </select>
                ) : (
                  <div className="gartic-btn bg-white/50 px-3 py-2 text-[#4a1f2e]">{roomData.guessTime} detik</div>
                )}
              </div>
              {/* Theme */}
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm text-[#9a3556]">Tema</label>
                {myIsHost ? (
                  <input value={roomData.theme} onChange={(e) => handleUpdateSetting('theme', e.target.value)}
                    className="gartic-btn w-full bg-white px-3 py-2 text-[#4a1f2e] outline-none"
                    placeholder="Contoh: Makanan" />
                ) : (
                  <div className="gartic-btn bg-white/50 px-3 py-2 text-[#4a1f2e]">{roomData.theme || '(tidak ada)'}</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {myIsHost && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <button onClick={handleStart} disabled={roomData.players.length < 4}
                  className="gartic-btn flex items-center justify-center gap-2 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] py-3.5 text-white"
                  style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e', letterSpacing: '0.05em' }}>
                  <Play className="h-5 w-5" />
                  {roomData.players.length < 4 ? `MULAI (min. 4, ada ${roomData.players.length})` : 'MULAI PERMAINAN'}
                </button>
                <button onClick={handleDisband}
                  className="gartic-btn flex items-center justify-center gap-2 bg-[#ff5e5e] py-3.5 text-white"
                  style={{ fontWeight: 700, textShadow: '1px 1px 0 #4a1f2e' }}>
                  <Trash2 className="h-4 w-4" /> BUBARKAN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
