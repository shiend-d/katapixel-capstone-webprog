// server.mjs — Custom Server: Next.js + Socket.io
import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// ─── In-Memory State ────────────────────────────────────────────────────────
const rooms = new Map();

// ─── Helpers ────────────────────────────────────────────────────────────────
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPublicRoomList() {
  const list = [];
  for (const [, room] of rooms) {
    if (!room.isPrivate && room.status === 'LOBBY' && room.players.length < room.maxPlayers) {
      list.push({
        roomId: room.roomId,
        hostName: room.players.find((p) => p.isHost)?.username || '?',
        hostAvatarId: room.players.find((p) => p.isHost)?.avatarId || 0,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        theme: room.theme,
      });
    }
  }
  return list;
}

function broadcastPublicRooms(io) {
  io.emit('public_rooms_list', getPublicRoomList());
}

function sanitizeRoom(room) {
  if (!room) return null;
  return {
    roomId: room.roomId,
    status: room.status,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    drawTime: room.drawTime,
    guessTime: room.guessTime,
    theme: room.theme,
    players: room.players,
    currentRound: room.currentRound,
  };
}

function destroyRoom(io, roomId, reason = 'Host disconnected') {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('error_alert', { message: reason });
  for (const p of room.players) {
    const sock = io.sockets.sockets.get(p.socketId);
    if (sock) {
      sock.leave(roomId);
      sock.data.roomId = null;
    }
  }
  clearInterval(room._timerInterval);
  rooms.delete(roomId);
}

// ─── Game Logic ─────────────────────────────────────────────────────────────
function getAlbumOwnerIndex(i, roundNumber, totalPlayers) {
  return ((i - (roundNumber - 1)) % totalPlayers + totalPlayers) % totalPlayers;
}

function startNextPhase(io, room) {
  const totalPlayers = room.circularPath.length;

  if (room.currentRound > totalPlayers) {
    clearInterval(room._timerInterval);
    room.status = 'SHOWCASE';
    io.to(room.roomId).emit('showcase_start');
    broadcastPublicRooms(io);
    runShowcase(io, room);
    return;
  }

  const roundNumber = room.currentRound;
  let isDrawRound = false;

  room.circularPath.forEach((player, i) => {
    const albumOwnerIdx = getAlbumOwnerIndex(i, roundNumber, totalPlayers);
    const albumOwner = room.circularPath[albumOwnerIdx];
    const album = room.albums[albumOwner.socketId] || [];
    const lastEntry = album.length > 0 ? album[album.length - 1] : null;

    let expectedInput;
    if (roundNumber === 1) {
      expectedInput = 'TEXT_FORM';
    } else if (!lastEntry || lastEntry.type === 'TEXT' || lastEntry.type === 'FALLBACK_TEXT') {
      expectedInput = 'CANVAS';
      isDrawRound = true;
    } else {
      expectedInput = 'TEXT_FORM';
    }

    const referenceData = lastEntry ? { type: lastEntry.type, content: lastEntry.content } : null;
    const sock = io.sockets.sockets.get(player.socketId);
    if (sock) {
      sock.emit('phase_sync', {
        roundNumber,
        totalRounds: totalPlayers,
        expectedInput,
        referenceData,
      });
    }
  });

  const timerDuration = (roundNumber === 1) ? room.guessTime : (isDrawRound ? room.drawTime : room.guessTime);
  room.submittedThisRound = new Set();
  room.expectedSubmissions = totalPlayers;
  startRoundTimer(io, room, timerDuration);
}

function startRoundTimer(io, room, duration) {
  let timeLeft = duration;
  clearInterval(room._timerInterval);
  io.to(room.roomId).emit('timer_tick', { timeLeft });

  room._timerInterval = setInterval(() => {
    timeLeft--;
    io.to(room.roomId).emit('timer_tick', { timeLeft });
    if (timeLeft <= 0) {
      clearInterval(room._timerInterval);
      resolveRound(io, room);
    }
  }, 1000);
}

