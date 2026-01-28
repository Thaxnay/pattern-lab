import { SimplexNoise } from '../lib/noise';

export const presets = {
  smooth: { spacing: 24, length: 20, direction: 45, variation: 15, scale: 0.003, stroke: 1.5, opacity: 0.9 },
  rain: { spacing: 20, length: 28, direction: 70, variation: 10, scale: 0.002, stroke: 1, opacity: 0.85 },
  wave: { spacing: 26, length: 22, direction: 30, variation: 25, scale: 0.004, stroke: 1.5, opacity: 0.9 },
  chaotic: { spacing: 20, length: 18, direction: 0, variation: 60, scale: 0.012, stroke: 1.25, opacity: 0.8 },
};

export const controls = [
  { id: 'spacing', label: 'Grid Spacing', min: 8, max: 60, step: 1, defaultValue: 24 },
  { id: 'length', label: 'Line Length', min: 5, max: 50, step: 1, defaultValue: 20 },
  { id: 'direction', label: 'Direction', min: 0, max: 360, step: 1, defaultValue: 45, suffix: '°' },
  { id: 'variation', label: 'Variation', min: 0, max: 60, step: 1, defaultValue: 15, suffix: '°' },
  { id: 'scale', label: 'Flow Scale', min: 0.001, max: 0.02, step: 0.001, defaultValue: 0.003 },
  { id: 'stroke', label: 'Stroke Width', min: 0.5, max: 4, step: 0.25, defaultValue: 1.5 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.9 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { spacing, length: lineLength, direction, variation, scale, stroke, opacity, seed } = params;
  const { strokeColor, bgColor } = style;
  const size = canvas.width;

  const noise = new SimplexNoise(seed);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = stroke;
  ctx.globalAlpha = opacity;
  ctx.lineCap = 'round';

  const lines = [];
  const halfLen = lineLength / 2;
  const baseAngle = direction * Math.PI / 180;
  const variationRad = variation * Math.PI / 180;

  for (let y = spacing / 2; y < size; y += spacing) {
    for (let x = spacing / 2; x < size; x += spacing) {
      const noiseVal = noise.noise2D(x * scale, y * scale);
      const angle = baseAngle + (noiseVal * variationRad);
      const dx = Math.cos(angle) * halfLen;
      const dy = Math.sin(angle) * halfLen;
      const x1 = x - dx, y1 = y - dy;
      const x2 = x + dx, y2 = y + dy;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      lines.push({ x1, y1, x2, y2 });
    }
  }

  ctx.globalAlpha = 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${lines.map(l => `<line x1="${l.x1.toFixed(1)}" y1="${l.y1.toFixed(1)}" x2="${l.x2.toFixed(1)}" y2="${l.y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${stroke}" stroke-linecap="round" opacity="${opacity}"/>`).join('\n')}
  </svg>`;
}
