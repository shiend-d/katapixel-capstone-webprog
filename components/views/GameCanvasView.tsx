'use client';
// View 4: Game Canvas / Drawing Phase
import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../lib/gameStore';

type Tool = 'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'fill';

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#ff8800', '#ffff00', '#00cc00',
  '#0088ff', '#0000ff', '#8800ff', '#ff00ff', '#884400', '#888888',
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

  // Drawing state refs (avoid re-renders during draw)
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapshot = useRef<ImageData | null>(null);
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);

  const CANVAS_W = 800;
  const CANVAS_H = 600;

  // ── Init canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = CANVAS_W + 'px';
    canvas.style.height = CANVAS_H + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Save initial state
    saveToUndoStack();
  }, []);

  function getCtx() {
    return canvasRef.current?.getContext('2d') ?? null;
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (CANVAS_W / rect.width),
      y: (clientY - rect.top) * (CANVAS_H / rect.height),
    };
  }

  function saveToUndoStack() {
    const ctx = getCtx();
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const data = ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
    undoStack.current.push(data);
    if (undoStack.current.length > 21) undoStack.current.shift();
    redoStack.current = [];
    setUndoCount(undoStack.current.length);
    setRedoCount(0);
  }

  function undo() {
    if (undoStack.current.length <= 1) return;
    const ctx = getCtx();
    if (!ctx) return;
    redoStack.current.push(undoStack.current.pop()!);
    const prev = undoStack.current[undoStack.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
  }

  function redo() {
    if (redoStack.current.length === 0) return;
    const ctx = getCtx();
    if (!ctx) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    ctx.putImageData(next, 0, 0);
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
  }

  function clearCanvas() {
    const ctx = getCtx();
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveToUndoStack();
  }

  // ── Flood fill (BFS) ──────────────────────────────────────────────────
  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = CANVAS_W * dpr;
    const h = CANVAS_H * dpr;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const sx = Math.round(startX * dpr);
    const sy = Math.round(startY * dpr);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

    const startIdx = (sy * w + sx) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    // Parse fill color
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0], fillG = fillData[1], fillB = fillData[2], fillA = fillData[3];

    // Don't fill if same color
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const tolerance = 30;
    function matches(idx: number) {
      return (
        Math.abs(data[idx] - targetR) <= tolerance &&
        Math.abs(data[idx + 1] - targetG) <= tolerance &&
        Math.abs(data[idx + 2] - targetB) <= tolerance &&
        Math.abs(data[idx + 3] - targetA) <= tolerance
      );
    }

    const queue: number[] = [sx, sy];
    const visited = new Uint8Array(w * h);

    while (queue.length > 0) {
      const cy = queue.pop()!;
      const cx = queue.pop()!;
      const key = cy * w + cx;
      if (visited[key]) continue;
      visited[key] = 1;
      const idx = key * 4;
      if (!matches(idx)) continue;
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;
      if (cx > 0) queue.push(cx - 1, cy);
      if (cx < w - 1) queue.push(cx + 1, cy);
      if (cy > 0) queue.push(cx, cy - 1);
      if (cy < h - 1) queue.push(cx, cy + 1);
    }

    ctx.putImageData(imageData, 0, 0);
    saveToUndoStack();
  }, []);

  // ── Draw handlers ─────────────────────────────────────────────────────
  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      return;
    }

    isDrawing.current = true;
    startPos.current = pos;

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    if (tool === 'rect' || tool === 'circle' || tool === 'line') {
      const dpr = window.devicePixelRatio || 1;
      snapshot.current = ctx.getImageData(0, 0, CANVAS_W * dpr, CANVAS_H * dpr);
    }
  }

  function handlePointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return;
    const pos = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    if ((tool === 'rect' || tool === 'circle' || tool === 'line') && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      const sx = startPos.current.x, sy = startPos.current.y;
      const w = pos.x - sx, h = pos.y - sy;

      if (tool === 'rect') {
        ctx.strokeRect(sx, sy, w, h);
      } else if (tool === 'circle') {
        ctx.beginPath();
        const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2;
        ctx.ellipse(sx + w / 2, sy + h / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    snapshot.current = null;
    saveToUndoStack();
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  function handleSubmit() {
    const canvas = canvasRef.current;
    if (!canvas || !roomData) return;
    // Export at logical resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_W;
    exportCanvas.height = CANVAS_H;
    const exportCtx = exportCanvas.getContext('2d')!;
    exportCtx.drawImage(canvas, 0, 0, CANVAS_W, CANVAS_H);
    const dataUrl = exportCanvas.toDataURL('image/png');

    getSocket().emit('submit_turn', {
      roomId: roomData.roomId,
      type: 'IMAGE',
      content: dataUrl,
    });
    useGameStore.getState().setHasSubmitted(true);
  }

  if (!gamePhase || !roomData) return <p>Loading...</p>;

  if (hasSubmitted) {
    return (
      <div>
        <h2>⏳ Menunggu pemain lain selesai...</h2>
        <p>Waktu tersisa: {timeLeft} detik</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header>
        <h1>
          🎨 Ronde {gamePhase.roundNumber}/{gamePhase.totalRounds}
          {' — '}
          <span style={{ color: timeLeft <= 10 ? 'red' : 'inherit', fontSize: 28 }}>
            ⏱ {timeLeft}s
          </span>
        </h1>
      </header>

      {/* Reference */}
      {gamePhase.referenceData && (
        <section>
          <h2>
            Gambarkan: &quot;{
              gamePhase.referenceData.type === 'FALLBACK_TEXT'
                ? <em>{gamePhase.referenceData.content}</em>
                : gamePhase.referenceData.content
            }&quot;
          </h2>
        </section>
      )}
      <hr />

      {/* Canvas */}
      <div>
        <canvas
          ref={canvasRef}
          style={{ border: '2px solid black', cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Toolbox */}
      <div style={{ marginTop: 8 }}>
        {/* Tools */}
        <div>
          <strong>Alat: </strong>
          {([
            ['pencil', '✏️ Pensil'],
            ['eraser', '🧹 Hapus'],
            ['rect', '⬜ Kotak'],
            ['circle', '⭕ Lingkaran'],
            ['line', '📏 Garis'],
            ['fill', '🪣 Isi Warna'],
          ] as [Tool, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              style={{ fontWeight: tool === t ? 'bold' : 'normal', margin: 2, border: tool === t ? '2px solid blue' : undefined }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div style={{ marginTop: 4 }}>
          <strong>Warna: </strong>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 24, height: 24, backgroundColor: c,
                border: color === c ? '3px solid blue' : '1px solid gray',
                margin: 1, cursor: 'pointer',
              }}
            />
          ))}
          <span style={{ marginLeft: 8 }}>
            Saat ini: <span style={{ display: 'inline-block', width: 20, height: 20, backgroundColor: color, border: '1px solid black', verticalAlign: 'middle' }} />
          </span>
        </div>

        {/* Brush Size */}
        <div style={{ marginTop: 4 }}>
          <strong>Ukuran Kuas: </strong>
          <input
            type="range"
            min={1}
            max={30}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
          <span> {brushSize}px</span>
        </div>

        {/* Undo/Redo/Clear */}
        <div style={{ marginTop: 4 }}>
          <button onClick={undo} disabled={undoCount <= 1}>↩️ Undo</button>
          <button onClick={redo} disabled={redoCount === 0}>↪️ Redo</button>
          <button onClick={clearCanvas}>🗑️ Hapus Semua</button>
        </div>
      </div>
      <hr />

      {/* Submit */}
      <button onClick={handleSubmit} style={{ fontSize: 18 }}>
        ✅ Selesai Menggambar
      </button>
    </div>
  );
}
