'use client';
// View 1: Main Menu / Landing
import { useState } from 'react';
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../lib/gameStore';
import { AVATARS } from '../../lib/types';

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
    const socket = getSocket();
    socket.emit('create_room', {
      maxPlayers: 8,
      isPrivate: false,
      theme: '',
      drawTime: 90,
      guessTime: 45,
      username: username.trim(),
      avatarId: selectedAvatar,
    });
  }

  function handleJoinWithCode() {
    if (!canProceed) return alert('Masukkan nama dulu!');
    if (!roomCode.trim()) return alert('Masukkan kode ruangan!');
    saveProfile();
    const socket = getSocket();
    socket.emit('join_room', {
      roomId: roomCode.trim().toUpperCase(),
      username: username.trim(),
      avatarId: selectedAvatar,
    });
  }

  function handleJoinPublic(roomId: string) {
    if (!canProceed) return alert('Masukkan nama dulu!');
    saveProfile();
    const socket = getSocket();
    socket.emit('join_room', {
      roomId,
      username: username.trim(),
      avatarId: selectedAvatar,
    });
  }

  return (
    <div>
      <h1>🎨 Katapixel</h1>
      <p>Permainan pesan berantai digital dengan gambar!</p>
      <hr />

      {/* Profil */}
      <section>
        <h2>Profil Kamu</h2>
        <div>
          <label htmlFor="username">Nama Panggilan: </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan nama..."
            maxLength={20}
          />
        </div>
        <div>
          <p>Pilih Avatar:</p>
          {AVATARS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setSelectedAvatar(i)}
              style={{
                fontSize: 28,
                border: selectedAvatar === i ? '3px solid blue' : '1px solid gray',
                margin: 2,
                cursor: 'pointer',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>
      <hr />

      {/* Aksi */}
      <section>
        <h2>Mulai Bermain</h2>
        <div>
          <button onClick={handleCreateRoom} disabled={!canProceed}>
            🏠 Buat Ruangan Baru
          </button>
        </div>
        <br />
        <div>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Kode Ruangan (misal: ABC123)"
            maxLength={6}
          />
          <button onClick={handleJoinWithCode} disabled={!canProceed}>
            🔑 Gabung dengan Kode
          </button>
        </div>
      </section>
      <hr />

      {/* Daftar Room Publik */}
      <section>
        <h2>Ruangan Publik ({publicRooms.length})</h2>
        {publicRooms.length === 0 ? (
          <p><em>Belum ada ruangan publik tersedia.</em></p>
        ) : (
          <table border={1} cellPadding={8}>
            <thead>
              <tr>
                <th>Host</th>
                <th>Pemain</th>
                <th>Tema</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {publicRooms.map((room) => (
                <tr key={room.roomId}>
                  <td>{AVATARS[room.hostAvatarId]} {room.hostName}</td>
                  <td>{room.playerCount}/{room.maxPlayers}</td>
                  <td>{room.theme || '-'}</td>
                  <td>
                    <button onClick={() => handleJoinPublic(room.roomId)} disabled={!canProceed}>
                      Gabung
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
