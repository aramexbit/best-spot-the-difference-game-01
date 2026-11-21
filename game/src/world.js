// The game world: three procedural scenes, the planted differences,
// and the rules — find them all before the clock runs out.
//
// Each scene is drawn twice from the same painter: once as the original
// (left panel) and once altered (right panel), where every planted
// difference's `apply` redraws its own spot. Nothing is an image file;
// every cloud, boat, lantern and pine is vector shapes on a canvas, so
// the two panels are identical except for the differences on purpose.
//
// A difference is { id, name, x, y, r, apply }: x/y/r live in scene
// coordinates (560x470, see PANEL in config.js); apply(ctx) repaints
// that spot the altered way. A click within r of an unfound difference
// finds it on both panels at once.

import { HINT, LEVELS, PANEL, SCORE } from './config.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_CLEAR = 4;
export const EVENT_OVER = 8;
export const EVENT_HINT = 16;

export const SCREEN_TITLE = 'title';
export const SCREEN_SELECT = 'select';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_DONE = 'done';
export const SCREEN_PAUSED = 'paused';

// ---------------------------------------------------------------- scenes

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ellipse(ctx, x, y, 34 * s, 16 * s);
  ellipse(ctx, x - 22 * s, y + 5 * s, 22 * s, 12 * s);
  ellipse(ctx, x + 24 * s, y + 5 * s, 24 * s, 13 * s);
}

function gull(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.quadraticCurveTo(x - 5, y - 8, x, y);
  ctx.quadraticCurveTo(x + 5, y - 8, x + 12, y);
  ctx.stroke();
}

function pine(ctx, x, y, s, color) {
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(x - 4 * s, y - 6 * s, 8 * s, 26 * s);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i += 1) {
    const w = (52 - i * 13) * s;
    const ty = y - (8 + i * 22) * s;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, ty + 20 * s);
    ctx.lineTo(x, ty - 14 * s);
    ctx.lineTo(x + w / 2, ty + 20 * s);
    ctx.closePath();
    ctx.fill();
  }
}

