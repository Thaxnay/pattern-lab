import { SimplexNoise } from '../lib/noise';
import { chaikinSmooth, simplifyPath, getContourLines, connectEdges } from '../lib/utils';

export const presets = {
  organic: { levels: 10, scale: 0.003, octaves: 2, smooth: 6, warp: 50, stroke: 1.5, opacity: 0.8 },
  terrain: { levels: 20, scale: 0.006, octaves: 3, smooth: 2, warp: 0, stroke: 0.75, opacity: 0.5 },
  fine: { levels: 40, scale: 0.008, octaves: 4, smooth: 2, warp: 20, stroke: 0.35, opacity: 0.4 },
  bold: { levels: 12, scale: 0.004, octaves: 2, smooth: 4, warp: 30, stroke: 2, opacity: 0.9 },
};

export const controls = [
  { id: 'levels', label: 'Contour Levels', min: 5, max: 50, step: 1, defaultValue: 20 },
  { id: 'scale', label: 'Noise Scale', min: 0.002, max: 0.02, step: 0.001, defaultValue: 0.006 },
  { id: 'octaves', label: 'Noise Octaves', min: 1, max: 6, step: 1, defaultValue: 3 },
  { id: 'smooth', label: 'Smoothness', min: 1, max: 8, step: 1, defaultValue: 2 },
  { id: 'warp', label: 'Warp', min: 0, max: 100, step: 1, defaultValue: 0 },
  { id: 'stroke', label: 'Stroke Width', min: 0.25, max: 3, step: 0.25, defaultValue: 0.75 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.5 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { levels, scale, octaves, smooth: smoothIterations, warp: warpAmount, stroke, opacity, seed } = params;
  const { strokeColor, bgColor } = style;
  const size = canvas.width;

  const noise = new SimplexNoise(seed);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const resolution = 2;
  const cols = Math.ceil(size / resolution);
  const rows = Math.ceil(size / resolution);
  const heightMap = [];
  const warpScale = warpAmount / 100;

  for (let y = 0; y < rows; y++) {
    heightMap[y] = [];
    for (let x = 0; x < cols; x++) {
      const px = x * resolution * scale;
      const py = y * resolution * scale;
      if (warpScale > 0) {
        const warpX = noise.noise2D(px * 2, py * 2) * warpScale * 50;
        const warpY = noise.noise2D(px * 2 + 100, py * 2 + 100) * warpScale * 50;
        heightMap[y][x] = (noise.octaveNoise2D(px + warpX, py + warpY, octaves) + 1) / 2;
      } else {
        heightMap[y][x] = (noise.octaveNoise2D(px, py, octaves) + 1) / 2;
      }
    }
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = stroke;
  ctx.globalAlpha = opacity;

  const allConnectedPaths = [];

  for (let level = 0; level < levels; level++) {
    const threshold = level / levels;
    const levelEdges = [];

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const tl = heightMap[y][x] > threshold ? 1 : 0;
        const tr = heightMap[y][x + 1] > threshold ? 1 : 0;
        const br = heightMap[y + 1][x + 1] > threshold ? 1 : 0;
        const bl = heightMap[y + 1][x] > threshold ? 1 : 0;
        const state = tl * 8 + tr * 4 + br * 2 + bl;
        const px = x * resolution;
        const py = y * resolution;
        levelEdges.push(...getContourLines(state, px, py, resolution));
      }
    }

    const connectedPaths = connectEdges(levelEdges);

    for (const path of connectedPaths) {
      if (path.length < 2) continue;
      let smoothed = path;
      for (let i = 0; i < smoothIterations; i++) {
        smoothed = chaikinSmooth(smoothed, false);
      }
      const tolerance = smoothIterations > 4 ? 1.5 : 0.5;
      const simplified = simplifyPath(smoothed, tolerance);
      if (simplified.length >= 2) allConnectedPaths.push(simplified);
    }
  }

  for (const path of allConnectedPaths) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  const svgPaths = allConnectedPaths.map(path => {
    let d = `M${path[0].x.toFixed(1)},${path[0].y.toFixed(1)}`;
    for (let i = 1; i < path.length; i++) d += `L${path[i].x.toFixed(1)},${path[i].y.toFixed(1)}`;
    return d;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${svgPaths.map(d => `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${stroke}" opacity="${opacity}"/>`).join('\n')}
  </svg>`;
}
