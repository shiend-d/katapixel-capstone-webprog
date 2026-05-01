# IMPLEMENTASI 5 REVISI KATAPIXEL

## RINGKASAN PERUBAHAN

Dokumen ini memberikan kode yang siap pakai untuk mengintegrasikan 5 revisi ke komponen yang ada.

---

## 1️⃣ KURSOR DINAMIS (PENCIL & ERASER)

### File yang Diubah: `components/views/GameCanvasView.tsx`

#### Langkah 1A: Tambah Import di Bagian Atas
```tsx
// Setelah import yang sudah ada
import { CURSOR_PENCIL, CURSOR_ERASER } from '@/lib/cursors';
import { drawTriangle } from '@/lib/canvasShapes';
```

#### Langkah 1B: Tambah State untuk Tracking Eraser
```tsx
// Tambahkan setelah state lainnya
const isEraser = tool === 'eraser'; // Track untuk cursor dinamis
```

#### Langkah 1C: Ubah Canvas Style Props
Cari baris canvas element (sekitar line 280) dan ubah cursor-nya:

**SEBELUM:**
```tsx
<canvas ref={canvasRef}
  className="halftone w-full rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff8e1]"
  style={{ touchAction: 'none', cursor: 'crosshair', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
```

**SESUDAH:**
```tsx
<canvas ref={canvasRef}
  className="halftone w-full rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff8e1]"
  style={{ 
    touchAction: 'none', 
    cursor: isEraser ? CURSOR_ERASER : CURSOR_PENCIL,
    aspectRatio: `${CANVAS_W}/${CANVAS_H}` 
  }}
```

---

## 2️⃣ BANGUN DATAR SEGITIGA

### File yang Diubah: `components/views/GameCanvasView.tsx`

#### Langkah 2A: Tambah Triangle ke TOOLS Array
Cari `const TOOLS` di bagian atas file dan ubah menjadi:

```tsx
import { Triangle } from 'lucide-react'; // Tambah di import

const TOOLS: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pensil' },
  { id: 'eraser', icon: Eraser, label: 'Hapus' },
  { id: 'rect', icon: Square, label: 'Kotak' },
  { id: 'circle', icon: Circle, label: 'Lingkaran' },
  { id: 'triangle', icon: Triangle, label: 'Segitiga' }, // ← BARU
  { id: 'line', icon: Minus, label: 'Garis' },
  { id: 'fill', icon: PaintBucket, label: 'Isi' },
];
```

#### Langkah 2B: Update Type Tool
```tsx
type Tool = 'pencil' | 'eraser' | 'rect' | 'circle' | 'triangle' | 'line' | 'fill'; // Tambah 'triangle'
```

#### Langkah 2C: Update handlePointerDown untuk Snapshot Triangle
Cari dalam `handlePointerDown` function dan ubah baris ini:

**SEBELUM:**
```tsx
if (tool === 'rect' || tool === 'circle' || tool === 'line') {
  const dpr = window.devicePixelRatio || 1;
  snapshot.current = ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
}
```

**SESUDAH:**
```tsx
if (tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'line') {
  const dpr = window.devicePixelRatio || 1;
  snapshot.current = ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
}
```

#### Langkah 2D: Update handlePointerMove untuk Drawing Triangle
Cari dalam `handlePointerMove` function dan ubah bagian shape drawing:

**SEBELUM:**
```tsx
if ((tool === 'rect' || tool === 'circle' || tool === 'line') && snapshot.current) {
  ctx.putImageData(snapshot.current, 0, 0);
  ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
  const sx = startPos.current.x, sy = startPos.current.y;
  const w = pos.x - sx, h = pos.y - sy;
  if (tool === 'rect') { ctx.strokeRect(sx, sy, w, h); }
  else if (tool === 'circle') {
    ctx.beginPath();
    ctx.ellipse(sx + w/2, sy + h/2, Math.abs(w)/2, Math.abs(h)/2, 0, 0, Math.PI*2);
    ctx.stroke();
  } else if (tool === 'line') {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
  }
}
```

**SESUDAH:**
```tsx
if ((tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'line') && snapshot.current) {
  ctx.putImageData(snapshot.current, 0, 0);
  ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
  const sx = startPos.current.x, sy = startPos.current.y;
  const w = pos.x - sx, h = pos.y - sy;
  if (tool === 'rect') { ctx.strokeRect(sx, sy, w, h); }
  else if (tool === 'circle') {
    ctx.beginPath();
    ctx.ellipse(sx + w/2, sy + h/2, Math.abs(w)/2, Math.abs(h)/2, 0, 0, Math.PI*2);
    ctx.stroke();
  } else if (tool === 'triangle') {
    drawTriangle(ctx, sx, sy, pos.x, pos.y, color, brushSize);
  } else if (tool === 'line') {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
  }
}
```

