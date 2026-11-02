// SPDX-License-Identifier: Apache-2.0
// Original, font-free synthetic fixtures. No real schedule, map, identity or measurements.
import {particleFieldTile, place} from '../index.mjs';

const rect = (c, x, y, w, h, r, fill) => {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill();
};
const circle = (c, x, y, r, fill) => {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
};
export const examples = Object.freeze([
  Object.freeze({id: 'schedule-board', width: 1040, height: 640,
    description: 'Fictional five-lane schedule with seeded atmosphere outside the opaque reading surface.'}),
  Object.freeze({id: 'route-diagram', width: 700, height: 920,
    description: 'Fictional three-route diagram; an annular decorative field does not encode any route metric.'}),
]);

export function scheduleBoard(api) {
  const canvas = api.createCanvas(1040, 640), c = canvas.getContext('2d');
  c.fillStyle = '#f4eee6'; c.fillRect(0, 0, 1040, 640);
  const tile = particleFieldTile({createCanvas: api.createCanvas, pixelRatio: 2}, {
    width: 540, height: 540, count: 6500, seed: 71, radius: 248, aperture: .24,
    pointSize: 1, color: '#b47755', opacity: .66, exposure: 'single',
  });
  place(c, tile, 472, 82);
  circle(c, 48, 45, 9, '#79543f');
  rect(c, 70, 39, 130, 12, 6, '#79543f');
  rect(c, 900, 32, 92, 26, 13, '#e2d6c9');
  rect(c, 44, 96, 610, 500, 22, '#29253d');
  rect(c, 70, 124, 146, 12, 6, '#f1e7dc');
  rect(c, 70, 150, 230, 6, 3, '#91889e');
  const rows = [[0, 2, 4], [1, 3], [0, 1, 4], [2, 3], [0, 3, 4]];
  const colors = ['#c3b6d6', '#e5be83', '#a7bfd2', '#d7aaa1', '#b9adc9'];
  for (let row = 0; row < rows.length; row++) {
    const y = 196 + row * 72;
    circle(c, 83, y + 20, 8, colors[row]);
    for (let col = 0; col < 5; col++) rect(c, 110 + col * 100, y, 88, 40, 8, '#3b354f');
    for (const col of rows[row]) {
      rect(c, 110 + col * 100, y, 88, 40, 8, colors[row]);
      rect(c, 124 + col * 100, y + 12, 42, 5, 2, '#3f3651');
      rect(c, 124 + col * 100, y + 23, 24, 4, 2, '#66596e');
    }
  }
  // A geometric focal badge, not an original product mark.
  circle(c, 846, 352, 64, '#f4eee6');
  c.strokeStyle = '#79543f'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(816, 353); c.lineTo(838, 375); c.lineTo(878, 327); c.stroke();
  return canvas;
}

export function routeDiagram(api) {
  const canvas = api.createCanvas(700, 920), c = canvas.getContext('2d');
  c.fillStyle = '#171927'; c.fillRect(0, 0, 700, 920);
  for (let x = 40; x < 700; x += 40) for (let y = 120; y < 800; y += 40) circle(c, x, y, 1, '#2b3044');
  const tile = particleFieldTile({createCanvas: api.createCanvas, pixelRatio: 2}, {
    width: 610, height: 610, count: 4600, seed: 902, radius: 276, aperture: .60,
    rotation: .7, pointSize: 1.15, color: '#ac98ee', opacity: .48, exposure: 'lifted',
  });
  place(c, tile, 45, 145);
  rect(c, 44, 42, 190, 14, 7, '#dedaf5');
  rect(c, 44, 72, 258, 6, 3, '#747d9f');
  const routes = [
    {color: '#efc16c', points: [[92, 650], [220, 650], [350, 520], [350, 310], [540, 120]]},
    {color: '#8ab4e8', points: [[112, 246], [248, 382], [495, 382], [594, 481], [594, 660]]},
    {color: '#d7a4df', points: [[90, 760], [240, 610], [446, 610], [574, 738]]},
  ];
  c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const route of routes) {
    c.strokeStyle = route.color; c.beginPath();
    route.points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    for (const [x, y] of route.points) { circle(c, x, y, 12, '#171927'); circle(c, x, y, 7, route.color); }
  }
  rect(c, 44, 806, 612, 72, 16, '#24283d');
  routes.forEach((route, i) => {
    circle(c, 78 + i * 198, 841, 7, route.color);
    rect(c, 96 + i * 198, 832, 112, 6, 3, '#c7cde1');
    rect(c, 96 + i * 198, 846, 74, 4, 2, '#75819e');
  });
  return canvas;
}
