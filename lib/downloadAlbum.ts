// lib/downloadAlbum.ts — Render album entries to a Canvas and download as PNG
import type { Entry } from './types';

const BG_COLOR = '#fff5e1';
const BORDER_COLOR = '#4a1f2e';
const LABEL_COLOR = '#9a3556';
const TEXT_BG = '#ffe066';
const FALLBACK_BG = '#ffe0b8';
const PADDING = 32;
const ENTRY_GAP = 24;
const IMG_MAX_W = 640;
const IMG_MAX_H = 400;
const FONT = '600 18px "Nunito", sans-serif';
const FONT_SMALL = '700 13px "Nunito", sans-serif';
const HEADER_FONT = '800 28px "Nunito", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Render the showcase album entries directly to a canvas and download as PNG.
 * This avoids html2canvas CSS compatibility issues entirely.
 */
export async function downloadAlbumAsPng(
  ownerName: string,
  ownerAvatar: string,
  entries: Entry[],
): Promise<void> {
  // --- Measure pass: calculate total height ---
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = IMG_MAX_W + PADDING * 2;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.font = FONT;

  let totalHeight = PADDING; // top padding
  totalHeight += 48; // header
  totalHeight += 16; // gap after header

  interface RenderedEntry {
    type: string;
    label: string;
    authorName: string;
    // For text
    lines?: string[];
    textH?: number;
    // For image
    img?: HTMLImageElement;
    drawW?: number;
    drawH?: number;
    isFallback?: boolean;
  }

  const rendered: RenderedEntry[] = [];

  for (const entry of entries) {
    const authorName = entry.authorName || '?';
    const typeLabel = (entry.type === 'TEXT' || entry.type === 'FALLBACK_TEXT') ? 'TEKS' : (entry.type === 'EMPTY_CANVAS' ? 'KOSONG' : 'GAMBAR');
    const labelH = 20; // label row height

    if (entry.type === 'TEXT' || entry.type === 'FALLBACK_TEXT') {
      tempCtx.font = FONT;
      const lines = wrapText(tempCtx, entry.content || '[Tidak Ada Tebakan]', IMG_MAX_W - 32);
      const textH = lines.length * 26 + 20; // line height + padding
      totalHeight += labelH + 8 + textH + ENTRY_GAP;
      rendered.push({ type: entry.type, label: typeLabel, authorName, lines, textH, isFallback: entry.type === 'FALLBACK_TEXT' });
    } else if (entry.type === 'IMAGE' && entry.content) {
      try {
        const img = await loadImage(entry.content);
        const aspect = img.width / img.height;
        let drawW = Math.min(img.width, IMG_MAX_W);
        let drawH = drawW / aspect;
        if (drawH > IMG_MAX_H) { drawH = IMG_MAX_H; drawW = drawH * aspect; }
        totalHeight += labelH + 8 + drawH + 16 + ENTRY_GAP;
        rendered.push({ type: entry.type, label: typeLabel, authorName, img, drawW, drawH });
      } catch {
        totalHeight += labelH + 8 + 60 + ENTRY_GAP;
        rendered.push({ type: 'EMPTY_CANVAS', label: 'KOSONG', authorName, textH: 60 });
      }
    } else {
      // EMPTY_CANVAS
      totalHeight += labelH + 8 + 60 + ENTRY_GAP;
      rendered.push({ type: entry.type, label: typeLabel, authorName, textH: 60 });
    }
  }

  totalHeight += PADDING; // bottom padding

  // --- Draw pass ---
  const canvas = document.createElement('canvas');
  const width = IMG_MAX_W + PADDING * 2;
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, totalHeight);

  // Border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, width - 6, totalHeight - 6);

  let y = PADDING;

  // Header
  ctx.font = HEADER_FONT;
  ctx.fillStyle = BORDER_COLOR;
  ctx.textAlign = 'center';
  ctx.fillText(`${ownerAvatar} Album Milik ${ownerName}`, width / 2, y + 32);
  y += 48 + 16;

  // Entries
  for (const r of rendered) {
    // Author label
    ctx.font = FONT_SMALL;
    ctx.fillStyle = LABEL_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(`${r.authorName}  •  ${r.label}`, PADDING, y + 14);
    y += 20 + 8;

    if ((r.type === 'TEXT' || r.type === 'FALLBACK_TEXT') && r.lines) {
      // Text bubble
      const bubbleW = IMG_MAX_W;
      const bubbleH = r.textH!;
      const bx = PADDING;
      ctx.fillStyle = r.isFallback ? FALLBACK_BG : TEXT_BG;
      roundRect(ctx, bx, y, bubbleW, bubbleH, 14);
      ctx.fill();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 3;
      roundRect(ctx, bx, y, bubbleW, bubbleH, 14);
      ctx.stroke();
      // Text lines
      ctx.font = FONT;
      ctx.fillStyle = r.isFallback ? LABEL_COLOR : BORDER_COLOR;
      ctx.textAlign = 'left';
      let ly = y + 26;
      for (const line of r.lines) {
        ctx.fillText(line, bx + 16, ly);
        ly += 26;
      }
      y += bubbleH + ENTRY_GAP;
    } else if (r.type === 'IMAGE' && r.img) {
      // Draw image centered
      const ix = PADDING + (IMG_MAX_W - r.drawW!) / 2;
      // Image border
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 4;
      roundRect(ctx, ix - 4, y - 4, r.drawW! + 8, r.drawH! + 8, 12);
      ctx.stroke();
      // Image
      ctx.drawImage(r.img, ix, y, r.drawW!, r.drawH!);
      y += r.drawH! + 16 + ENTRY_GAP;
    } else {
      // Empty canvas placeholder
      ctx.fillStyle = '#fff8e1';
      roundRect(ctx, PADDING, y, IMG_MAX_W, 50, 12);
      ctx.fill();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = BORDER_COLOR + '80';
      ctx.lineWidth = 3;
      roundRect(ctx, PADDING, y, IMG_MAX_W, 50, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = FONT;
      ctx.fillStyle = BORDER_COLOR + '80';
      ctx.textAlign = 'center';
      ctx.fillText('[Tidak ada gambar]', width / 2, y + 32);
      y += 60 + ENTRY_GAP;
    }
  }

  // Watermark
  ctx.font = '600 12px "Nunito", sans-serif';
  ctx.fillStyle = LABEL_COLOR + '80';
  ctx.textAlign = 'right';
  ctx.fillText('Katapixel — The Pesan Berantai Game', width - PADDING, totalHeight - 14);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generateAlbumFileName(ownerName);
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateAlbumFileName(ownerName: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `Katapixel_Album_${ownerName}_${timestamp}.png`;
}
