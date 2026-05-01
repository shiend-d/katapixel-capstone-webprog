// lib/downloadAlbum.ts — Render album entries to Canvas matching chat layout and download as PNG
import type { Entry } from './types';

const BG = '#fff5e1';
const BORDER = '#4a1f2e';
const LABEL = '#9a3556';
const TEXT_BG = '#ffe066';
const FALLBACK_BG = '#ffe0b8';
const PAD = 32;
const GAP = 24;
const CONTENT_W = 640;
const MAX_IMG_H = 400;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface Block {
  type: 'text' | 'image' | 'empty';
  author: string;
  label: string;
  isFallback?: boolean;
  lines?: string[];
  blockH: number;
  img?: HTMLImageElement;
  imgW?: number;
  imgH?: number;
  align: 'left' | 'right'; // gambar=left, teks=right (matching chat)
}

export async function downloadAlbumAsPng(
  ownerName: string,
  ownerAvatar: string,
  entries: Entry[],
): Promise<void> {
  const W = CONTENT_W + PAD * 2;

  // Measurement canvas
  const mc = document.createElement('canvas');
  mc.width = W;
  const mx = mc.getContext('2d')!;
  mx.font = '600 18px sans-serif';

  const blocks: Block[] = [];
  let totalH = PAD + 50 + 16; // top pad + header + gap

  for (const e of entries) {
    const author = e.authorName || '?';
    const isText = e.type === 'TEXT' || e.type === 'FALLBACK_TEXT';
    const isImage = e.type === 'IMAGE';
    const label = isText ? 'TEKS' : e.type === 'EMPTY_CANVAS' ? 'KOSONG' : 'GAMBAR';
    const align = isText ? 'right' : 'left'; // teks di kanan, gambar di kiri
    const labelRowH = 22;
    const maxBubbleW = CONTENT_W * 0.75;

    if (isText) {
      const lines = wrap(mx, e.content || '[Tidak Ada Tebakan]', maxBubbleW - 40);
      const bh = lines.length * 28 + 20;
      blocks.push({ type: 'text', author, label, isFallback: e.type === 'FALLBACK_TEXT', lines, blockH: labelRowH + 8 + bh, align });
      totalH += labelRowH + 8 + bh + GAP;
    } else if (isImage && e.content) {
      let img: HTMLImageElement | undefined;
      let imgW = maxBubbleW, imgH = 200;
      try {
        img = await loadImg(e.content);
        const ar = img.width / img.height;
        imgW = Math.min(img.width, maxBubbleW);
        imgH = imgW / ar;
        if (imgH > MAX_IMG_H) { imgH = MAX_IMG_H; imgW = imgH * ar; }
      } catch { img = undefined; }
      const blockH = labelRowH + 8 + (img ? imgH + 12 : 50);
      blocks.push({ type: img ? 'image' : 'empty', author, label: img ? label : 'KOSONG', blockH, img, imgW, imgH, align });
      totalH += blockH + GAP;
    } else {
      const blockH = labelRowH + 8 + 50;
      blocks.push({ type: 'empty', author, label, blockH, align });
      totalH += blockH + GAP;
    }
  }

  totalH += PAD;

  // --- Draw ---
  const c = document.createElement('canvas');
  c.width = W; c.height = totalH;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, totalH);
  ctx.strokeStyle = BORDER; ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, totalH - 6);

  let y = PAD;

  // Header
  ctx.font = '800 26px sans-serif';
  ctx.fillStyle = BORDER;
  ctx.textAlign = 'center';
  ctx.fillText(`${ownerAvatar}  Album Milik ${ownerName}`, W / 2, y + 32);
  y += 50 + 16;

  const maxBubbleW = CONTENT_W * 0.75;

  for (const b of blocks) {
    // Author label — aligned to match content
    ctx.font = '700 13px sans-serif';
    ctx.fillStyle = LABEL;
    if (b.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillText(`${b.label}  •  ${b.author}`, W - PAD, y + 15);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText(`${b.author}  •  ${b.label}`, PAD, y + 15);
    }
    y += 22 + 8;

    if (b.type === 'text' && b.lines) {
      const bw = Math.min(ctx.measureText(b.lines.reduce((a, l) => a.length > l.length ? a : l, '')).width + 40, maxBubbleW);
      const bh = b.lines.length * 28 + 20;
      // Teks di kanan
      const bx = W - PAD - bw;
      ctx.fillStyle = b.isFallback ? FALLBACK_BG : TEXT_BG;
      rr(ctx, bx, y, bw, bh, 14);
      ctx.fill();
      ctx.strokeStyle = BORDER; ctx.lineWidth = 3;
      rr(ctx, bx, y, bw, bh, 14);
      ctx.stroke();
      ctx.font = '600 18px sans-serif';
      ctx.fillStyle = b.isFallback ? LABEL : BORDER;
      ctx.textAlign = 'left';
      let ly = y + 26;
      for (const line of b.lines) { ctx.fillText(line, bx + 16, ly); ly += 28; }
      y += bh + GAP;
    } else if (b.type === 'image' && b.img) {
      // Gambar di kiri
      const ix = PAD;
      ctx.strokeStyle = BORDER; ctx.lineWidth = 4;
      rr(ctx, ix - 4, y - 4, b.imgW! + 8, b.imgH! + 8, 12);
      ctx.stroke();
      ctx.drawImage(b.img, ix, y, b.imgW!, b.imgH!);
      y += b.imgH! + 12 + GAP;
    } else {
      // Empty — di kiri
      const ex = PAD;
      ctx.fillStyle = '#fff8e1';
      rr(ctx, ex, y, maxBubbleW, 40, 10);
      ctx.fill();
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = BORDER + '80'; ctx.lineWidth = 2;
      rr(ctx, ex, y, maxBubbleW, 40, 10);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = BORDER + '80';
      ctx.textAlign = 'center';
      ctx.fillText('[Tidak ada gambar]', ex + maxBubbleW / 2, y + 26);
      y += 50 + GAP;
    }
  }

  // Watermark
  ctx.font = '600 11px sans-serif';
  ctx.fillStyle = LABEL + '80';
  ctx.textAlign = 'right';
  ctx.fillText('Katapixel — The Pesan Berantai Game', W - PAD, totalH - 12);

  // Download
  const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to create image blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Katapixel_Album_${ownerName}_${new Date().toISOString().slice(0, 10)}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
