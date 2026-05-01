// lib/canvasShapes.ts — Shape drawing utilities for Canvas

/**
 * Draws a triangle based on start and current positions
 * Triangle is isosceles with apex at (startX, startY) and base along the bottom
 */
export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  color: string,
  lineWidth: number
) {
  const width = currentX - startX;
  const height = currentY - startY;

  // Calculate the three vertices of an isosceles triangle
  const apexX = startX + width / 2;
  const apexY = startY;
  const leftX = startX;
  const leftY = startY + height;
  const rightX = startX + width;
  const rightY = startY + height;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(rightX, rightY);
  ctx.lineTo(leftX, leftY);
  ctx.closePath();
  ctx.stroke();
}

/**
 * Draws a rectangle
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
}

/**
 * Draws a circle/ellipse
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  color: string,
  lineWidth: number
) {
  const width = currentX - startX;
  const height = currentY - startY;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(startX + width / 2, startY + height / 2, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draws a line
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(currentX, currentY);
  ctx.stroke();
}
