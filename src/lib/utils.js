export function chaikinSmooth(points, closed) {
  if (points.length < 3) return points;

  const result = [];
  const len = closed ? points.length : points.length - 1;

  for (let i = 0; i < len; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];

    result.push({
      x: 0.75 * p0.x + 0.25 * p1.x,
      y: 0.75 * p0.y + 0.25 * p1.y,
    });
    result.push({
      x: 0.25 * p0.x + 0.75 * p1.x,
      y: 0.25 * p0.y + 0.75 * p1.y,
    });
  }

  return result;
}

export function simplifyPath(points, tolerance) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDist(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPath(points.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

function perpendicularDist(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

export function getContourLines(state, x, y, res) {
  const lines = [];
  const half = res / 2;

  const top = { x: x + half, y: y };
  const right = { x: x + res, y: y + half };
  const bottom = { x: x + half, y: y + res };
  const left = { x: x, y: y + half };

  switch (state) {
    case 1: case 14: lines.push({ x1: left.x, y1: left.y, x2: bottom.x, y2: bottom.y }); break;
    case 2: case 13: lines.push({ x1: bottom.x, y1: bottom.y, x2: right.x, y2: right.y }); break;
    case 3: case 12: lines.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y }); break;
    case 4: case 11: lines.push({ x1: top.x, y1: top.y, x2: right.x, y2: right.y }); break;
    case 5:
      lines.push({ x1: left.x, y1: left.y, x2: top.x, y2: top.y });
      lines.push({ x1: bottom.x, y1: bottom.y, x2: right.x, y2: right.y });
      break;
    case 6: case 9: lines.push({ x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y }); break;
    case 7: case 8: lines.push({ x1: left.x, y1: left.y, x2: top.x, y2: top.y }); break;
    case 10:
      lines.push({ x1: top.x, y1: top.y, x2: right.x, y2: right.y });
      lines.push({ x1: left.x, y1: left.y, x2: bottom.x, y2: bottom.y });
      break;
  }

  return lines;
}

export function connectEdges(edges) {
  if (edges.length === 0) return [];

  const paths = [];
  const used = new Set();
  const pointMap = new Map();

  const getKey = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

  edges.forEach((e, i) => {
    const k1 = getKey(e.x1, e.y1);
    const k2 = getKey(e.x2, e.y2);
    if (!pointMap.has(k1)) pointMap.set(k1, []);
    if (!pointMap.has(k2)) pointMap.set(k2, []);
    pointMap.get(k1).push({ idx: i, other: k2, x: e.x2, y: e.y2 });
    pointMap.get(k2).push({ idx: i, other: k1, x: e.x1, y: e.y1 });
  });

  for (let i = 0; i < edges.length; i++) {
    if (used.has(i)) continue;

    const path = [{ x: edges[i].x1, y: edges[i].y1 }, { x: edges[i].x2, y: edges[i].y2 }];
    used.add(i);

    let currentKey = getKey(edges[i].x2, edges[i].y2);
    while (true) {
      const neighbors = pointMap.get(currentKey) || [];
      const next = neighbors.find(n => !used.has(n.idx));
      if (!next) break;
      used.add(next.idx);
      path.push({ x: next.x, y: next.y });
      currentKey = next.other;
    }

    currentKey = getKey(edges[i].x1, edges[i].y1);
    while (true) {
      const neighbors = pointMap.get(currentKey) || [];
      const next = neighbors.find(n => !used.has(n.idx));
      if (!next) break;
      used.add(next.idx);
      path.unshift({ x: next.x, y: next.y });
      currentKey = next.other;
    }

    if (path.length >= 2) paths.push(path);
  }

  return paths;
}

export function lloydRelax(points, size) {
  const numPoints = points.length;
  const centroids = points.map(() => ({ x: 0, y: 0, count: 0 }));

  const step = Math.max(2, Math.floor(size / 100));
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      let minDist = Infinity;
      let nearest = 0;
      for (let i = 0; i < numPoints; i++) {
        const dx = x - points[i].x;
        const dy = y - points[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      centroids[nearest].x += x;
      centroids[nearest].y += y;
      centroids[nearest].count++;
    }
  }

  return points.map((p, i) => {
    if (centroids[i].count > 0) {
      return {
        x: centroids[i].x / centroids[i].count,
        y: centroids[i].y / centroids[i].count,
      };
    }
    return p;
  });
}

export function applyGaussianBlur(depthMap, radius) {
  if (radius === 0) return depthMap;

  const height = depthMap.length;
  const width = depthMap[0].length;

  const kernelSize = radius * 2 + 1;
  const kernel = [];
  const sigma = radius / 2 || 0.5;
  let sum = 0;

  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  const temp = [];
  for (let y = 0; y < height; y++) {
    temp[y] = [];
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sx = Math.min(Math.max(x + k - radius, 0), width - 1);
        val += depthMap[y][sx] * kernel[k];
      }
      temp[y][x] = val;
    }
  }

  const result = [];
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sy = Math.min(Math.max(y + k - radius, 0), height - 1);
        val += temp[sy][x] * kernel[k];
      }
      result[y][x] = val;
    }
  }

  return result;
}

export function applyMorphologicalSmoothing(mask, size, radius) {
  const r = Math.ceil(radius);
  const result = new Uint8Array(size * size);

  const eroded = new Uint8Array(size * size);
  for (let y = r; y < size - r; y++) {
    for (let x = r; x < size - r; x++) {
      let allSet = true;
      for (let dy = -r; dy <= r && allSet; dy++) {
        for (let dx = -r; dx <= r && allSet; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            if (!mask[(y + dy) * size + (x + dx)]) {
              allSet = false;
            }
          }
        }
      }
      eroded[y * size + x] = allSet ? 1 : 0;
    }
  }

  for (let y = r; y < size - r; y++) {
    for (let x = r; x < size - r; x++) {
      let anySet = false;
      for (let dy = -r; dy <= r && !anySet; dy++) {
        for (let dx = -r; dx <= r && !anySet; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            if (eroded[(y + dy) * size + (x + dx)]) {
              anySet = true;
            }
          }
        }
      }
      result[y * size + x] = anySet ? 1 : 0;
    }
  }

  return result;
}
