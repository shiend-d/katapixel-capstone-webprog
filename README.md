<div align="center">

# 🎨 KATAPIXEL

### _The Pesan Berantai Game_

**Permainan telepon rusak digital berbasis web — tulis, gambar, tebak, ulangi!**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-katapixel.shiend.my.id-ff5e5e?style=for-the-badge)](https://katapixel.shiend.my.id)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway)](https://railway.com)

</div>

---

## 📖 Tentang

**Katapixel** adalah permainan _multiplayer real-time_ yang terinspirasi dari konsep _Gartic Phone_ / telepon rusak. Pemain menulis kalimat, menggambar berdasarkan kalimat pemain lain, lalu menebak gambar pemain berikutnya — hingga pesan berantai terbentuk menjadi album yang seru dan penuh kejutan.

Proyek ini dikembangkan sebagai **Capstone Project UAS** mata kuliah **Pemrograman Web** — Semester 4.

### 🎮 Cara Bermain

```
1. Buka web → Masukkan nama & pilih avatar
2. Buat ruangan baru atau gabung ruangan yang sudah ada
3. Host menekan "MULAI" saat semua pemain siap
4. Ronde bergantian:
   📝 Tulis kalimat  →  🎨 Gambar kalimat orang lain  →  📝 Tebak gambar  →  🎨 ...
5. Setelah semua ronde selesai, album setiap pemain ditampilkan satu per satu
6. Unduh album favorit sebagai gambar PNG!
```

---

## ✨ Fitur

### 🏠 Main Menu
- Input nama panggilan (maks 20 karakter)
- Pilih avatar dari 10 karakter emoji (🐱🐶🐸🦊🐻🐼🐨🦁🐯🐮)
- **Buat Ruangan** baru atau **Gabung** dengan kode ruangan
- Daftar **Ruangan Publik** aktif yang bisa langsung diikuti

### 🎯 Lobby
- Kode ruangan yang bisa di-copy untuk dibagikan
- Pengaturan ruangan oleh Host:
  - **Maks Pemain**: 4–10 orang
  - **Waktu Menggambar**: 30–180 detik
  - **Waktu Menebak**: 15–120 detik
  - **Tema**: opsional, untuk memberi arahan kalimat awal
  - **Privasi**: Publik / Privat
- Fitur **Kick pemain** & **Bubarkan ruangan** untuk Host
- Minimum 4 pemain untuk memulai

### 🎨 Canvas (Fase Menggambar)
- Canvas HTML5 berukuran 800×500px dengan dukungan DPR
- **7 alat gambar**: Pensil, Penghapus, Kotak, Lingkaran, Segitiga, Garis, Fill (Isi Warna)
- Palet **12 warna** + slider ukuran kuas (1–50px)
- Tombol **Undo/Redo** (maks 30 langkah) + **Hapus Semua**
- Kursor kustom SVG sesuai alat yang dipilih
- Referensi kalimat yang harus digambar ditampilkan di atas canvas

### 📝 Teks (Fase Menulis / Menebak)
- Input teks dengan batas 200 karakter
- Referensi gambar dari pemain sebelumnya ditampilkan
- Ronde pertama: tulis kalimat bebas/sesuai tema
- Ronde selanjutnya: tebak apa yang dilihat dari gambar

### ⏱️ Auto-Submit
- Jika pemain tidak menekan "Done" sebelum waktu habis, sistem **otomatis mengirim** hasil kerja apa adanya
- Gambar dikirim sebagaimana kondisi canvas saat itu
- Teks kosong dikirim sebagai `[Tidak Ada Tebakan]`
- Mencegah kasus gambar/teks kosong yang merusak album

### 🎬 Showcase
- Album setiap pemain ditampilkan secara berurutan dengan animasi waterfall
- Layout chat: **gambar di kiri**, **teks di kanan** — seperti percakapan
- Host mengontrol navigasi antar album ("Berikutnya" / "Selesai & Kembali")
- Setelah semua album selesai:
  - **Klik pemain di sidebar** untuk melihat album riwayat masing-masing
  - Tombol **UNDUH** muncul untuk menyimpan album sebagai PNG

### 📥 Download Album
- Render album langsung ke **Canvas API** (bukan html2canvas) untuk kompatibilitas maksimal
- Layout unduhan cocok dengan tampilan chat (teks kanan, gambar kiri)
- Watermark "Katapixel — The Pesan Berantai Game"
- File PNG dengan nama otomatis: `Katapixel_Album_{nama}_{tanggal}.png`

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS 4 + Custom CSS (Gartic-style design system) |
| **State Management** | Zustand 5 |
| **Real-time** | Socket.IO 4.8 (client + server) |
| **Canvas** | HTML5 Canvas API (drawing + album export) |
| **Font** | Google Fonts — Nunito (400–800) |
| **Icons** | Lucide React |
| **Deployment** | Railway (custom Node.js server) |

---

## 🏗️ Arsitektur

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                   │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │MainMenu │→ │  Lobby   │→ │  Game  │→ │Showcase │ │
│  │  View   │  │   View   │  │Canvas/ │  │  View   │ │
│  │         │  │          │  │ Text   │  │         │ │
│  └─────────┘  └──────────┘  └────────┘  └─────────┘ │
│        ↕ Zustand Store (gameStore.ts)                 │
│        ↕ Socket.IO Client (socket.ts)                 │
└──────────────────┬───────────────────────────────────┘
                   │ WebSocket
┌──────────────────┴───────────────────────────────────┐
│                 server.mjs (Node.js)                  │
│                                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │              Socket.IO Server                     │ │
│  │  • Room Management (create/join/leave/kick)       │ │
│  │  • Game Phase Engine (text ↔ canvas rotation)     │ │
│  │  • Timer + Auto-submit (force_auto_submit)        │ │
│  │  • Showcase Orchestrator (album streaming)        │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌────────────────────┐                               │
│  │  Next.js SSR/CSR   │ ← HTTP request handler        │
│  └────────────────────┘                               │
└──────────────────────────────────────────────────────┘
```

### Struktur Folder

```
katapixel-capstone-pemweb/
├── app/
│   ├── globals.css        # Design system (Gartic-style panels, buttons, halftone)
│   ├── layout.tsx         # Root layout + Nunito font
│   └── page.tsx           # Socket.IO event wiring + view router
├── components/
│   └── views/
│       ├── MainMenuView.tsx    # Landing page + room join/create
│       ├── LobbyView.tsx       # Room settings + player list
│       ├── GameCanvasView.tsx   # Drawing canvas + tools
│       ├── GameTextView.tsx     # Text input + reference display
│       └── ShowcaseView.tsx     # Album showcase + download + history
├── lib/
│   ├── gameStore.ts       # Zustand store (all app state)
│   ├── socket.ts          # Socket.IO singleton client
│   ├── types.ts           # TypeScript interfaces
│   ├── downloadAlbum.ts   # Canvas API album renderer → PNG
│   ├── canvasShapes.ts    # Shape drawing helpers (triangle)
│   └── cursors.ts         # SVG cursor data URIs
├── server.mjs             # Custom server: Next.js + Socket.IO + game logic
├── package.json
└── tsconfig.json
```

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `create_room` | `{username, avatarId, maxPlayers, drawTime, guessTime, theme, isPrivate}` | Buat ruangan baru |
| `join_room` | `{roomId, username, avatarId}` | Gabung ruangan |
| `leave_room` | — | Keluar ruangan |
| `kick_player` | `{targetSocketId}` | Host mengeluarkan pemain |
| `update_room_settings` | `{key: value}` | Host ubah pengaturan |
| `force_start` | — | Host mulai permainan |
| `submit_turn` | `{roomId, type, content}` | Kirim hasil (TEXT/IMAGE) |
| `next_album` | — | Host lanjut ke album berikutnya |
| `return_to_lobby` | — | Host kembali ke lobby setelah showcase |

### Server → Client

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `room_created` | — | Konfirmasi ruangan dibuat |
| `room_state_update` | `Room` | Update state ruangan |
| `public_rooms_list` | `PublicRoom[]` | Daftar ruangan publik |
| `game_started` | — | Permainan dimulai |
| `phase_sync` | `PhaseSync` | Sinkronisasi fase baru |
| `timer_tick` | `{timeLeft}` | Countdown setiap detik |
| `force_auto_submit` | — | Sinyal auto-submit sebelum fallback |
| `showcase_start` | — | Showcase dimulai |
| `showcase_album_header` | `ShowcaseAlbumHeader` | Header album baru |
| `showcase_step` | `Entry` | Satu entry album (teks/gambar) |
| `showcase_album_done` | — | Album selesai ditampilkan |
| `showcase_complete` | — | Semua album selesai |
| `error_alert` | `{message}` | Pesan error ke klien |

---

## 🎨 Design System

Katapixel menggunakan custom design system bertema **kartun/board game** yang terinspirasi dari Gartic Phone:

- **Color Palette**: Warm tones — `#ff8a5b` (coral), `#ffe066` (kuning), `#4a1f2e` (dark maroon), `#9a3556` (mauve)
- **Typography**: [Nunito](https://fonts.google.com/specimen/Nunito) — weight 400 sampai 800
- **Panel Style**: Border tebal 4px `#4a1f2e` + drop shadow solid → `.gartic-panel`
- **Button Style**: Border 3px + pushable effect (translateY on click) → `.gartic-btn`
- **Background**: Multi-layer gradient + SVG doodle pattern (crosses, dots, waves)
- **Texture**: Halftone dot pattern overlay → `.halftone`

---

## 🚀 Instalasi & Pengembangan Lokal

### Prasyarat

- **Node.js** ≥ 18
- **npm** ≥ 9

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/shiend-d/katapixel-capstone-webprog.git
cd katapixel-capstone-webprog

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

> **Catatan:** Server custom (`server.mjs`) menjalankan Next.js + Socket.IO sekaligus pada port yang sama. Tidak perlu menjalankan server terpisah.

### Build Production

```bash
npm run build
npm start
```

---

## 🌐 Deployment

Aplikasi ini di-deploy menggunakan **[Railway](https://railway.com)** dengan konfigurasi:

- **Builder**: Railpack (Node.js/npm)
- **Start Command**: `NODE_ENV=production node server.mjs`
- **Custom Domain**: [katapixel.shiend.my.id](https://katapixel.shiend.my.id)

> Railway secara otomatis mendeteksi `package.json` dan menjalankan `npm ci` + `npm run build` saat deploy.

---

## 👥 Tim Pengembang

Proyek Capstone — Mata Kuliah Pemrograman Web, Semester 4

| Kontributor | Peran |
|-------------|-------|
| **Shiend** | Lead Developer — Arsitektur, game engine, UI/UX |
| **mziccoalfarozi** | Kontributor — Fitur canvas tools (Pensil, Penghapus, Segitiga) |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan akademik (UAS Pemrograman Web).

---

<div align="center">

**🎮 Mainkan sekarang di [katapixel.shiend.my.id](https://katapixel.shiend.my.id)**

_Tulis. Gambar. Tebak. Tertawa bersama._

</div>