function resolveRound(io, room) {
  const totalPlayers = room.circularPath.length;
  const roundNumber = room.currentRound;

  // Signal all non-submitted players to auto-submit their current work
  const unsubmitted = room.circularPath.filter((p) => !room.submittedThisRound.has(p.socketId));
  if (unsubmitted.length === 0) {
    // Everyone already submitted — advance immediately
    room.currentRound++;
    startNextPhase(io, room);
    return;
  }

  // Mark that we are in the grace window so submit_turn won't also advance
  room._resolveGraceActive = true;

  for (const player of unsubmitted) {
    const sock = io.sockets.sockets.get(player.socketId);
    if (sock) sock.emit('force_auto_submit');
  }

  // Give clients 800ms to auto-submit, then fill fallbacks for anyone still missing
  setTimeout(() => {
    room._resolveGraceActive = false;

    // If round already advanced (all submitted during grace), skip
    if (room.currentRound !== roundNumber) return;

    room.circularPath.forEach((player, i) => {
      if (room.submittedThisRound.has(player.socketId)) return;

      const albumOwnerIdx = getAlbumOwnerIndex(i, roundNumber, totalPlayers);
      const albumOwner = room.circularPath[albumOwnerIdx];
      const album = room.albums[albumOwner.socketId] || [];
      const lastEntry = album[album.length - 1];

      const wasDrawRound = roundNumber !== 1 &&
        (!lastEntry || lastEntry.type === 'TEXT' || lastEntry.type === 'FALLBACK_TEXT');

      if (roundNumber === 1 || !wasDrawRound) {
        room.albums[albumOwner.socketId].push({
          authorId: player.socketId,
          type: 'FALLBACK_TEXT',
          content: '[Tidak Ada Tebakan]',
        });
      } else {
        room.albums[albumOwner.socketId].push({
          authorId: player.socketId,
          type: 'EMPTY_CANVAS',
          content: '',
        });
      }
    });

    room.currentRound++;
    startNextPhase(io, room);
  }, 800);
}

function runShowcase(io, room) {
  const albumKeys = room.circularPath.map((p) => p.socketId);
  room._showcaseIndex = 0;
  room._showcaseAlbumKeys = albumKeys;
  // Build finishedShowcaseAlbums for re-navigation
  room._finishedShowcaseAlbums = [];
  sendNextShowcaseAlbum(io, room);
}

function buildAlbumData(room, albumKey, albumIndex) {
  const ownerPlayer = room.circularPath.find((p) => p.socketId === albumKey);
  const entries = (room.albums[albumKey] || []).map((entry) => {
    const authorPlayer = room.circularPath.find((p) => p.socketId === entry.authorId);
    return {
      ...entry,
      authorName: authorPlayer?.username || '?',
      authorAvatarId: authorPlayer?.avatarId || 0,
    };
  });
  return {
    header: {
      ownerName: ownerPlayer?.username || '?',
      ownerAvatarId: ownerPlayer?.avatarId || 0,
      albumIndex,
      totalAlbums: room._showcaseAlbumKeys.length,
    },
    entries,
  };
}

