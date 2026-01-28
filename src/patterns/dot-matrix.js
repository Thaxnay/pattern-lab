import { SimplexNoise } from '../lib/noise';

export const presets = {
  halftone: { grid: 25, maxsize: 10, minsize: 0.5, scale: 0.008, opacity: 0.7 },
  fine: { grid: 50, maxsize: 4, minsize: 0.25, scale: 0.006, opacity: 0.6 },
  coarse: { grid: 15, maxsize: 15, minsize: 1, scale: 0.005, opacity: 0.8 },
  gradient: { grid: 30, maxsize: 8, minsize: 0, scale: 0.003, opacity: 0.75 },
};

export const controls = [
  { id: 'grid', label: 'Grid Size', min: 10, max: 80, step: 1, defaultValue: 30 },
  { id: 'maxsize', label: 'Max Dot Size', min: 2, max: 20, step: 1, defaultValue: 8 },
  { id: 'minsize', label: 'Min Dot Size', min: 0, max: 5, step: 0.5, defaultValue: 0.5 },
  { id: 'scale', label: 'Noise Scale', min: 0.002, max: 0.02, step: 0.001, defaultValue: 0.008 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.7 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { grid: gridSize, maxsize: maxSize, minsize: minSize, scale, opacity, seed } = params;
  const { strokeColor, bgColor } = style;
  const size = canvas.width;

  const noise = new SimplexNoise(seed);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = strokeColor;
  ctx.globalAlpha = opacity;

  const circles = [];
  const spacing = size / gridSize;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const px = (x + 0.5) * spacing;
      const py = (y + 0.5) * spacing;
      const noiseVal = (noise.noise2D(px * scale, py * scale) + 1) / 2;
      const radius = minSize + noiseVal * (maxSize - minSize);

      if (radius > 0.1) {
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        circles.push({ cx: px.toFixed(2), cy: py.toFixed(2), r: radius.toFixed(2) });
      }
    }
  }

  ctx.globalAlpha = 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${circles.map(c => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${strokeColor}" opacity="${opacity}"/>`).join('\n')}
  </svg>`;
}
