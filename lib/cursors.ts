// lib/cursors.ts — Inline SVG cursor definitions (Base64 encoded)

// Pencil cursor SVG
const PENCIL_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M 2 28 L 8 20 L 20 8 Q 22 6 24 8 L 26 10 Q 28 12 26 14 L 14 26 L 6 30 Z" fill="#000000" stroke="#000000" stroke-width="0.5" stroke-linejoin="round"/>
  <path d="M 2 28 L 8 20 L 20 8 Q 22 6 24 8 L 26 10" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// Eraser cursor SVG
const ERASER_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="8" width="16" height="16" fill="#ffffff" stroke="#000000" stroke-width="1.5" rx="1"/>
  <path d="M 18 8 L 22 4 Q 23 3 24 4 L 28 8 Q 29 9 28 10 L 24 14 L 18 8" fill="#000000" stroke="#000000" stroke-width="0.5" stroke-linejoin="round"/>
</svg>
`;

// Helper function to convert SVG to Base64 Data URL
function svgToDataUrl(svg: string): string {
  const encoded = btoa(svg.trim());
  return `data:image/svg+xml;base64,${encoded}`;
}

export const CURSOR_PENCIL = `url('${svgToDataUrl(PENCIL_SVG)}') 0 24, crosshair`;
export const CURSOR_ERASER = `url('${svgToDataUrl(ERASER_SVG)}') 8 8, crosshair`;