---

## 3️⃣ AUTO-SUBMIT SAAT TIMER HABIS

### File yang Diubah: `components/views/GameCanvasView.tsx` dan `components/views/GameTextView.tsx`

#### Langkah 3A: Tambah useEffect di GameCanvasView
Tambahkan kode ini SETELAH useEffect untuk canvas initialization (sekitar line 65):

```tsx
// Auto-submit saat timer habis (mencegah double submission dengan hasSubmitted)
useEffect(() => {
  if (timeLeft === 0 && !hasSubmitted && gamePhase?.expectedInput === 'CANVAS') {
    const timer = setTimeout(() => {
      handleSubmit();
    }, 100); // Delay kecil agar state ter-update sempurna
    return () => clearTimeout(timer);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [timeLeft, hasSubmitted, gamePhase]);
```

#### Langkah 3B: Tambah useEffect di GameTextView
Di file `components/views/GameTextView.tsx`, tambahkan import useEffect dulu jika belum:

```tsx
import { useState, useEffect } from 'react'; // Tambah useEffect
```

Kemudian tambahkan useEffect ini SETELAH deklarasi state (sekitar line 15):

```tsx
// Auto-submit saat timer habis untuk fase menebak
useEffect(() => {
  if (timeLeft === 0 && !hasSubmitted && text.trim() && gamePhase?.expectedInput === 'TEXT_FORM') {
    const timer = setTimeout(() => {
      handleSubmit();
    }, 100);
    return () => clearTimeout(timer);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [timeLeft, hasSubmitted, text, gamePhase]);
```

---

## 4️⃣ FITUR UNDUH ALBUM DI SHOWCASE

### File yang Diubah: `components/views/ShowcaseView.tsx`

#### Langkah 4A: Tambah Imports
```tsx
import { useRef } from 'react';
import { downloadElementAsImage, generateAlbumFileName } from '@/lib/downloadAlbum';
import { Download } from 'lucide-react'; // Untuk icon button
```

#### Langkah 4B: Tambah Ref untuk Album Content
Di dalam function ShowcaseView, tambahkan ref baru:

```tsx
const scrollRef = useRef<HTMLDivElement>(null);
const albumContentRef = useRef<HTMLDivElement>(null); // ← BARU
```

#### Langkah 4C: Buat Function untuk Download
Tambahkan function baru setelah `handleNextAlbum`:

```tsx
function handleDownloadAlbum() {
  if (!showcaseAlbumHeader || !albumContentRef.current) return;
  const fileName = generateAlbumFileName(showcaseAlbumHeader.ownerName);
  downloadElementAsImage(albumContentRef.current, fileName);
}
```

#### Langkah 4D: Aplikasikan Ref ke Div Album Content
Cari `<div className="gartic-panel bg-[#fff5e1] p-5">` (album content div) dan ubah menjadi:

```tsx
<div className="gartic-panel bg-[#fff5e1] p-5" ref={albumContentRef}>
```

#### Langkah 4E: Tambah Button Download
Cari bagian "Album owner header" dan tambahkan button download:

**SEBELUM (cari sekitar line 70-80):**
```tsx
{showcaseAlbumHeader && (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-[#4a1f2e]" style={{ fontWeight: 800 }}>
      {AVATARS[showcaseAlbumHeader.ownerAvatarId]} Album Milik {showcaseAlbumHeader.ownerName}
    </h2>
    {myIsHost && showcaseAlbumDone && !showcaseComplete && (
      <button onClick={handleNextAlbum}
        className="gartic-btn flex items-center gap-1.5 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-4 py-2 text-sm text-white"
        style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
        BERIKUTNYA <ArrowRight className="h-4 w-4" />
      </button>
    )}
  </div>
)}
```

**SESUDAH:**
```tsx
{showcaseAlbumHeader && (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-[#4a1f2e]" style={{ fontWeight: 800 }}>
      {AVATARS[showcaseAlbumHeader.ownerAvatarId]} Album Milik {showcaseAlbumHeader.ownerName}
    </h2>
    <div className="flex gap-2">
      <button onClick={handleDownloadAlbum}
        className="gartic-btn flex items-center gap-1.5 bg-[#9a5dff] px-4 py-2 text-sm text-white hover:bg-[#8047d8]"
        style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
        <Download className="h-4 w-4" /> UNDUH
      </button>
      {myIsHost && showcaseAlbumDone && !showcaseComplete && (
        <button onClick={handleNextAlbum}
          className="gartic-btn flex items-center gap-1.5 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-4 py-2 text-sm text-white"
          style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
          BERIKUTNYA <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  </div>
)}
```

