import { SimplexNoise } from '../lib/noise';

export const presets = {
  sparse: { nodes: 50, distance: 100, nodesize: 3, linewidth: 0.5, opacity: 0.6 },
  dense: { nodes: 200, distance: 60, nodesize: 2, linewidth: 0.35, opacity: 0.4 },
  clustered: { nodes: 120, distance: 80, nodesize: 2.5, linewidth: 0.5, opacity: 0.5 },
  web: { nodes: 80, distance: 120, nodesize: 1.5, linewidth: 0.75, opacity: 0.55 },
};

export const controls = [
  { id: 'nodes', label: 'Node Count', min: 20, max: 300, step: 1, defaultValue: 80 },
  { id: 'distance', label: 'Connection Distance', min: 30, max: 200, step: 1, defaultValue: 80 },
  { id: 'nodesize', label: 'Node Size', min: 1, max: 8, step: 1, defaultValue: 2 },
  { id: 'linewidth', label: 'Line Width', min: 0.25, max: 2, step: 0.25, defaultValue: 0.5 },
  { id: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.05, defaultValue: 0.5 },
  { id: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, defaultValue: 1234 },
];

export function generate(canvas, params, style) {
  const { nodes: numNodes, distance: maxDistance, nodesize: nodeSize, linewidth: lineWidth, opacity, seed } = params;
  const { strokeColor, bgColor } = style;
  const size = canvas.width;

  const random = new SimplexNoise(seed).seededRandom(seed);
  const nodeList = [];
  for (let i = 0; i < numNodes; i++) {
    nodeList.push({ x: random() * size, y: random() * size });
  }

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = opacity;

  const lines = [];
  const circles = [];

  for (let i = 0; i < nodeList.length; i++) {
    for (let j = i + 1; j < nodeList.length; j++) {
      const dx = nodeList[i].x - nodeList[j].x;
      const dy = nodeList[i].y - nodeList[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDistance) {
        const lineOpacity = (1 - dist / maxDistance) * opacity;
        ctx.globalAlpha = lineOpacity;
        ctx.beginPath();
        ctx.moveTo(nodeList[i].x, nodeList[i].y);
        ctx.lineTo(nodeList[j].x, nodeList[j].y);
        ctx.stroke();
        lines.push({
          x1: nodeList[i].x.toFixed(2), y1: nodeList[i].y.toFixed(2),
          x2: nodeList[j].x.toFixed(2), y2: nodeList[j].y.toFixed(2),
          opacity: lineOpacity.toFixed(3),
        });
      }
    }
  }

  ctx.globalAlpha = opacity;
  for (const node of nodeList) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
    ctx.fill();
    circles.push({ cx: node.x.toFixed(2), cy: node.y.toFixed(2), r: nodeSize });
  }

  ctx.globalAlpha = 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}"/>
    ${lines.map(l => `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${strokeColor}" stroke-width="${lineWidth}" opacity="${l.opacity}"/>`).join('\n')}
    ${circles.map(c => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${strokeColor}" opacity="${opacity}"/>`).join('\n')}
  </svg>`;
}
