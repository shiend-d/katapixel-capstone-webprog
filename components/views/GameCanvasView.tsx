'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Timer, Pencil, Eraser, Square, Circle, Triangle, Minus, PaintBucket, Undo2, Redo2, Trash2, Check } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useGameStore } from '@/lib/gameStore';
import { CURSOR_PENCIL, CURSOR_ERASER } from '@/lib/cursors';
import { drawTriangle } from '@/lib/canvasShapes';

type Tool = 'pencil' | 'eraser' | 'rect' | 'circle' | 'triangle' | 'line' | 'fill';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f59e0b',
  '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
  '#6366f1', '#a855f7', '#ec4899', '#92400e',
];

const TOOLS: { id: Tool; icon: React.ElementType; label: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pensil' },
  { id: 'eraser', icon: Eraser, label: 'Hapus' },
  { id: 'rect', icon: Square, label: 'Kotak' },
  { id: 'circle', icon: Circle, label: 'Lingkaran' },
  { id: 'triangle', icon: Triangle, label: 'Segitiga' },
  { id: 'line', icon: Minus, label: 'Garis' },
  { id: 'fill', icon: PaintBucket, label: 'Isi' },
];

export default function GameCanvasView() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const hasSubmitted = useGameStore((s) => s.hasSubmitted);
  const roomData = useGameStore((s) => s.roomData);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const isEraser = tool === 'eraser';

  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const CANVAS_W = 800;
  const CANVAS_H = 500;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = CANVAS_W + 'px';
    canvas.style.height = 'auto';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveToUndoStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-submit saat timer habis (mencegah double submission dengan hasSubmitted)
  useEffect(() => {
    if (timeLeft === 0 && !hasSubmitted && gamePhase?.expectedInput === 'CANVAS') {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, hasSubmitted, gamePhase]);

  function getCtx() { return canvasRef.current?.getContext('2d') ?? null; }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else { clientX = e.clientX; clientY = e.clientY; }
    return { x: (clientX - rect.left) * (CANVAS_W / rect.width), y: (clientY - rect.top) * (CANVAS_H / rect.height) };
  }

  function saveToUndoStack() {
    const ctx = getCtx(); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    undoStack.current.push(ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr));
    if (undoStack.current.length > 21) undoStack.current.shift();
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
  }

  function undo() {
    if (undoStack.current.length <= 1) return;
    const ctx = getCtx(); if (!ctx) return;
    redoStack.current.push(undoStack.current.pop()!);
    ctx.putImageData(undoStack.current[undoStack.current.length - 1], 0, 0);
    setUndoCount(undoStack.current.length); setRedoCount(redoStack.current.length);
  }

  function redo() {
    if (redoStack.current.length === 0) return;
    const ctx = getCtx(); if (!ctx) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    ctx.putImageData(next, 0, 0);
    setUndoCount(undoStack.current.length); setRedoCount(redoStack.current.length);
  }

  function clearCanvas() {
    const ctx = getCtx(); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
    ctx.restore(); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveToUndoStack();
  }

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = CANVAS_W * dpr, h = CANVAS_H * dpr;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const sx = Math.round(startX * dpr), sy = Math.round(startY * dpr);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;
    const startIdx = (sy * w + sx) * 4;
    const tR = data[startIdx], tG = data[startIdx+1], tB = data[startIdx+2], tA = data[startIdx+3];
    const tc = document.createElement('canvas'); tc.width=1; tc.height=1;
    const tcx = tc.getContext('2d')!; tcx.fillStyle=fillColor; tcx.fillRect(0,0,1,1);
    const fd = tcx.getImageData(0,0,1,1).data;
    const fR=fd[0], fG=fd[1], fB=fd[2], fA=fd[3];
    if (tR===fR && tG===fG && tB===fB && tA===fA) return;
    const tol = 30;
    const matches = (idx: number) => Math.abs(data[idx]-tR)<=tol && Math.abs(data[idx+1]-tG)<=tol && Math.abs(data[idx+2]-tB)<=tol && Math.abs(data[idx+3]-tA)<=tol;
    const queue = [sx, sy]; const visited = new Uint8Array(w * h);
    while (queue.length > 0) {
      const cy = queue.pop()!, cx = queue.pop()!;
      const key = cy * w + cx;
      if (visited[key]) continue; visited[key] = 1;
      const idx = key * 4;
      if (!matches(idx)) continue;
      data[idx]=fR; data[idx+1]=fG; data[idx+2]=fB; data[idx+3]=fA;
      if (cx>0) queue.push(cx-1,cy); if (cx<w-1) queue.push(cx+1,cy);
      if (cy>0) queue.push(cx,cy-1); if (cy<h-1) queue.push(cx,cy+1);
    }
    ctx.putImageData(imageData, 0, 0);
    saveToUndoStack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e); const ctx = getCtx(); if (!ctx) return;
    if (tool === 'fill') { floodFill(pos.x, pos.y, color); return; }
    isDrawing.current = true; startPos.current = pos;
    if (tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
    if (tool === 'rect' || tool === 'circle' || tool === 'triangle' || tool === 'line') {
      const dpr = window.devicePixelRatio || 1;
      snapshot.current = ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
    }
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return;
    const pos = getPos(e); const ctx = getCtx(); if (!ctx) return;
    if (tool === 'pencil' || tool === 'eraser') { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
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
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false; snapshot.current = null; saveToUndoStack();
  }

  function handleSubmit() {
    const canvas = canvasRef.current; if (!canvas || !roomData) return;
    const exp = document.createElement('canvas'); exp.width = CANVAS_W; exp.height = CANVAS_H;
    exp.getContext('2d')!.drawImage(canvas, 0, 0, CANVAS_W, CANVAS_H);
    getSocket().emit('submit_turn', { roomId: roomData.roomId, type: 'IMAGE', content: exp.toDataURL('image/png') });
    useGameStore.getState().setHasSubmitted(true);
  }

  if (!gamePhase || !roomData) return <div className="flex min-h-screen items-center justify-center"><p className="text-[#4a1f2e]">Loading...</p></div>;

  if (hasSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="gartic-panel bg-[#fff5e1] p-8 text-center">
          <div className="mb-3 text-4xl">⏳</div>
          <h2 className="text-xl text-[#4a1f2e]" style={{ fontWeight: 800 }}>Menunggu pemain lain...</h2>
          <div className="gartic-btn mt-4 inline-flex items-center gap-2 bg-[#ffe066] px-4 py-2 text-[#4a1f2e]" style={{ fontWeight: 800 }}>
            <Timer className="h-4 w-4" />
            <span style={{ fontSize: '1.25rem' }}>{timeLeft}s</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="gartic-btn bg-[#ffe066] px-4 py-2 text-[#4a1f2e]" style={{ fontWeight: 800 }}>
            {gamePhase.roundNumber}/{gamePhase.totalRounds}
          </div>
          <div className="gartic-panel bg-gradient-to-b from-[#ff8a5b] to-[#ff5e5e] px-5 py-1.5">
            <span className="text-white" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
              KATA<span className="text-[#9a3556]">PIXEL</span>
            </span>
          </div>
          <div className={`gartic-btn flex items-center gap-2 px-4 py-2 ${timeLeft <= 10 ? 'bg-[#ff5e5e] text-white' : 'bg-[#ffe066] text-[#4a1f2e]'}`}
               style={{ fontWeight: 800 }}>
            <Timer className="h-4 w-4" />
            <span style={{ fontSize: '1.25rem' }}>{timeLeft}s</span>
          </div>
        </div>

        {/* Prompt */}
        {gamePhase.referenceData && (
          <div className="gartic-panel mb-3 bg-gradient-to-b from-[#d63384] to-[#9a2553] p-3 text-center">
            <div className="text-white uppercase" style={{ fontWeight: 800, letterSpacing: '0.1em', textShadow: '1px 1px 0 #4a1f2e' }}>
              ✏️ Gambarkan: &quot;{gamePhase.referenceData.content}&quot;
            </div>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          {/* Canvas */}
          <div className="gartic-panel bg-white p-3">
            <canvas ref={canvasRef}
              className="halftone w-full rounded-xl border-[3px] border-[#4a1f2e] bg-[#fff8e1]"
              style={{ touchAction: 'none', cursor: isEraser ? CURSOR_ERASER : CURSOR_PENCIL, aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
              onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
            />
          </div>

          {/* Toolbox sidebar */}
          <div className="space-y-3">
            {/* Colors */}
            <div className="gartic-panel bg-[#fff5e1] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#9a3556]" style={{ fontWeight: 700 }}>Warna</span>
                <div className="h-5 w-5 rounded border-2 border-[#4a1f2e]" style={{ background: color }} />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`aspect-square rounded-md border-2 transition hover:scale-110 ${color === c ? 'border-[#ffe066] ring-2 ring-[#ffe066]' : 'border-[#4a1f2e]'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Brush Size */}
            <div className="gartic-panel bg-[#fff5e1] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#9a3556]" style={{ fontWeight: 700 }}>Ukuran</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#4a1f2e] bg-white">
                  <div className="rounded-full" style={{ width: `${Math.min(brushSize, 30)}px`, height: `${Math.min(brushSize, 30)}px`, background: color }} />
                </div>
              </div>
              <input type="range" min={1} max={40} value={brushSize}
                onChange={(e) => setBrushSize(+e.target.value)} className="w-full accent-[#ffe066]" />
            </div>

            {/* Tools */}
            <div className="gartic-panel bg-[#fff5e1] p-3">
              <div className="mb-2 text-xs uppercase tracking-wider text-[#9a3556]" style={{ fontWeight: 700 }}>Alat</div>
              <div className="grid grid-cols-3 gap-1.5">
                {TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setTool(t.id)}
                      className={`flex aspect-square items-center justify-center rounded-lg border-[3px] border-[#4a1f2e] transition ${
                        tool === t.id ? 'bg-[#ffe066] text-[#4a1f2e]' : 'bg-white text-[#4a1f2e] hover:bg-[#ffe0b8]'
                      }`}>
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Undo / Redo / Clear */}
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={undo} disabled={undoCount <= 1}
                className="gartic-btn flex aspect-square items-center justify-center bg-white text-[#4a1f2e]">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} disabled={redoCount === 0}
                className="gartic-btn flex aspect-square items-center justify-center bg-white text-[#4a1f2e]">
                <Redo2 className="h-4 w-4" />
              </button>
              <button onClick={clearCanvas}
                className="gartic-btn flex aspect-square items-center justify-center bg-[#ff5e5e] text-white">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit}
              className="gartic-btn flex w-full items-center justify-center gap-2 bg-gradient-to-b from-[#7bd389] to-[#3fb56b] py-3 text-white"
              style={{ fontWeight: 800, textShadow: '1px 1px 0 #4a1f2e', letterSpacing: '0.1em' }}>
              <Check className="h-5 w-5" /> DONE!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
