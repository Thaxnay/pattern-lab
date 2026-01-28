import { getContourLines } from '../lib/utils';
import { applyGaussianBlur } from '../lib/utils';

export const presets = {
  terrain: { levels: 20, stroke: 0.75, opacity: 0.6, smoothing: 2, resolution: 3 },
  fine: { levels: 35, stroke: 0.5, opacity: 0.5, smoothing: 1, resolution: 2 },
  bold: { levels: 12, stroke: 1.5, opacity: 0.8, smoothing: 3, resolution: 4 },
  minimal: { levels: 8, stroke: 1.0, opacity: 0.7, smoothing: 4, resolution: 5 },
};

export const controls = [
  { id: 'levels', label: 'Contour Levels', min: 5, max: 50, step: 1, defaultValue: 20 },
  { id: 'stroke', label: 'Line Width', min: 0.25, max: 3, step: 0.25, defaultValue: 0.75 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.6 },
  { id: 'smoothing', label: 'Smoothing', min: 0, max: 5, step: 1, defaultValue: 2 },
  { id: 'resolution', label: 'Resolution (lower = more detail)', min: 1, max: 8, step: 1, defaultValue: 3 },
  { id: 'invert', label: 'Invert Depth', type: 'checkbox', defaultValue: false },
];

// Depth Topo has its own color controls
export const extraControls = [
  { id: 'contourColor', label: 'Contour Color', type: 'color', defaultValue: '#ffffff' },
  { id: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#1a4d5c' },
];

export function computeDepthMap(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const depthMap = [];

  for (let y = 0; y < height; y++) {
    depthMap[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      depthMap[y][x] = luminance / 255;
    }
  }

  return depthMap;
}

export function convertDepthResultToMap(depthResult, targetWidth, targetHeight) {
  const depthData = depthResult.depth.data;
  const depthWidth = depthResult.depth.width;
  const depthHeight = depthResult.depth.height;
  const depthMap = [];

  for (let y = 0; y < targetHeight; y++) {
    depthMap[y] = [];
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.floor(x * depthWidth / targetWidth);
      const srcY = Math.floor(y * depthHeight / targetHeight);
      depthMap[y][x] = depthData[srcY * depthWidth + srcX] / 255;
    }
  }

  return depthMap;
}

export function drawDepthMapVisualization(ctx, depthMap, width, height) {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.floor(depthMap[y][x] * 255);
      data[idx] = gray;
      data[idx + 1] = gray;
      data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function generate(canvas, params, depthMapData, width, height) {
  const { levels, stroke, opacity, smoothing, resolution, invert, contourColor, bgColor } = params;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  let processedDepthMap = applyGaussianBlur(depthMapData, smoothing);
  if (invert) {
    processedDepthMap = processedDepthMap.map(row => row.map(val => 1 - val));
  }

  ctx.strokeStyle = contourColor;
  ctx.lineWidth = stroke;
  ctx.globalAlpha = opacity;

  const allPaths = [];
  const cols = Math.floor(width / resolution);
  const rows = Math.floor(height / resolution);

  for (let level = 0; level < levels; level++) {
    const threshold = level / levels;

    for (let gy = 0; gy < rows - 1; gy++) {
      for (let gx = 0; gx < cols - 1; gx++) {
        const y1 = Math.min(gy * resolution, height - 1);
        const y2 = Math.min((gy + 1) * resolution, height - 1);
        const x1 = Math.min(gx * resolution, width - 1);
        const x2 = Math.min((gx + 1) * resolution, width - 1);

        const tl = processedDepthMap[y1][x1] > threshold ? 1 : 0;
        const tr = processedDepthMap[y1][x2] > threshold ? 1 : 0;
        const br = processedDepthMap[y2][x2] > threshold ? 1 : 0;
        const bl = processedDepthMap[y2][x1] > threshold ? 1 : 0;

        const state = tl * 8 + tr * 4 + br * 2 + bl;
        const px = gx * resolution;
        const py = gy * resolution;
        const lines = getContourLines(state, px, py, resolution);

        for (const line of lines) {
          ctx.beginPath();
          ctx.moveTo(line.x1, line.y1);
          ctx.lineTo(line.x2, line.y2);
          ctx.stroke();
          allPaths.push(`M${line.x1.toFixed(1)},${line.y1.toFixed(1)}L${line.x2.toFixed(1)},${line.y2.toFixed(1)}`);
        }
      }
    }
  }

  ctx.globalAlpha = 1;

  return {
    processedDepthMap,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      ${allPaths.map(d => `<path d="${d}" fill="none" stroke="${contourColor}" stroke-width="${stroke}" opacity="${opacity}"/>`).join('\n')}
    </svg>`,
  };
}
