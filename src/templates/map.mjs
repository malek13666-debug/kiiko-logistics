// Генерує SVG-карту Європи з маршрутами з України (дані: src/data/europe-map.json).
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/europe-map.json', import.meta.url), 'utf8'));

const DEST = ['PL', 'DE', 'CZ', 'SK', 'HU', 'IT', 'LT', 'EE', 'DK', 'CH'];
// Зміщення підписів відносно точки: [dx, dy, anchor]
const LABEL = {
  PL: [0, -16, 'middle'], DE: [-14, 5, 'end'], CZ: [-12, -10, 'end'], SK: [4, -14, 'middle'],
  HU: [0, 26, 'middle'], IT: [14, 5, 'start'], CH: [0, 28, 'middle'], DK: [-14, 5, 'end'],
  LT: [14, 5, 'start'], EE: [14, 5, 'start'],
};

function curve([x1, y1], [x2, y2], bend = 0.2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  // перпендикуляр, спрямований «вгору» (на північ) для плавної дуги
  let nx = -dy, ny = dx;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const cx = mx + nx * bend, cy = my + ny * bend;
  return `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`;
}

export function renderMap(t) {
  const P = data.points;
  const hub = P.UA;
  const countries = data.countries
    .map((c) => {
      const cls = c.iso === 'UA' ? 'map-ua' : DEST.includes(c.iso) ? 'map-dest' : 'map-land';
      const attr = DEST.includes(c.iso) ? ` data-iso="${c.iso}"` : '';
      return `<path class="${cls}"${attr} d="${c.d}"/>`;
    })
    .join('');

  const routes = DEST.map((iso, i) => {
    const d = curve(hub, P[iso], iso === 'EE' || iso === 'LT' ? -0.18 : 0.2);
    const dur = (5.5 + (i % 4) * 0.7).toFixed(1);
    return `<g class="route" data-iso="${iso}">
      <path id="r-${iso}" class="route-line" d="${d}"/>
      <circle class="route-pulse" r="3.2"><animateMotion dur="${dur}s" repeatCount="indefinite" begin="${(i * 0.45).toFixed(2)}s" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#r-${iso}"/></animateMotion></circle>
      <circle class="route-pulse route-pulse--back" r="3.2"><animateMotion dur="${dur}s" repeatCount="indefinite" begin="${(i * 0.45 + 1.6).toFixed(2)}s" keyPoints="1;0" keyTimes="0;1" calcMode="linear"><mpath href="#r-${iso}"/></animateMotion></circle>
    </g>`;
  }).join('');

  const nodes = DEST.map((iso) => {
    const [x, y] = P[iso];
    const [dx, dy, anchor] = LABEL[iso];
    return `<g class="node" data-iso="${iso}"><circle class="node-ring" cx="${x}" cy="${y}" r="9"/><circle class="node-dot" cx="${x}" cy="${y}" r="4"/><text class="node-label" x="${x + dx}" y="${y + dy}" text-anchor="${anchor}">${t.geography.countries[iso]}</text></g>`;
  }).join('');

  const [hx, hy] = hub;
  return `<svg class="map-svg" viewBox="300 40 640 500" role="img" aria-labelledby="map-title" preserveAspectRatio="xMidYMid meet">
  <title id="map-title">${t.geography.mapLabel}</title>
  <defs>
    <radialGradient id="map-fade" cx="58%" cy="52%" r="62%"><stop offset="60%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient>
    <mask id="map-mask"><rect x="300" y="40" width="640" height="500" fill="url(#map-fade)"/></mask>
  </defs>
  <g mask="url(#map-mask)">${countries}</g>
  <g class="routes">${routes}</g>
  <g class="nodes">${nodes}</g>
  <g class="hub"><circle class="hub-halo" cx="${hx}" cy="${hy}" r="22"/><circle class="hub-ring" cx="${hx}" cy="${hy}" r="11"/><circle class="hub-dot" cx="${hx}" cy="${hy}" r="5.5"/><text class="hub-label" x="${hx + 4}" y="${hy - 26}" text-anchor="middle">${t.geography.hub}</text></g>
</svg>`;
}

export const DESTINATIONS = DEST;
