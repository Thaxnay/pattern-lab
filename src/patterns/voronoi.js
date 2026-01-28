import { SimplexNoise } from '../lib/noise';
import { chaikinSmooth, simplifyPath, lloydRelax, applyMorphologicalSmoothing, connectEdges } from '../lib/utils';

export const presets = {
  cells: { cells: 80, gap: 4, radius: 3, relax: 1 },
  giraffe: { cells: 40, gap: 12, radius: 8, relax: 3 },
  organic: { cells: 60, gap: 8, radius: 5, relax: 2 },
  foam: { cells: 150, gap: 3, radius: 2, relax: 0 },
};

export const controls = [
  { id: 'cells', label: 'Cell Count', min: 10, max: 300, step: 1, defaultValue: 50 },
  { id: 'gap', label: 'Gap Size', min: 0, max: 30, step: 1, defaultValue: 8 },
  { id: 'radius', label: 'Corner Radius', min: 0, max: 20, step: 1, defaultValue: 5 },
  { id: 'relax', label: 'Relaxation', min: 0, max: 5, step: 1, defaultValue: 2 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { cells: numCells, gap: gapSize, radius: cornerRadius, relax: relaxIterations, seed } = params;
  const { strokeColor: fillColor, bgColor } = style;
  const size = canvas.width;

  const random = new SimplexNoise(seed).seededRandom(seed);
  let points = [];
  for (let i = 0; i < numCells; i++) {
    points.push({ x: random() * size, y: random() * size });
  }

  for (let iter = 0; iter < relaxIterations; iter++) {
    points = lloydRelax(points, size);
  }

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const gapThreshold = gapSize * gapSize * 4;
  const cellMask = new Uint8Array(size * size);
  const cellOwner = new Int16Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let minDist = Infinity;
      let secondDist = Infinity;
      let nearest = 0;

      for (let i = 0; i < points.length; i++) {
        const dx = x - points[i].x;
        const dy = y - points[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          secondDist = minDist;
          minDist = dist;
          nearest = i;
        } else if (dist < secondDist) {
          secondDist = dist;
        }
      }

      const idx = y * size + x;
      cellOwner[idx] = nearest;
      cellMask[idx] = (secondDist - minDist > gapThreshold) ? 1 : 0;
    }
  }

  let processedMask = cellMask;
  if (cornerRadius > 0) {
    processedMask = applyMorphologicalSmoothing(cellMask, size, cornerRadius);
  }

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const fillR = parseInt(fillColor.slice(1, 3), 16);
  const fillG = parseInt(fillColor.slice(3, 5), 16);
  const fillB = parseInt(fillColor.slice(5, 7), 16);

  for (let i = 0; i < size * size; i++) {
    if (processedMask[i]) {
      const idx = i * 4;
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const cellPaths = extractCellContours(processedMask, size);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${cellPaths.map(d => `<path d="${d}" fill="${fillColor}" stroke="none"/>`).join('\n')}
  </svg>`;
}

function extractCellContours(mask, size) {
  const step = 2;
  const gridW = Math.floor(size / step);
  const gridH = Math.floor(size / step);

  const grid = new Uint8Array(gridW * gridH);
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      grid[gy * gridW + gx] = mask[gy * step * size + gx * step];
    }
  }

  const edges = [];
  for (let gy = 0; gy < gridH - 1; gy++) {
    for (let gx = 0; gx < gridW - 1; gx++) {
      const idx = gy * gridW + gx;
      const tl = grid[idx];
      const tr = grid[idx + 1];
      const bl = grid[idx + gridW];
      const br = grid[idx + gridW + 1];
      const config = (tl << 3) | (tr << 2) | (br << 1) | bl;

      const x = gx * step;
      const y = gy * step;
      const half = step / 2;

      switch (config) {
        case 1: case 14: edges.push({ x1: x, y1: y + half, x2: x + half, y2: y + step }); break;
        case 2: case 13: edges.push({ x1: x + half, y1: y + step, x2: x + step, y2: y + half }); break;
        case 3: case 12: edges.push({ x1: x, y1: y + half, x2: x + step, y2: y + half }); break;
        case 4: case 11: edges.push({ x1: x + half, y1: y, x2: x + step, y2: y + half }); break;
        case 5:
          edges.push({ x1: x, y1: y + half, x2: x + half, y2: y });
          edges.push({ x1: x + half, y1: y + step, x2: x + step, y2: y + half });
          break;
        case 6: case 9: edges.push({ x1: x + half, y1: y, x2: x + half, y2: y + step }); break;
        case 7: case 8: edges.push({ x1: x, y1: y + half, x2: x + half, y2: y }); break;
        case 10:
          edges.push({ x1: x + half, y1: y, x2: x + step, y2: y + half });
          edges.push({ x1: x, y1: y + half, x2: x + half, y2: y + step });
          break;
      }
    }
  }

  const connectedPaths = connectEdges(edges);

  return connectedPaths.map(path => {
    if (path.length < 3) return '';
    let smoothed = path;
    for (let i = 0; i < 3; i++) smoothed = chaikinSmooth(smoothed, true);
    const simplified = simplifyPath(smoothed, 1.0);
    if (simplified.length < 3) return '';
    let d = `M${simplified[0].x.toFixed(1)},${simplified[0].y.toFixed(1)}`;
    for (let i = 1; i < simplified.length; i++) d += `L${simplified[i].x.toFixed(1)},${simplified[i].y.toFixed(1)}`;
    d += 'Z';
    return d;
  }).filter(d => d.length > 0);
}
