// lib/downloadAlbum.ts — Render album entries to Canvas and download as PNG
import type { Entry } from './types';

const BG = '#fff5e1';
const BORDER = '#4a1f2e';
const LABEL = '#9a3556';
const TEXT_BG = '#ffe066';
const FALLBACK_BG = '#ffe0b8';
const PAD = 32;
const GAP = 24;
const MAX_W = 640;
const MAX_IMG_H = 400;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    // For data: URLs, crossOrigin is not needed and can cause issues
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
}

export async function downloadAlbumAsPng(
  ownerName: string,
  ownerAvatar: string,
  entries: Entry[],
): Promise<void> {
  const W = MAX_W + PAD * 2;

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
    const label = isText ? 'TEKS' : e.type === 'EMPTY_CANVAS' ? 'KOSONG' : 'GAMBAR';
    const labelRowH = 22;

    if (isText) {
      const lines = wrap(mx, e.content || '[Tidak Ada Tebakan]', MAX_W - 40);
      const bh = lines.length * 28 + 20;
      const blockH = labelRowH + 8 + bh;
      blocks.push({ type: 'text', author, label, isFallback: e.type === 'FALLBACK_TEXT', lines, blockH });
      totalH += blockH + GAP;
    } else if (e.type === 'IMAGE' && e.content) {
      let img: HTMLImageElement | undefined;
      let imgW = MAX_W, imgH = 200;
      try {
        img = await loadImg(e.content);
        const ar = img.width / img.height;
        imgW = Math.min(img.width, MAX_W);
        imgH = imgW / ar;
        if (imgH > MAX_IMG_H) { imgH = MAX_IMG_H; imgW = imgH * ar; }
      } catch {
        img = undefined;
      }
      const blockH = labelRowH + 8 + (img ? imgH + 12 : 50);
      blocks.push({ type: img ? 'image' : 'empty', author, label: img ? label : 'KOSONG', blockH, img, imgW, imgH });
      totalH += blockH + GAP;
    } else {
      const blockH = labelRowH + 8 + 50;
      blocks.push({ type: 'empty', author, label, blockH });
      totalH += blockH + GAP;
    }
  }

  totalH += PAD; // bottom padding

  // --- Draw ---
  const c = document.createElement('canvas');
  c.width = W;
  c.height = totalH;
  const ctx = c.getContext('2d')!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, totalH);

  // Border
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, totalH - 6);

  let y = PAD;

  // Header
  ctx.font = '800 26px sans-serif';
  ctx.fillStyle = BORDER;
  ctx.textAlign = 'center';
  ctx.fillText(`${ownerAvatar}  Album Milik ${ownerName}`, W / 2, y + 32);
  y += 50 + 16;

  for (const b of blocks) {
    // Author label
    ctx.font = '700 13px sans-serif';
    ctx.fillStyle = LABEL;
    ctx.textAlign = 'left';
    ctx.fillText(`${b.author}  •  ${b.label}`, PAD, y + 15);
    y += 22 + 8;

    if (b.type === 'text' && b.lines) {
      const bw = MAX_W;
      const bh = b.lines.length * 28 + 20;
      ctx.fillStyle = b.isFallback ? FALLBACK_BG : TEXT_BG;
      rr(ctx, PAD, y, bw, bh, 14);
      ctx.fill();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 3;
      rr(ctx, PAD, y, bw, bh, 14);
      ctx.stroke();
      ctx.font = '600 18px sans-serif';
      ctx.fillStyle = b.isFallback ? LABEL : BORDER;
      ctx.textAlign = 'left';
      let ly = y + 26;
      for (const line of b.lines) { ctx.fillText(line, PAD + 16, ly); ly += 28; }
      y += bh + GAP;
    } else if (b.type === 'image' && b.img) {
      const ix = PAD + (MAX_W - b.imgW!) / 2;
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 4;
      rr(ctx, ix - 4, y - 4, b.imgW! + 8, b.imgH! + 8, 12);
      ctx.stroke();
      ctx.drawImage(b.img, ix, y, b.imgW!, b.imgH!);
      y += b.imgH! + 12 + GAP;
    } else {
      // Empty placeholder
      ctx.fillStyle = '#fff8e1';
      rr(ctx, PAD, y, MAX_W, 40, 10);
      ctx.fill();
      ctx.setLineDash([8, 5]);
      ctx.strokeStyle = BORDER + '80';
      ctx.lineWidth = 2;
      rr(ctx, PAD, y, MAX_W, 40, 10);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = BORDER + '80';
      ctx.textAlign = 'center';
      ctx.fillText('[Tidak ada gambar]', W / 2, y + 26);
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
