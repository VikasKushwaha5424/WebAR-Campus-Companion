export function createTextSprite(text, { color = '#ffffff', fontSize = 48, fontFamily = 'Arial, sans-serif', padding = 16 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + padding * 2);
  const h = Math.ceil(fontSize * 1.4 + padding * 2);
  canvas.width = w;
  canvas.height = h;
  canvas.dataset.width = w;
  canvas.dataset.height = h;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2);
  return canvas.toDataURL();
}