#### Langkah 4F: Install html2canvas di package.json
Jalankan di terminal:
```bash
npm install html2canvas
```

---

## 5️⃣ NAVIGASI "LIHAT ALBUM SEBELUMNYA"

### File yang Diubah: `lib/gameStore.ts` dan `components/views/ShowcaseView.tsx`

#### Langkah 5A: Tambah State di Zustand Store
Edit `lib/gameStore.ts` dan tambahkan state baru:

**SEBELUM (dalam interface GameState):**
```tsx
  // Showcase
  showcaseAlbumHeader: ShowcaseAlbumHeader | null;
  showcaseEntries: Entry[];
  showcaseAlbumDone: boolean;
  showcaseComplete: boolean;
```

**SESUDAH:**
```tsx
  // Showcase
  showcaseAlbumHeader: ShowcaseAlbumHeader | null;
  showcaseEntries: Entry[];
  showcaseAlbumDone: boolean;
  showcaseComplete: boolean;
  currentAlbumIndex: number; // ← BARU
  allAlbums: any[]; // ← BARU (berisi semua album data)
```

#### Langkah 5B: Tambah Actions di Store
Dalam create() function, tambahkan di bagian actions:

```tsx
  setCurrentAlbumIndex: (index: number) => set({ currentAlbumIndex: index }),
  setAllAlbums: (albums: any[]) => set({ allAlbums: albums }),
```

#### Langkah 5C: Update Initial State
Dalam initial state, tambahkan:

```tsx
  currentAlbumIndex: 0,
  allAlbums: [],
```

#### Langkah 5D: Update ResetForNewAlbum
```tsx
resetForNewAlbum: () => set({ showcaseEntries: [], showcaseAlbumDone: false, currentAlbumIndex: 0 }),
```

#### Langkah 5E: Update ShowcaseView dengan Navigation Logic
Di `components/views/ShowcaseView.tsx`, tambahkan di bagian imports:

```tsx
import { ArrowRight, ArrowLeft, Home, MessageSquare, Image as ImageIcon } from 'lucide-react'; // Tambah ArrowLeft
```

Kemudian ubah useGameStore untuk mengambil state baru:

**SEBELUM:**
```tsx
  const showcaseAlbumHeader = useGameStore((s) => s.showcaseAlbumHeader);
  const showcaseEntries = useGameStore((s) => s.showcaseEntries);
  const showcaseAlbumDone = useGameStore((s) => s.showcaseAlbumDone);
  const showcaseComplete = useGameStore((s) => s.showcaseComplete);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const roomData = useGameStore((s) => s.roomData);
```

**SESUDAH:**
```tsx
  const showcaseAlbumHeader = useGameStore((s) => s.showcaseAlbumHeader);
  const showcaseEntries = useGameStore((s) => s.showcaseEntries);
  const showcaseAlbumDone = useGameStore((s) => s.showcaseAlbumDone);
  const showcaseComplete = useGameStore((s) => s.showcaseComplete);
  const myIsHost = useGameStore((s) => s.myIsHost);
  const roomData = useGameStore((s) => s.roomData);
  const currentAlbumIndex = useGameStore((s) => s.currentAlbumIndex); // ← BARU
  const allAlbums = useGameStore((s) => s.allAlbums); // ← BARU
```

#### Langkah 5F: Update Handler Functions
Ubah `handleNextAlbum`:

**SEBELUM:**
```tsx
function handleNextAlbum() { getSocket().emit('next_album'); }
```

**SESUDAH:**
```tsx
function handleNextAlbum() {
  if (currentAlbumIndex < allAlbums.length - 1) {
    useGameStore.getState().setCurrentAlbumIndex(currentAlbumIndex + 1);
    getSocket().emit('change_album', { newIndex: currentAlbumIndex + 1 });
  } else {
    // Jika sudah di album terakhir, kirim signal selesai
    getSocket().emit('showcase_complete');
  }
}
```

Tambah function baru untuk Previous:

```tsx
function handlePreviousAlbum() {
  if (currentAlbumIndex > 0) {
    useGameStore.getState().setCurrentAlbumIndex(currentAlbumIndex - 1);
    getSocket().emit('change_album', { newIndex: currentAlbumIndex - 1 });
  }
}
```

#### Langkah 5G: Update Buttons di Render
Cari bagian tombol "BERIKUTNYA" (sekitar line 95):

