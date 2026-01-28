import { SimplexNoise } from '../lib/noise';

export const presets = {
  calm: { particles: 600, length: 120, scale: 0.003, octaves: 1, curve: 1.5, stroke: 0.5, opacity: 0.3 },
  turbulent: { particles: 1500, length: 60, scale: 0.012, octaves: 4, curve: 4, stroke: 0.5, opacity: 0.25 },
  streams: { particles: 400, length: 200, scale: 0.004, octaves: 2, curve: 2, stroke: 0.75, opacity: 0.5 },
  vortex: { particles: 1000, length: 100, scale: 0.008, octaves: 3, curve: 6, stroke: 0.5, opacity: 0.35 },
  silk: { particles: 2000, length: 150, scale: 0.002, octaves: 1, curve: 1, stroke: 0.25, opacity: 0.2 },
};

export const controls = [
  { id: 'particles', label: 'Particle Count', min: 100, max: 3000, step: 1, defaultValue: 800 },
  { id: 'length', label: 'Line Length', min: 10, max: 300, step: 1, defaultValue: 80 },
  { id: 'scale', label: 'Noise Scale', min: 0.001, max: 0.02, step: 0.001, defaultValue: 0.005 },
  { id: 'octaves', label: 'Noise Octaves', min: 1, max: 6, step: 1, defaultValue: 2 },
  { id: 'curve', label: 'Curve Strength', min: 0.5, max: 8, step: 0.1, defaultValue: 2 },
  { id: 'stroke', label: 'Stroke Width', min: 0.25, max: 3, step: 0.25, defaultValue: 0.5 },
  { id: 'opacity', label: 'Opacity', min: 0.05, max: 1, step: 0.05, defaultValue: 0.4 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { particles, length, scale, octaves, curve, stroke, opacity, seed } = params;
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

  const paths = [];
  const random = new SimplexNoise(seed + 1).seededRandom(seed);

  for (let i = 0; i < particles; i++) {
    let x = random() * size;
    let y = random() * size;

    ctx.beginPath();
    ctx.moveTo(x, y);
    let pathData = `M${x.toFixed(2)},${y.toFixed(2)}`;

    for (let j = 0; j < length; j++) {
      const angle = noise.octaveNoise2D(x * scale, y * scale, octaves) * Math.PI * curve;
      x += Math.cos(angle);
      y += Math.sin(angle);
      if (x < 0 || x > size || y < 0 || y > size) break;
      ctx.lineTo(x, y);
      pathData += `L${x.toFixed(2)},${y.toFixed(2)}`;
    }

    ctx.stroke();
    paths.push(pathData);
  }

  ctx.globalAlpha = 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${paths.map(d => `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${stroke}" opacity="${opacity}" stroke-linecap="round"/>`).join('\n')}
  </svg>`;
}
