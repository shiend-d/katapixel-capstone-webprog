# 🎨 Katapixel — Game Pesan Tebak Gambar Berantai

**Katapixel** adalah permainan multiplayer real-time berbasis web yang terinspirasi dari konsep *Gartic Phone* / *Broken Telephone*. Pemain secara bergiliran menulis kalimat, menggambar, dan menebak gambar secara berantai — menghasilkan album lucu dari miskomunikasi yang terjadi di setiap putaran.

> 📦 Proyek ini dibuat sebagai **Ujian Akhir Semester (UAS) / Capstone** mata kuliah **Pemrograman Web — Semester 4**

---

## 📸 Tampilan Aplikasi

| Menu Utama | Lobby | Canvas Menggambar |
|:---:|:---:|:---:|
| Profil & avatar pemain | Pengaturan ruangan | Tools gambar lengkap |

| Fase Tebak | Showcase Album | Unduh Album |
|:---:|:---:|:---:|
| Tebak gambar jadi teks | Pemutar album waterfall | Hasil PNG album |

---

## 🎮 Cara Bermain

1. **Buat Profil** — Pilih nama panggilan & avatar emoji (🐱🐶🐸🦊🐻🐼🐨🦁🐯🐮)
2. **Buat / Gabung Ruangan** — Buat ruangan baru atau gabung via kode / daftar ruangan publik
3. **Tulis Kalimat** — Ronde 1: setiap pemain menulis kalimat aneh atau lucu
4. **Gambar** — Pemain berikutnya menggambar berdasarkan kalimat yang diterima
5. **Tebak** — Pemain berikutnya menebak gambar tersebut menjadi kalimat
6. **Ulangi** — Proses terus berputar hingga semua pemain mendapat giliran
7. **Showcase** — Semua album ditampilkan satu per satu dalam format chat waterfall
8. **Unduh & Bagikan** — Unduh album sebagai gambar PNG untuk dibagikan

---

## ✨ Fitur Utama

### 🏠 Menu Utama
- Pembuatan profil dengan 10 pilihan avatar emoji
- Buat ruangan baru atau gabung via kode ruangan
- Daftar ruangan publik yang tersedia secara real-time

### 🎛️ Lobby & Pengaturan
- **Konfigurasi host**: maks pemain (2–10), waktu menggambar (30–180 detik), waktu menebak (15–90 detik)
- **Tema opsional**: berikan tema spesifik untuk kalimat awal
- **Ruangan publik / privat**: toggle visibilitas ruangan
- **Kode ruangan**: salin & bagikan untuk undangan
- **Kick pemain**: host bisa mengeluarkan pemain
- **Minimum 2 pemain** untuk memulai permainan

### 🎨 Canvas Menggambar
- Canvas HTML5 dengan resolusi 800×500 piksel
- **Alat gambar**: Pensil, Penghapus, Garis, Persegi, Lingkaran, Segitiga
- **Palet warna**: 12 warna preset + color picker kustom
- **Ukuran kuas**: slider 1–50px
- **Undo / Redo**: riwayat pengeditan
- **Hapus canvas**: reset ke putih
- **Auto-submit**: sistem otomatis mengirim gambar saat waktu habis

### 📝 Fase Menebak
- Input teks dengan batas 200 karakter
- Referensi gambar dari pemain sebelumnya ditampilkan
- **Auto-submit**: jika pemain tidak menekan "Done", teks otomatis dikirim apa adanya

### 🎬 Showcase Album
- Pemutar album otomatis dengan jeda 5 detik per entry
- Tampilan chat waterfall (gambar di kiri, teks di kanan)
- Navigasi antar album oleh host
- **Riwayat album**: setelah semua album diputar, klik nama pemain di sidebar untuk melihat album mereka kembali
- **Unduh album**: render album ke PNG via Canvas API (tersedia setelah semua album selesai)