function sendNextShowcaseAlbum(io, room) {
  const albumKey = room._showcaseAlbumKeys[room._showcaseIndex];
  if (!albumKey) {
    // All albums done — stay in SHOWCASE so clients can browse albums
    // Room will be reset when host explicitly returns to lobby via 'return_to_lobby'
    io.to(room.roomId).emit('showcase_complete');
    return;
  }

  const albumData = buildAlbumData(room, albumKey, room._showcaseIndex);

  io.to(room.roomId).emit('showcase_album_header', albumData.header);

  let entryIndex = 0;
  room._showcaseEntryTimer = null;

  function sendNextEntry() {
    if (entryIndex >= albumData.entries.length) {
      // Store completed album for re-navigation
      room._finishedShowcaseAlbums[room._showcaseIndex] = albumData;
      room._waitingForNextAlbum = true;
      io.to(room.roomId).emit('showcase_album_done');
      return;
    }
    io.to(room.roomId).emit('showcase_step', albumData.entries[entryIndex]);
    entryIndex++;
    room._showcaseEntryTimer = setTimeout(sendNextEntry, 3750);
  }
  sendNextEntry();
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    maxHttpBufferSize: 5e6,
  });

  io.on('connection', (socket) => {
    console.log(`[+] ${socket.id} connected`);
    socket.emit('public_rooms_list', getPublicRoomList());

    socket.on('create_room', ({ maxPlayers, isPrivate, theme, drawTime, guessTime, username, avatarId }) => {
      const roomId = generateRoomId();
      const player = { socketId: socket.id, username, avatarId, isHost: true };
      const room = {
        roomId, status: 'LOBBY', isPrivate: !!isPrivate,
        maxPlayers: maxPlayers || 8, drawTime: drawTime || 90,
        guessTime: guessTime || 45, theme: theme || '',
        players: [player], circularPath: [], albums: {},
        currentRound: 1, submittedThisRound: new Set(), expectedSubmissions: 0,
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.player = player;
      socket.emit('room_created', { roomId });
      io.to(roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    });

    socket.on('join_room', ({ roomId, username, avatarId }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error_alert', { message: 'Room tidak ditemukan.' });
      if (room.status !== 'LOBBY') return socket.emit('error_alert', { message: 'Game sudah berjalan.' });
      if (room.players.length >= room.maxPlayers) return socket.emit('error_alert', { message: 'Room sudah penuh.' });
      const player = { socketId: socket.id, username, avatarId, isHost: false };
      room.players.push(player);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.player = player;
      io.to(roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    });

    socket.on('leave_room', () => handleLeave(socket, io));

    socket.on('kick_player', ({ targetSocketId }) => {
      const room = rooms.get(socket.data.roomId);
      if (!room || !socket.data.player?.isHost) return;
      const target = io.sockets.sockets.get(targetSocketId);
      if (target) {
        target.emit('error_alert', { message: 'Kamu dikeluarkan oleh Host.' });
        target.leave(socket.data.roomId);
        target.data.roomId = null;
      }
      room.players = room.players.filter((p) => p.socketId !== targetSocketId);
      io.to(room.roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    });

    socket.on('update_room_settings', (settings) => {
      const room = rooms.get(socket.data.roomId);
      if (!room || !socket.data.player?.isHost) return;
      if (settings.maxPlayers != null) room.maxPlayers = settings.maxPlayers;
      if (settings.drawTime != null) room.drawTime = settings.drawTime;
      if (settings.guessTime != null) room.guessTime = settings.guessTime;
      if (settings.theme !== undefined) room.theme = settings.theme;
      if (settings.isPrivate !== undefined) room.isPrivate = settings.isPrivate;
      io.to(room.roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    });

    socket.on('force_start', () => {
      const room = rooms.get(socket.data.roomId);
      if (!room || !socket.data.player?.isHost) return;
      if (room.players.length < 4) return socket.emit('error_alert', { message: 'Minimal 4 pemain.' });
      if (room.status !== 'LOBBY') return;
      room.status = 'IN_GAME';
      room.circularPath = shuffle(room.players);
      room.circularPath.forEach((p) => { room.albums[p.socketId] = []; });
      room.currentRound = 1;
      io.to(room.roomId).emit('game_started');
      broadcastPublicRooms(io);
      startNextPhase(io, room);
    });

    socket.on('submit_turn', ({ roomId, type, content }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'IN_GAME') return;
      if (room.submittedThisRound.has(socket.id)) return;
      const totalPlayers = room.circularPath.length;
      const playerIdx = room.circularPath.findIndex((p) => p.socketId === socket.id);
      if (playerIdx === -1) return;
      const albumOwnerIdx = getAlbumOwnerIndex(playerIdx, room.currentRound, totalPlayers);
      const albumOwner = room.circularPath[albumOwnerIdx];
      room.albums[albumOwner.socketId].push({ authorId: socket.id, type, content });
      room.submittedThisRound.add(socket.id);
      if (room.submittedThisRound.size >= room.expectedSubmissions) {
        clearInterval(room._timerInterval);
        // Only advance if NOT inside the resolveRound grace window
        // (resolveRound timeout will handle advancing)
        if (!room._resolveGraceActive) {
          room.currentRound++;
          startNextPhase(io, room);
        }
      }
    });

    socket.on('next_album', () => {
      const room = rooms.get(socket.data.roomId);
      if (!room || room.status !== 'SHOWCASE' || !socket.data.player?.isHost) return;
      if (!room._waitingForNextAlbum) return;
      room._waitingForNextAlbum = false;
      clearTimeout(room._showcaseEntryTimer);
      room._showcaseIndex++;
      sendNextShowcaseAlbum(io, room);
    });

    // Host explicitly returns to lobby after showcase
    socket.on('return_to_lobby', () => {
      const room = rooms.get(socket.data.roomId);
      if (!room || !socket.data.player?.isHost) return;
      if (room.status !== 'SHOWCASE') return;
      room.status = 'LOBBY';
      room.currentRound = 1;
      room.albums = {};
      room.circularPath = [];
      room.submittedThisRound = new Set();
      room._finishedShowcaseAlbums = [];
      io.to(room.roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    });


    socket.on('disconnect', () => {
      console.log(`[-] ${socket.id} disconnected`);
      handleLeave(socket, io);
    });
  });

  function handleLeave(socket, io) {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const leavingPlayer = socket.data.player;
    socket.leave(roomId);
    socket.data.roomId = null;
    if (leavingPlayer?.isHost) {
      destroyRoom(io, roomId, 'Host keluar. Ruangan dibubarkan.');
      broadcastPublicRooms(io);
    } else {
      room.players = room.players.filter((p) => p.socketId !== socket.id);
      io.to(roomId).emit('room_state_update', sanitizeRoom(room));
      broadcastPublicRooms(io);
    }
  }

  httpServer.listen(port, () => {
    console.log(`> Katapixel ready at http://localhost:${port}`);
  });
});
