'use client';
// View 2: Lobby / Waiting Room
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../lib/gameStore';
import { AVATARS } from '../../lib/types';

export default function LobbyView() {
  const roomData = useGameStore((s) => s.roomData);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const mySocketId = useGameStore((s) => s.mySocketId);

  if (!roomData) return <p>Loading...</p>;

  function copyRoomCode() {
    navigator.clipboard.writeText(roomData!.roomId);
    alert('Kode ruangan disalin!');
  }

  function handleKick(targetSocketId: string) {
    if (!confirm('Yakin ingin mengeluarkan pemain ini?')) return;
    getSocket().emit('kick_player', { targetSocketId });
  }

  function handleUpdateSetting(key: string, value: unknown) {
    getSocket().emit('update_room_settings', { [key]: value });
  }

  function handleStart() {
    getSocket().emit('force_start');
  }

  function handleDisband() {
    if (!confirm('Yakin ingin membubarkan ruangan?')) return;
    getSocket().emit('leave_room');
    useGameStore.getState().resetAll();
  }

  function handleLeave() {
    getSocket().emit('leave_room');
    useGameStore.getState().resetAll();
  }

  return (
    <div>
      <h1>🪑 Lobi Ruangan</h1>

      {/* Room Code */}
      <section>
        <h2>
          Kode Ruangan: <code style={{ fontSize: 24 }}>{roomData.roomId}</code>
          <button onClick={copyRoomCode} style={{ marginLeft: 8 }}>📋 Salin</button>
        </h2>
        <p>{roomData.isPrivate ? '🔒 Privat' : '🌐 Publik'}</p>
      </section>
      <hr />

      {/* Player Roster */}
      <section>
        <h2>Pemain ({roomData.players.length}/{roomData.maxPlayers})</h2>
        <ul>
          {roomData.players.map((player) => (
            <li key={player.socketId}>
              {AVATARS[player.avatarId]} {player.username}
              {player.isHost && ' 👑 Host'}
              {player.socketId === mySocketId && ' (Kamu)'}
              {myIsHost && !player.isHost && (
                <button onClick={() => handleKick(player.socketId)} style={{ marginLeft: 8 }}>
                  ❌ Kick
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <hr />

      {/* Settings */}
      <section>
        <h2>Pengaturan</h2>
        <div>
          <label>Maks. Pemain: </label>
          {myIsHost ? (
            <select
              value={roomData.maxPlayers}
              onChange={(e) => handleUpdateSetting('maxPlayers', Number(e.target.value))}
            >
              {[4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          ) : (
            <span>{roomData.maxPlayers}</span>
          )}
        </div>
        <div>
          <label>Visibilitas: </label>
          {myIsHost ? (
            <select
              value={roomData.isPrivate ? 'private' : 'public'}
              onChange={(e) => handleUpdateSetting('isPrivate', e.target.value === 'private')}
            >
              <option value="public">Publik</option>
              <option value="private">Privat</option>
            </select>
          ) : (
            <span>{roomData.isPrivate ? 'Privat' : 'Publik'}</span>
          )}
        </div>
        <div>
          <label>Waktu Menggambar: </label>
          {myIsHost ? (
            <select
              value={roomData.drawTime}
              onChange={(e) => handleUpdateSetting('drawTime', Number(e.target.value))}
            >
              <option value={60}>60 detik</option>
              <option value={90}>90 detik</option>
              <option value={120}>120 detik</option>
            </select>
          ) : (
            <span>{roomData.drawTime} detik</span>
          )}
        </div>
        <div>
          <label>Waktu Menebak: </label>
          {myIsHost ? (
            <select
              value={roomData.guessTime}
              onChange={(e) => handleUpdateSetting('guessTime', Number(e.target.value))}
            >
              <option value={30}>30 detik</option>
              <option value={45}>45 detik</option>
              <option value={60}>60 detik</option>
            </select>
          ) : (
            <span>{roomData.guessTime} detik</span>
          )}
        </div>
        <div>
          <label>Tema: </label>
          {myIsHost ? (
            <input
              type="text"
              value={roomData.theme}
              onChange={(e) => handleUpdateSetting('theme', e.target.value)}
              placeholder="Opsional: tema hari ini..."
            />
          ) : (
            <span>{roomData.theme || '(tidak ada)'}</span>
          )}
        </div>
      </section>
      <hr />

      {/* Controls */}
      <section>
        {myIsHost && (
          <div>
            <button
              onClick={handleStart}
              disabled={roomData.players.length < 4}
            >
              🚀 Mulai Permainan {roomData.players.length < 4 && `(min. 4 pemain, sekarang ${roomData.players.length})`}
            </button>
            <button onClick={handleDisband} style={{ marginLeft: 8 }}>
              💣 Bubar Ruangan
            </button>
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <button onClick={handleLeave}>🚪 Keluar dari Ruangan</button>
        </div>
      </section>
    </div>
  );
}
