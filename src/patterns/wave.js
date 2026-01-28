import { SimplexNoise } from '../lib/noise';

export const presets = {
  ripple: { sources: 1, frequency: 30, lines: 60, amplitude: 8, decay: 0.002, stroke: 0.5, opacity: 0.7 },
  interference: { sources: 2, frequency: 25, lines: 80, amplitude: 10, decay: 0.003, stroke: 0.5, opacity: 0.6 },
  dense: { sources: 3, frequency: 50, lines: 150, amplitude: 5, decay: 0.004, stroke: 0.25, opacity: 0.4 },
  sparse: { sources: 2, frequency: 15, lines: 40, amplitude: 15, decay: 0.002, stroke: 1, opacity: 0.8 },
  chaos: { sources: 5, frequency: 35, lines: 100, amplitude: 12, decay: 0.005, stroke: 0.5, opacity: 0.5 },
};

export const controls = [
  { id: 'sources', label: 'Wave Sources', min: 1, max: 6, step: 1, defaultValue: 2 },
  { id: 'frequency', label: 'Wave Frequency', min: 5, max: 80, step: 1, defaultValue: 25 },
  { id: 'lines', label: 'Line Count', min: 20, max: 200, step: 1, defaultValue: 80 },
  { id: 'amplitude', label: 'Amplitude', min: 1, max: 30, step: 1, defaultValue: 10 },
  { id: 'decay', label: 'Decay', min: 0.001, max: 0.01, step: 0.001, defaultValue: 0.003 },
  { id: 'stroke', label: 'Stroke Width', min: 0.25, max: 2, step: 0.25, defaultValue: 0.5 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.6 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { sources: numSources, frequency, lines: numLines, amplitude, decay, stroke, opacity, seed } = params;
  const { strokeColor, bgColor } = style;
  const size = canvas.width;

  const random = new SimplexNoise(seed).seededRandom(seed);
  const sourcePoints = [];
  for (let i = 0; i < numSources; i++) {
    sourcePoints.push({ x: random() * size, y: random() * size });
  }

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = stroke;
  ctx.globalAlpha = opacity;

  const paths = [];
  const spacing = size / numLines;

  for (let i = 0; i < numLines; i++) {
    const baseY = i * spacing;
    let pathData = '';
    ctx.beginPath();

    for (let x = 0; x <= size; x += 2) {
      let totalDisplacement = 0;
      for (const source of sourcePoints) {
        const dx = x - source.x;
        const dy = baseY - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        totalDisplacement += Math.sin(dist * decay * frequency) * amplitude * Math.exp(-dist * decay * 0.5);
      }
      const y = baseY + totalDisplacement;
      if (x === 0) {
        ctx.moveTo(x, y);
        pathData = `M${x.toFixed(2)},${y.toFixed(2)}`;
      } else {
        ctx.lineTo(x, y);
        pathData += `L${x.toFixed(2)},${y.toFixed(2)}`;
      }
    }

    ctx.stroke();
    paths.push(pathData);
  }

  ctx.globalAlpha = 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${paths.map(d => `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${stroke}" opacity="${opacity}"/>`).join('\n')}
  </svg>`;
}