**SEBELUM:**
```tsx
      {myIsHost && showcaseAlbumDone && !showcaseComplete && (
        <button onClick={handleNextAlbum}
          className="gartic-btn flex items-center gap-1.5 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] px-4 py-2 text-sm text-white"
          style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
          BERIKUTNYA <ArrowRight className="h-4 w-4" />
        </button>
      )}
```

**SESUDAH:**
```tsx
      {myIsHost && showcaseAlbumDone && !showcaseComplete && (
        <div className="flex gap-2">
          {/* Button Sebelumnya */}
          <button 
            onClick={handlePreviousAlbum}
            disabled={currentAlbumIndex === 0}
            className={`gartic-btn flex items-center gap-1.5 px-4 py-2 text-sm ${
              currentAlbumIndex === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-[#ffa500] text-white hover:bg-[#ff8c00]'
            }`}
            style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
            <ArrowLeft className="h-4 w-4" /> SEBELUMNYA
          </button>
          
          {/* Button Berikutnya / Selesai */}
          <button 
            onClick={handleNextAlbum}
            className={`gartic-btn flex items-center gap-1.5 px-4 py-2 text-sm text-white ${
              currentAlbumIndex === allAlbums.length - 1 
                ? 'bg-gradient-to-b from-[#7bd389] to-[#3fb56b]' 
                : 'bg-gradient-to-b from-[#7bd389] to-[#3fb56b]'
            }`}
            style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e' }}>
            {currentAlbumIndex === allAlbums.length - 1 ? (
              <>SELESAI & KEMBALI</>
            ) : (
              <>BERIKUTNYA <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
```

---

## 📋 CHECKLIST IMPLEMENTASI

- [ ] 1. Buat file `lib/cursors.ts` untuk SVG cursor
- [ ] 2. Buat file `lib/canvasShapes.ts` untuk shape utilities
- [ ] 3. Buat file `lib/downloadAlbum.ts` untuk download functionality
- [ ] 4. Update `GameCanvasView.tsx`:
  - [ ] 4.1 Import cursor dan shape
  - [ ] 4.2 Add triangle to TOOLS array
  - [ ] 4.3 Update canvas cursor style
  - [ ] 4.4 Add triangle drawing logic
  - [ ] 4.5 Add auto-submit useEffect
- [ ] 5. Update `GameTextView.tsx`:
  - [ ] 5.1 Add useEffect import
  - [ ] 5.2 Add auto-submit useEffect
- [ ] 6. Update `ShowcaseView.tsx`:
  - [ ] 6.1 Add Download icon import
  - [ ] 6.2 Add downloadAlbum import
  - [ ] 6.3 Add albumContentRef
  - [ ] 6.4 Add handleDownloadAlbum function
  - [ ] 6.5 Add ref to album content div
  - [ ] 6.6 Add Download button
  - [ ] 6.7 Add navigation states (currentAlbumIndex, allAlbums)
  - [ ] 6.8 Add Previous/Next button logic
- [ ] 7. Update `lib/gameStore.ts`:
  - [ ] 7.1 Add currentAlbumIndex state
  - [ ] 7.2 Add allAlbums state
  - [ ] 7.3 Add setCurrentAlbumIndex action
  - [ ] 7.4 Add setAllAlbums action
- [ ] 8. Run `npm install html2canvas` di terminal
- [ ] 9. Test semua fitur

---

## 🚀 NOTES PENTING

1. **Cursor SVG**: SVG inline lebih ringan dan tidak memerlukan file eksternal
2. **Triangle Shape**: Menggunakan snapshot untuk preview saat drag, sama seperti rectangle dan circle
3. **Auto-Submit**: Menggunakan `hasSubmitted` flag untuk mencegah double emission pada detik ke-0
4. **Download Album**: Memerlukan instalasi `html2canvas` dari npm
5. **Navigation**: Implementasi index-based memungkinkan navigasi prev/next yang lebih responsif

---

## 📞 TROUBLESHOOTING

**Problem**: Cursor tidak muncul
- **Solusi**: Cek browser console untuk encoding errors, atau test SVG inline secara manual

**Problem**: Triangle tidak terlihat saat drag
- **Solusi**: Pastikan `snapshot.current` tersimpan, dan gunakan `ctx.putImageData()` sebelum draw

**Problem**: Auto-submit tidak jalan
- **Solusi**: Cek browser console apakah `timeLeft === 0` benar-benar tercapai, dan `hasSubmitted` masih false

**Problem**: Download tidak berfungsi
- **Solusi**: Pastikan `html2canvas` sudah diinstall, cek console untuk errors

**Problem**: Navigation album tidak update
- **Solusi**: Pastikan server emit `change_album` event dan state berubah di gameStore
