'use client';
import { useState } from 'react';
import { Plus, KeyRound, Crown, Play } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';
import { AVATARS } from '@/lib/types';

export default function MainMenuView() {
  const [username, setUsername] = useState(useGameStore.getState().myUsername || '');
  const [selectedAvatar, setSelectedAvatar] = useState<number>(useGameStore.getState().myAvatarId);
  const [roomCode, setRoomCode] = useState('');
  const publicRooms = useGameStore((s) => s.publicRooms);

  const canProceed = username.trim().length > 0;

  function saveProfile() {
    useGameStore.getState().setMyUsername(username.trim());
    useGameStore.getState().setMyAvatarId(selectedAvatar);
  }

  function handleCreateRoom() {
    if (!canProceed) return alert('Masukkan nama dulu!');
    saveProfile();
    getSocket().emit('create_room', {
      maxPlayers: 8, isPrivate: false, theme: '', drawTime: 90, guessTime: 45,
      username: username.trim(), avatarId: selectedAvatar,
    });
  }

  function handleJoinWithCode() {
    if (!canProceed) return alert('Masukkan nama dulu!');
    if (!roomCode.trim()) return alert('Masukkan kode ruangan!');
    saveProfile();
    getSocket().emit('join_room', {
      roomId: roomCode.trim().toUpperCase(),
      username: username.trim(), avatarId: selectedAvatar,
    });
  }

  function handleJoinPublic(roomId: string) {
    if (!canProceed) return alert('Masukkan nama dulu!');
    saveProfile();
    getSocket().emit('join_room', { roomId, username: username.trim(), avatarId: selectedAvatar });
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col items-center">
            <div className="gartic-panel mb-2 bg-gradient-to-b from-[#ff8a5b] to-[#ff5e5e] px-8 py-3">
              <h1 className="text-white" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.05em', textShadow: '2px 2px 0 #4a1f2e' }}>
                KATA<span className="text-[#9a3556]">PIXEL</span>
              </h1>
            </div>
            <span className="rounded-full bg-[#4a1f2e] px-4 py-1 text-xs uppercase tracking-widest text-[#9a3556]">
              The Pesan Berantai Game
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Profile Panel */}
          <div className="gartic-panel halftone-light bg-[#fff5e1] p-6 md:col-span-2">
            <div className="mb-4 inline-block rounded-lg bg-[#ffe066] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
              Profil Kamu
            </div>
            <label className="mb-1 block text-sm text-[#9a3556]">Nama Panggilan</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="gartic-btn mb-5 w-full bg-white px-4 py-2.5 text-[#4a1f2e] outline-none"
              placeholder="Masukkan nama..."
              maxLength={20}
            />
            <label className="mb-2 block text-sm text-[#9a3556]">Pilih Karakter</label>
            <div className="grid grid-cols-5 gap-2">
              {AVATARS.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={`aspect-square rounded-xl border-[3px] text-2xl transition hover:scale-110 ${
                    selectedAvatar === i
                      ? 'border-[#ffe066] bg-[#ff8a5b] shadow-[0_3px_0_0_#4a1f2e]'
                      : 'border-[#4a1f2e] bg-[#ffe0b8]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4 md:col-span-3">
            {/* Create / Join */}
            <div className="gartic-panel bg-[#fff5e1] p-6">
              <div className="mb-4 inline-block rounded-lg bg-[#2ec4b6] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
                Mulai Bermain
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!canProceed}
                className="gartic-btn mb-3 flex w-full items-center justify-center gap-2 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-5 py-3.5 text-white"
                style={{ fontWeight: 700, textShadow: '1px 1px 0 #4a1f2e' }}
              >
                <Plus className="h-5 w-5" /> BUAT RUANGAN BARU
              </button>
              <div className="flex gap-2">
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="gartic-btn flex-1 bg-white px-4 py-3 text-[#4a1f2e] outline-none"
                  placeholder="Kode Ruangan (ABC123)"
                  maxLength={6}
                />
                <button
                  onClick={handleJoinWithCode}
                  disabled={!canProceed}
                  className="gartic-btn flex items-center gap-2 bg-[#ffe066] px-5 py-3 text-[#4a1f2e]"
                  style={{ fontWeight: 700 }}
                >
                  <KeyRound className="h-4 w-4" /> GABUNG
                </button>
              </div>
            </div>

            {/* Public Rooms */}
            <div className="gartic-panel bg-[#fff5e1] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-block rounded-lg bg-[#ff8a5b] px-3 py-1 text-xs uppercase tracking-wider text-[#4a1f2e]" style={{ fontWeight: 700 }}>
                  Ruangan Publik
                </div>
                <span className="rounded-full border-2 border-[#4a1f2e] bg-[#ffe066] px-2.5 py-0.5 text-xs text-[#4a1f2e]" style={{ fontWeight: 700 }}>
                  {publicRooms.length} AKTIF
                </span>
              </div>

              {publicRooms.length === 0 ? (
                <div className="rounded-xl border-[3px] border-dashed border-[#4a1f2e]/40 p-6 text-center text-sm text-[#9a3556]/60">
                  Belum ada ruangan publik tersedia...
                </div>
              ) : (
                <div className="space-y-2">
                  {publicRooms.map((room) => (
                    <div key={room.roomId} className="flex items-center gap-3 rounded-xl border-[3px] border-[#4a1f2e] bg-[#ffe0b8] p-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#4a1f2e] bg-[#ffe066] text-xl">
                        {AVATARS[room.hostAvatarId]}
                      </div>
                      <div className="flex-1 text-[#4a1f2e]">
                        <div className="flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5 text-[#9a3556]" />
                          <span style={{ fontWeight: 700 }}>{room.hostName}</span>
                          <span className="rounded-md border-2 border-[#4a1f2e] bg-[#ffe066] px-1.5 text-xs text-[#4a1f2e]">
                            {room.playerCount}/{room.maxPlayers}
                          </span>
                        </div>
                        <div className="text-sm text-[#8a4456]">Tema: {room.theme || 'Bebas'}</div>
                      </div>
                      <button
                        onClick={() => handleJoinPublic(room.roomId)}
                        disabled={!canProceed}
                        className="gartic-btn flex items-center gap-1 bg-[#7bd389] px-4 py-2 text-sm text-[#4a1f2e]"
                        style={{ fontWeight: 700 }}
                      >
                        <Play className="h-3.5 w-3.5" /> GABUNG
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