### ⏱️ Auto-Submit & Fallback
- 800ms sebelum waktu habis, server meminta klien mengirim pekerjaan yang belum selesai
- Jika klien gagal merespons, server mengisi fallback (`[Tidak Ada Tebakan]` / canvas kosong)
- Mencegah permainan macet karena pemain AFK

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Bahasa** | TypeScript |
| **Styling** | Tailwind CSS v4 + Custom CSS (Gartic-inspired design system) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) |
| **Real-time** | [Socket.IO](https://socket.io/) (WebSocket) |
| **Canvas** | HTML5 Canvas API |
| **Font** | [Nunito](https://fonts.google.com/specimen/Nunito) (Google Fonts) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Railway](https://railway.app/) |

---

## 📁 Struktur Proyek

```
katapixel-capstone-pemweb/
├── app/
│   ├── globals.css          # Design system (Gartic-style panels, buttons, halftone)
│   ├── layout.tsx           # Root layout (Nunito font, metadata SEO)
│   └── page.tsx             # Entry point — Socket.IO event routing
├── components/
│   └── views/
│       ├── MainMenuView.tsx  # Menu utama, profil, join/create room
│       ├── LobbyView.tsx     # Lobby ruangan, pengaturan, daftar pemain
│       ├── GameCanvasView.tsx # Canvas menggambar dengan tools lengkap
│       ├── GameTextView.tsx   # Input teks untuk menulis/menebak
│       └── ShowcaseView.tsx   # Pemutar album & riwayat
├── lib/
│   ├── types.ts             # TypeScript interfaces (Player, Room, Entry, dll.)
│   ├── gameStore.ts         # Zustand store (state global aplikasi)
│   ├── socket.ts            # Singleton Socket.IO client
│   ├── downloadAlbum.ts     # Render album ke PNG via Canvas API
│   ├── canvasShapes.ts      # Logika bentuk gambar (garis, persegi, lingkaran, segitiga)
│   └── cursors.ts           # Kursor kustom untuk tools gambar
├── server.mjs               # Custom server: Next.js + Socket.IO + game logic
├── package.json
└── tsconfig.json
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru
- npm (bawaan Node.js)

### Instalasi

```bash
# Clone repository
git clone https://github.com/shiend-d/katapixel-capstone-webprog.git
cd katapixel-capstone-webprog

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Server development sudah termasuk Socket.IO — langsung bisa digunakan multiplayer.

### Production Build

```bash
npm run build
npm start
```

> **Catatan:** Aplikasi menggunakan custom server (`server.mjs`) yang menggabungkan Next.js + Socket.IO dalam satu proses. Variabel environment `PORT` bisa digunakan untuk mengatur port (default: 3000).

---

## 🌐 Deployment (Railway)

Aplikasi di-deploy di [Railway](https://railway.app/) dengan konfigurasi:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Port:** Otomatis dari environment variable `PORT`

> ⚠️ **Penting:** Selalu pastikan `package-lock.json` sinkron sebelum push. Jalankan `npm install` lokal setelah menambah dependency baru, lalu commit `package-lock.json` bersama perubahan.

---

## 🔌 Arsitektur Socket.IO Events

### Client → Server

| Event | Deskripsi |
|---|---|
| `create_room` | Buat ruangan baru dengan pengaturan |
| `join_room` | Gabung ruangan via kode |
| `update_room_settings` | Host mengubah pengaturan ruangan |
| `kick_player` | Host mengeluarkan pemain |
| `force_start` | Host memulai permainan |
| `submit_turn` | Kirim hasil (teks / gambar) |
| `next_album` | Host lanjut ke album berikutnya (showcase) |
| `return_to_lobby` | Host kembali ke lobby setelah showcase |
| `leave_room` | Keluar dari ruangan |

### Server → Client

| Event | Deskripsi |
|---|---|
| `room_created` | Ruangan berhasil dibuat |
| `room_state_update` | Update state ruangan (pemain, status) |
| `public_rooms_list` | Daftar ruangan publik |
| `game_started` | Permainan dimulai |
| `phase_sync` | Sinkronisasi fase (round, input type, referensi) |
| `timer_tick` | Countdown timer setiap detik |
| `force_auto_submit` | Sinyal auto-submit sebelum timeout |
| `showcase_start` | Showcase dimulai |
| `showcase_album_header` | Header album baru |
| `showcase_step` | Entry album (teks/gambar) satu per satu |
| `showcase_album_done` | Album selesai ditampilkan |
| `showcase_complete` | Semua album selesai |
| `error_alert` | Pesan error |

---

## 🎨 Design System

Aplikasi menggunakan **Gartic-inspired design system** dengan estetika kartun:

- **Warna utama**: Gradient oranye-pink (`#ff8a5b` → `#ff5e5e`)
- **Aksen**: Cokelat gelap (`#4a1f2e`), kuning (`#ffe066`), krim (`#fff5e1`)
- **Panel**: Border tebal 4px dengan drop shadow solid
- **Tombol**: Efek "pushable" saat ditekan (translateY + shadow reduction)
- **Pattern**: Halftone dot pattern & doodle SVG background
- **Font**: Nunito (weight 400–800)

---

## 👥 Tim Pengembang

| Nama | NIM | Peran |
|---|---|---|
| *Shiend* | - | Fullstack Developer |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan akademis — Ujian Akhir Semester mata kuliah Pemrograman Web, Semester 4.