// --- Level 1: Harbor Morning -------------------------------------------
const HARBOR_DIFFS = [
  {
    id: 'sun-rays', name: 'Sun rays', x: 470, y: 70, r: 44,
    apply(ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#8ec9e8');
      sky.addColorStop(1, '#dff2fa');
      ctx.fillStyle = sky;
      ctx.beginPath();
      ctx.arc(470, 70, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(470, 70, 32, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'sail-color', name: 'Sail colour', x: 305, y: 255, r: 34,
    apply(ctx) {
      ctx.fillStyle = '#3f7dff';
      ctx.beginPath();
      ctx.moveTo(305, 205);
      ctx.lineTo(305, 292);
      ctx.lineTo(352, 292);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'gull-missing', name: 'Seagull', x: 330, y: 108, r: 26,
    apply(ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#8ec9e8');
      sky.addColorStop(1, '#dff2fa');
      ctx.fillStyle = sky;
      ellipse(ctx, 330, 108, 20, 12);
    },
  },
  {
    id: 'lighthouse-stripe', name: 'Lighthouse stripe', x: 84, y: 205, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#f7f4ec';
      ctx.fillRect(66, 192, 38, 26);
    },
  },
  {
    id: 'fish-missing', name: 'Jumping fish', x: 432, y: 372, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#2f7fb8';
      ellipse(ctx, 432, 372, 26, 16);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(402, 392);
      ctx.quadraticCurveTo(432, 384, 462, 392);
      ctx.stroke();
    },
  },
  {
    id: 'flag-missing', name: 'Boat flag', x: 322, y: 196, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#bfe3f2';
      ctx.fillRect(306, 182, 34, 20);
    },
  },
  {
    id: 'cloud-extra', name: 'Extra cloud', x: 140, y: 62, r: 30,
    apply(ctx) { cloud(ctx, 140, 62, 0.7, '#ffffff'); },
  },
];

function paintHarbor(ctx, altered, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#8ec9e8');
  sky.addColorStop(1, '#dff2fa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 560, 300);
  const sea = ctx.createLinearGradient(0, 300, 0, 470);
  sea.addColorStop(0, '#3d8fc4');
  sea.addColorStop(1, '#1d5f8f');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, 560, 170);
  // Sun with rays.
  ctx.strokeStyle = '#f2b705';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(470 + Math.cos(a) * 40, 70 + Math.sin(a) * 40);
    ctx.lineTo(470 + Math.cos(a) * 52, 70 + Math.sin(a) * 52);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(470, 70, 32, 0, Math.PI * 2);
  ctx.fill();
  // Clouds and gulls.
  cloud(ctx, 90, 90, 1, '#ffffff');
  cloud(ctx, 250, 55, 0.8, '#ffffff');
  cloud(ctx, 420, 140, 0.9, '#f4fbff');
  gull(ctx, 200, 92, '#33506b');
  gull(ctx, 262, 72, '#33506b');
  gull(ctx, 330, 108, '#33506b');
  // Lighthouse on the left rocks.
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(30, 320);
  ctx.lineTo(70, 285);
  ctx.lineTo(120, 285);
  ctx.lineTo(150, 320);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f4ec';
  ctx.fillRect(64, 150, 42, 140);
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(64, 168, 42, 18);
  ctx.fillRect(64, 192, 42, 26);
  ctx.fillRect(64, 238, 42, 18);
  ctx.fillStyle = '#33506b';
  ctx.fillRect(60, 132, 50, 20);
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(85, 142, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#33506b';
  ctx.beginPath();
  ctx.moveTo(60, 132);
  ctx.lineTo(85, 116);
  ctx.lineTo(110, 132);
  ctx.closePath();
  ctx.fill();
  // Wooden pier.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(180, 292, 220, 14);
  ctx.fillStyle = '#6f5433';
  for (let i = 0; i < 6; i += 1) ctx.fillRect(190 + i * 36, 292, 3, 14);
  ctx.fillStyle = '#7a5c38';
  ctx.fillRect(196, 306, 8, 34);
  ctx.fillRect(376, 306, 8, 34);
  // Sailboat.
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(303, 196, 4, 100);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(305, 205);
  ctx.lineTo(305, 292);
  ctx.lineTo(352, 292);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2f4f8';
  ctx.beginPath();
  ctx.moveTo(301, 215);
  ctx.lineTo(301, 292);
  ctx.lineTo(262, 292);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(307, 182);
  ctx.lineTo(336, 190);
  ctx.lineTo(307, 200);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a3b2e';
  ctx.beginPath();
  ctx.moveTo(252, 292);
  ctx.lineTo(362, 292);
  ctx.lineTo(344, 318);
  ctx.lineTo(270, 318);
  ctx.closePath();
  ctx.fill();
  // Jumping fish, buoy and wave lines.
  const bob = Math.sin(t * 2) * 3;
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  ctx.ellipse(432, 372 + bob, 16, 8, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(446, 364 + bob);
  ctx.lineTo(458, 356 + bob);
  ctx.lineTo(454, 372 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(500, 402 + bob * 0.5, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f4ec';
  ctx.fillRect(490, 398 + bob * 0.5, 20, 7);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (const [wx, wy, wl] of [[60, 350, 70], [180, 390, 90], [300, 430, 80], [430, 440, 70], [90, 440, 60]]) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + wl / 2, wy - 7, wx + wl, wy);
    ctx.stroke();
  }
  if (altered) for (const d of HARBOR_DIFFS) d.apply(ctx, t);
}

// --- Level 2: Night Market ---------------------------------------------
const MARKET_DIFFS = [
  {
    id: 'moon-phase', name: 'Moon', x: 478, y: 62, r: 34,
    apply(ctx) {
      ctx.fillStyle = '#2a3560';
      ctx.beginPath();
      ctx.arc(492, 56, 24, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'lantern-color', name: 'Lantern', x: 168, y: 300, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#39c26d';
      ellipse(ctx, 168, 300, 13, 17);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(163, 281, 10, 4);
    },
  },
  {
    id: 'cat-missing', name: 'Roof cat', x: 300, y: 168, r: 28,
    apply(ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 470);
      sky.addColorStop(0, '#141b33');
      sky.addColorStop(1, '#2a3560');
      ctx.fillStyle = sky;
      ctx.fillRect(274, 144, 52, 30);
    },
  },
  {
    id: 'awning-stripe', name: 'Awning stripe', x: 118, y: 216, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(104, 196);
      ctx.lineTo(132, 196);
      ctx.lineTo(126, 238);
      ctx.lineTo(110, 238);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'sign-word', name: 'Stall sign', x: 300, y: 262, r: 30,
    apply(ctx) {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(258, 244, 84, 36);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SOUP', 300, 263);
    },
  },
  {
    id: 'basket-missing', name: 'Fruit basket', x: 452, y: 372, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#3a2c22';
      ctx.fillRect(428, 348, 50, 40);
    },
  },
  {
    id: 'bulb-out', name: 'String bulb', x: 400, y: 117, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#3a4560';
      ctx.beginPath();
      ctx.arc(400, 117, 7, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'hat-color', name: 'Vendor hat', x: 300, y: 322, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(300, 318, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(285, 318, 30, 5);
    },
  },
];

function stall(ctx, x, w, awningA, awningB, counter) {
  ctx.fillStyle = '#3a2c22';
  ctx.fillRect(x, 300, w, 90);
  ctx.fillStyle = counter;
  ctx.fillRect(x, 300, w, 10);
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? awningA : awningB;
    const sx = x - 8 + (i * (w + 16)) / 5;
    ctx.beginPath();
    ctx.moveTo(sx, 196);
    ctx.lineTo(sx + (w + 16) / 5, 196);
    ctx.lineTo(sx + (w + 16) / 5 - 6, 238);
    ctx.lineTo(sx + 6, 238);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(x - 8, 236, w + 16, 6);
}

function lantern(ctx, x, y, color, glow) {
  if (glow) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, 34);
    g.addColorStop(0, 'rgba(255,209,102,0.5)');
    g.addColorStop(1, 'rgba(255,209,102,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#1a2340';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = color;
  ellipse(ctx, x, y, 13, 17);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - 5, y - 19, 10, 4);
  ctx.fillRect(x - 5, y + 15, 10, 4);
}

function paintMarket(ctx, altered, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 470);
  sky.addColorStop(0, '#141b33');
  sky.addColorStop(1, '#2a3560');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 560, 470);
  ctx.fillStyle = '#f2f4f8';
  for (const [sx, sy, sr] of [[60, 50, 2], [140, 34, 1.5], [220, 70, 2], [330, 40, 1.5], [420, 90, 2], [40, 130, 1.5], [520, 130, 2], [260, 110, 1.5]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Full moon (the altered panel bites a crescent out of it).
  ctx.fillStyle = '#f5eeda';
  ctx.beginPath();
  ctx.arc(478, 62, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.arc(468, 54, 7, 0, Math.PI * 2);
  ctx.arc(488, 72, 5, 0, Math.PI * 2);
  ctx.fill();
  // String lights sagging across the top.
  ctx.strokeStyle = '#0e1428';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.quadraticCurveTo(280, 142, 560, 96);
  ctx.stroke();
  for (let i = 0; i < 9; i += 1) {
    const bx = 40 + i * 60;
    const by = 96 + Math.sin((bx / 560) * Math.PI) * 26;
    const flicker = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = `rgba(255,209,102,${flicker})`;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Three stalls.
  stall(ctx, 48, 130, '#e5534b', '#f7f4ec', '#7a4a2b');
  stall(ctx, 232, 130, '#3f7dff', '#f7f4ec', '#7a4a2b');
  stall(ctx, 416, 110, '#39c26d', '#f7f4ec', '#7a4a2b');
  // Cat asleep on the middle stall roof.
  ctx.fillStyle = '#2b2b33';
  ellipse(ctx, 300, 168, 20, 9);
  ctx.beginPath();
  ctx.arc(318, 162, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(312, 155);
  ctx.lineTo(314, 147);
  ctx.lineTo(318, 154);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(284, 160);
  ctx.lineTo(276, 152);
  ctx.lineTo(280, 164);
  ctx.closePath();
  ctx.fill();
  // Stall sign.
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(258, 244, 84, 36);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEA', 300, 263);
  // Lanterns.
  lantern(ctx, 96, 300, '#e5534b', true);
  lantern(ctx, 168, 300, '#e5534b', false);
  lantern(ctx, 262, 300, '#ffd166', true);
  lantern(ctx, 340, 300, '#e5534b', false);
  // Vendor behind the middle counter, red hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(300, 332, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(300, 318, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(285, 318, 30, 5);
  ctx.fillStyle = '#3f7dff';
  ctx.beginPath();
  ctx.moveTo(282, 392);
  ctx.lineTo(300, 348);
  ctx.lineTo(318, 392);
  ctx.closePath();
  ctx.fill();
  // Goods on the counters: oranges, jars, baskets.
  ctx.fillStyle = '#ff8c42';
  for (const [ox, oy] of [[80, 292], [96, 292], [88, 280], [452, 360], [468, 360], [460, 348]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(440, 368, 44, 22);
  ctx.fillStyle = '#6f4520';
  ctx.fillRect(440, 368, 44, 5);
  ctx.fillStyle = '#c65a3d';
  ctx.fillRect(250, 372, 100, 18);
  ctx.fillStyle = '#f2f4f8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('FRESH  •  HOT  •  SWEET', 300, 383);
  // Cobblestones at the bottom.
  ctx.fillStyle = '#1c2340';
  ctx.fillRect(0, 392, 560, 78);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(40 + i * 70, 420, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (altered) for (const d of MARKET_DIFFS) d.apply(ctx, t);
}

// --- Level 3: Forest Camp ------------------------------------------------
const FOREST_DIFFS = [
  {
    id: 'tent-color', name: 'Tent colour', x: 280, y: 300, r: 40,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.moveTo(200, 372);
      ctx.lineTo(280, 250);
      ctx.lineTo(360, 372);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1d6f66';
      ctx.beginPath();
      ctx.moveTo(280, 372);
      ctx.lineTo(280, 292);
      ctx.lineTo(312, 372);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'flame-size', name: 'Campfire flame', x: 428, y: 372, r: 30,
    apply(ctx) {
      ctx.fillStyle = '#3d7a34';
      ctx.beginPath();
      ctx.arc(428, 372, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8c42';
      ctx.beginPath();
      ctx.moveTo(428, 352);
      ctx.quadraticCurveTo(440, 366, 428, 380);
      ctx.quadraticCurveTo(416, 366, 428, 352);
      ctx.fill();
    },
  },
  {
    id: 'owl-missing', name: 'Owl', x: 96, y: 128, r: 28,
    apply(ctx) {
      const sky = ctx.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#2c4a6b');
      sky.addColorStop(1, '#e8b06a');
      ctx.fillStyle = sky;
      ellipse(ctx, 96, 128, 22, 26);
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(48, 152);
      ctx.lineTo(140, 138);
      ctx.stroke();
    },
  },
  {
    id: 'mushroom-missing', name: 'Mushroom', x: 492, y: 418, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#3d7a34';
      ellipse(ctx, 492, 418, 20, 12);
    },
  },
  {
    id: 'backpack-missing', name: 'Backpack', x: 168, y: 392, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#3d7a34';
      ellipse(ctx, 168, 392, 26, 18);
    },
  },
  {
    id: 'star-extra', name: 'Extra star', x: 448, y: 66, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(448, 66, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(448, 66, 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,233,168,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },
  {
    id: 'butterfly-color', name: 'Butterfly', x: 372, y: 150, r: 26,
    apply(ctx, t) {
      const bx = 372 + Math.sin((t ?? 0) * 1.8) * 8;
      const by = 150 + Math.cos((t ?? 0) * 2.3) * 6;
      const sky = ctx.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#2c4a6b');
      sky.addColorStop(1, '#e8b06a');
      ctx.fillStyle = sky;
      ellipse(ctx, bx, by, 26, 20);
      ctx.fillStyle = '#9b5de5';
      ellipse(ctx, bx - 11, by, 10, 14);
      ellipse(ctx, bx + 11, by, 10, 14);
      ctx.fillStyle = '#5b3a1e';
      ellipse(ctx, bx, by, 3, 10);
    },
  },
  {
    id: 'log-missing', name: 'Fire log', x: 448, y: 396, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#3d7a34';
      ctx.fillRect(434, 388, 34, 12);
    },
  },
  {
    id: 'smoke-shape', name: 'Smoke curl', x: 428, y: 300, r: 30,
    apply(ctx) {
      ctx.fillStyle = '#8fa3bf';
      ctx.beginPath();
      ctx.arc(428, 300, 12, 0, Math.PI * 2);
      ctx.arc(414, 282, 9, 0, Math.PI * 2);
      ctx.arc(402, 266, 7, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'boots-missing', name: 'Boots', x: 356, y: 392, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#3d7a34';
      ellipse(ctx, 356, 392, 22, 12);
    },
  },
];

function paintForest(ctx, altered, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#2c4a6b');
  sky.addColorStop(1, '#e8b06a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 560, 300);
  ctx.fillStyle = '#ffe9a8';
  for (const [sx, sy, sr] of [[70, 48, 2.5], [160, 80, 2], [250, 40, 2.5], [340, 70, 2], [500, 44, 2.5], [520, 110, 2]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Distant tree line and ground.
  ctx.fillStyle = '#2f6b3a';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  for (let x = 0; x <= 560; x += 40) ctx.lineTo(x, 268 + ((x * 7) % 23));
  ctx.lineTo(560, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3d7a34';
  ctx.fillRect(0, 300, 560, 170);
  ctx.fillStyle = '#356b2d';
  ellipse(ctx, 120, 430, 90, 18);
  ellipse(ctx, 460, 440, 110, 20);
  // Big pines left and right.
  pine(ctx, 70, 300, 1.5, '#2f6b3a');
  pine(ctx, 510, 310, 1.3, '#2a5e33');
  pine(ctx, 150, 260, 0.9, '#357a40');
  // Branch with the owl.
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(48, 152);
  ctx.lineTo(140, 138);
  ctx.stroke();
  ctx.fillStyle = '#6b4a2f';
  ellipse(ctx, 96, 128, 16, 22);
  ctx.fillStyle = '#f2f4f8';
  ctx.beginPath();
  ctx.arc(90, 122, 6, 0, Math.PI * 2);
  ctx.arc(103, 122, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(90, 122, 2.5, 0, Math.PI * 2);
  ctx.arc(103, 122, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a93d';
  ctx.beginPath();
  ctx.moveTo(96, 128);
  ctx.lineTo(90, 136);
  ctx.lineTo(102, 136);
  ctx.closePath();
  ctx.fill();
  // Orange tent.
  ctx.fillStyle = '#e76f51';
  ctx.beginPath();
  ctx.moveTo(200, 372);
  ctx.lineTo(280, 250);
  ctx.lineTo(360, 372);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c65a3d';
  ctx.beginPath();
  ctx.moveTo(280, 372);
  ctx.lineTo(280, 292);
  ctx.lineTo(312, 372);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a3d28';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 372);
  ctx.lineTo(280, 250);
  ctx.lineTo(360, 372);
  ctx.stroke();
  // Backpack and boots by the tent.
  ctx.fillStyle = '#3f7dff';
  ctx.beginPath();
  ctx.arc(168, 392, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f5fc4';
  ctx.fillRect(150, 372, 36, 10);
  ctx.fillStyle = '#5b3a1e';
  ellipse(ctx, 344, 392, 12, 7);
  ellipse(ctx, 368, 392, 12, 7);
  // Campfire: stones, logs, flame, smoke.
  ctx.fillStyle = '#6b7280';
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(428 + Math.cos(a) * 30, 392 + Math.sin(a) * 10, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const flicker = 1 + 0.12 * Math.sin(t * 7) + 0.06 * Math.sin(t * 13);
  ctx.fillStyle = '#5b3a1e';
  ctx.save();
  ctx.translate(428, 392);
  ctx.rotate(0.5);
  ctx.fillRect(-22, -5, 44, 10);
  ctx.rotate(-1.0);
  ctx.fillRect(-22, -5, 44, 10);
  ctx.restore();
  const glow = ctx.createRadialGradient(428, 372, 4, 428, 372, 52);
  glow.addColorStop(0, 'rgba(255,180,60,0.55)');
  glow.addColorStop(1, 'rgba(255,180,60,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(428, 372, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  ctx.moveTo(428, 344 - 6 * flicker);
  ctx.quadraticCurveTo(446, 366, 428, 384);
  ctx.quadraticCurveTo(410, 366, 428, 344 - 6 * flicker);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(428, 358);
  ctx.quadraticCurveTo(438, 370, 428, 382);
  ctx.quadraticCurveTo(418, 370, 428, 358);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,210,225,0.75)';
  ctx.beginPath();
  ctx.arc(428 + Math.sin(t * 1.4) * 6, 306, 12, 0, Math.PI * 2);
  ctx.arc(440 + Math.sin(t * 1.4) * 6, 288, 9, 0, Math.PI * 2);
  ctx.arc(450 + Math.sin(t * 1.4) * 6, 272, 7, 0, Math.PI * 2);
  ctx.fill();
  // Mushrooms, butterfly and stream.
  ctx.fillStyle = '#f2f4f8';
  ctx.fillRect(488, 408, 5, 12);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(490, 406, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f2f4f8';
  ctx.fillRect(508, 412, 4, 9);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(510, 410, 8, Math.PI, 0);
  ctx.fill();
  const bx = 372 + Math.sin(t * 1.8) * 8;
  const by = 150 + Math.cos(t * 2.3) * 6;
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, bx - 11, by, 10, 14);
  ellipse(ctx, bx + 11, by, 10, 14);
  ctx.fillStyle = '#5b3a1e';
  ellipse(ctx, bx, by, 3, 10);
  ctx.strokeStyle = '#7fb3d5';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 452);
  ctx.quadraticCurveTo(280, 436, 560, 452);
  ctx.stroke();
  if (altered) for (const d of FOREST_DIFFS) d.apply(ctx, t);
}

const PAINTERS = [paintHarbor, paintMarket, paintForest];
const DIFF_SETS = [HARBOR_DIFFS, MARKET_DIFFS, FOREST_DIFFS];

// ------------------------------------------------------------------ world

export function diffsOf(levelIndex) {
  return DIFF_SETS[levelIndex] ?? HARBOR_DIFFS;
}

export function createWorld(random) {
  const state = {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    found: [],
    score: 0,
    totalScore: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: LEVELS[0].seconds,
    timeTotal: LEVELS[0].seconds,
    hintsLeft: HINT.perLevel,
    hintCooldown: 0,
    hintPulse: null,
    shake: 0,
    wrongFlash: 0,
    message: 'Find every difference before the clock runs out.',
    messageT: 0,
    popups: [],
    levelScores: [],
    unlocked: 0,
    animTime: 0,
    clearBonus: 0,
  };

  function level() {
    return LEVELS[state.levelIndex];
  }

  function diffs() {
    return diffsOf(state.levelIndex);
  }

  function remaining() {
    return diffs().length - state.found.length;
  }

  function startLevel(index) {
    state.levelIndex = index;
    state.found = [];
    state.score = 0;
    state.combo = 0;
    state.timeLeft = LEVELS[index].seconds;
    state.timeTotal = LEVELS[index].seconds;
    state.hintsLeft = HINT.perLevel;
    state.hintCooldown = 0;
    state.hintPulse = null;
    state.popups = [];
    state.screen = SCREEN_PLAY;
    state.message = `${LEVELS[index].name} — find ${LEVELS[index].diffs} differences!`;
    state.messageT = 3;
  }

  function useHint() {
    if (state.screen !== SCREEN_PLAY) return 0;
    if (state.hintsLeft <= 0 || state.hintCooldown > 0) return 0;
    const unfound = diffs().filter((d) => !state.found.includes(d.id));
    if (unfound.length === 0) return 0;
    const pick = unfound[Math.floor(random.next() * unfound.length)];
    state.hintPulse = { id: pick.id, x: pick.x, y: pick.y, t: HINT.pulseSeconds };
    state.hintsLeft -= 1;
    state.hintCooldown = HINT.cooldownSeconds;
    state.message = `Hint: look near the ${pick.name.toLowerCase()}…`;
    state.messageT = 3;
    return EVENT_HINT;
  }

  // Click in scene coordinates (0..PANEL.width, 0..PANEL.height) on either
  // panel; both panels share the same coordinates, so one test covers both.
  function clickAt(x, y) {
    if (state.screen !== SCREEN_PLAY) return 0;
    if (x < 0 || y < 0 || x > PANEL.width || y > PANEL.height) return 0;
    let best = null;
    let bestDist = Infinity;
    for (const d of diffs()) {
      if (state.found.includes(d.id)) continue;
      const dist = Math.hypot(d.x - x, d.y - y);
      if (dist < d.r && dist < bestDist) {
        best = d;
        bestDist = dist;
      }
    }
    if (!best) {
      state.combo = 0;
      state.timeLeft = Math.max(0, state.timeLeft - SCORE.wrongTimePenalty);
      state.shake = 0.4;
      state.wrongFlash = 0.5;
      state.message = `Not there — minus ${SCORE.wrongTimePenalty}s!`;
      state.messageT = 2;
      if (state.timeLeft <= 0) {
        state.screen = SCREEN_OVER;
        return EVENT_WRONG | EVENT_OVER;
      }
      return EVENT_WRONG;
    }
    state.found.push(best.id);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const points = SCORE.findBase + SCORE.comboStep * Math.min(state.combo - 1, SCORE.maxCombo);
    state.score += points;
    state.popups.push({ x: best.x, y: best.y, text: `+${points}`, t: 1.1, combo: state.combo });
    state.message = `Found: ${best.name}! (${state.found.length}/${diffs().length})`;
    state.messageT = 2;
    if (state.found.length === diffs().length) {
      state.clearBonus = Math.ceil(state.timeLeft) * SCORE.levelClearTimeBonus;
      state.score += state.clearBonus;
      state.totalScore += state.score;
      state.levelScores[state.levelIndex] = state.score;
      state.unlocked = Math.max(state.unlocked, Math.min(state.levelIndex + 1, LEVELS.length - 1));
      state.screen = state.levelIndex === LEVELS.length - 1 ? SCREEN_DONE : SCREEN_CLEAR;
      return EVENT_FOUND | EVENT_CLEAR;
    }
    return EVENT_FOUND;
  }

  function step(dt) {
    state.animTime += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.wrongFlash > 0) state.wrongFlash = Math.max(0, state.wrongFlash - dt);
    if (state.messageT > 0) state.messageT = Math.max(0, state.messageT - dt);
    if (state.hintCooldown > 0) state.hintCooldown = Math.max(0, state.hintCooldown - dt);
    if (state.hintPulse) {
      state.hintPulse.t -= dt;
      if (state.hintPulse.t <= 0) state.hintPulse = null;
    }
    for (const p of state.popups) p.t -= dt;
    state.popups = state.popups.filter((p) => p.t > 0);
    if (state.screen !== SCREEN_PLAY) return 0;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.screen = SCREEN_OVER;
      state.message = 'Time up!';
      return EVENT_OVER;
    }
    return 0;
  }

  // Paint one panel's scene: altered=false is the original (left),
  // altered=true is the changed copy (right).
  function paintScene(ctx, altered) {
    PAINTERS[state.levelIndex](ctx, altered, state.animTime);
  }

  function reset() {
    state.screen = SCREEN_TITLE;
    state.levelIndex = 0;
    state.totalScore = 0;
    state.levelScores = [];
    state.unlocked = 0;
    startLevel(0);
    state.screen = SCREEN_TITLE;
  }

  return {
    state,
    level,
    diffs,
    remaining,
    startLevel,
    useHint,
    clickAt,
    step,
    paintScene,
    reset,
  };
}
