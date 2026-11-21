// The game world: eleven procedural scenes, the planted differences,
// and the rules — find them all before the clock runs out.
//
// Each scene is drawn twice from the same painter: once as the original
// (left panel) and once altered (right panel), where every planted
// difference's `apply` redraws its own spot. Nothing is an image file;
// every cloud, boat, lantern and pine is vector shapes on a canvas, so
// the two panels are identical except for the differences on purpose.
//
// A difference is { id, name, x, y, r, apply }: x/y/r live in scene
// coordinates (560x470, see PANEL in config.js); apply(ctx, t) repaints
// that spot the altered way. A click within r of an unfound difference
// finds it on both panels at once.
//
// v2: eleven sunny scenes in one cheerful palette — bright sky blue,
// sunny yellow, coral, mint and warm cream. Every scene is dense: more
// objects, animals, decorations and small activities, so each frame is
// busy and worth studying (the TABUH lesson: ramai + ada isinya).
// v4: the opening hunt is a sunny playground (see paintPlayground), and
// the found rings are the concept's bold red circles (see render.js).

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

// A five-petal flower: stem, leaves and a bright centre.
function flower(ctx, x, y, s, petal, center) {
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 22 * s);
  ctx.stroke();
  ctx.fillStyle = '#2f9e44';
  ellipse(ctx, x - 7 * s, y + 14 * s, 7 * s, 3.5 * s);
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ellipse(ctx, x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7 * s, 7 * s);
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(x, y, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

// A butterfly with two wing pairs; wings flutter with time t.
function butterfly(ctx, x, y, s, color, t) {
  const flap = 0.7 + 0.3 * Math.sin(t * 6 + x);
  ctx.fillStyle = color;
  ellipse(ctx, x - 11 * s * flap, y, 10 * s, 13 * s);
  ellipse(ctx, x + 11 * s * flap, y, 10 * s, 13 * s);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, x - 11 * s * flap, y - 3 * s, 3.5 * s, 4.5 * s);
  ellipse(ctx, x + 11 * s * flap, y - 3 * s, 3.5 * s, 4.5 * s);
  ctx.fillStyle = '#2e2a26';
  ellipse(ctx, x, y, 3 * s, 10 * s);
}

// A smiling sun: disc plus short rays.
function sun(ctx, x, y, r, rayColor) {
  ctx.strokeStyle = rayColor;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r + 8), y + Math.sin(a) * (r + 8));
    ctx.lineTo(x + Math.cos(a) * (r + 20), y + Math.sin(a) * (r + 20));
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A small songbird in flight: body, head, beak, wing and tail.
function bird(ctx, x, y, color) {
  ctx.fillStyle = color;
  ellipse(ctx, x, y, 12, 8);
  ctx.beginPath();
  ctx.arc(x + 9, y - 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(x + 14, y - 6);
  ctx.lineTo(x + 20, y - 3);
  ctx.lineTo(x + 14, y - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 4);
  ctx.quadraticCurveTo(x - 2, y - 16, x + 6, y - 12);
  ctx.quadraticCurveTo(x + 2, y - 4, x - 4, y - 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 11, y + 2);
  ctx.lineTo(x - 20, y + 8);
  ctx.lineTo(x - 12, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(x + 10, y - 6, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, x - 2, y + 3, 5, 3);
}

// A striped hot-air balloon: envelope, basket and strings.
function balloon(ctx, x, y, stripe) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 27, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = stripe;
  ctx.fillRect(x - 22, y - 27, 44, 54);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(x - 11, y - 27, 11, 54);
  ctx.fillRect(x + 7, y - 27, 8, 54);
  ctx.restore();
  ctx.strokeStyle = '#8a6b46';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 27, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 22);
  ctx.lineTo(x - 8, y + 38);
  ctx.moveTo(x + 12, y + 22);
  ctx.lineTo(x + 8, y + 38);
  ctx.stroke();
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(x - 8, y + 38, 16, 10);
}

// A soccer ball: white with dark (or red) pentagon patches.
function soccerBall(ctx, x, y, r, patch) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = patch;
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * 7;
    const py = y + Math.sin(a) * 7;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  for (const a of [0.4, 1.8, 3.0, 4.4, 5.6]) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3), 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

// A four-point sparkle star.
function sparkle(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 10 * s);
  ctx.quadraticCurveTo(x + 3 * s, y - 3 * s, x + 10 * s, y);
  ctx.quadraticCurveTo(x + 3 * s, y + 3 * s, x, y + 10 * s);
  ctx.quadraticCurveTo(x - 3 * s, y + 3 * s, x - 10 * s, y);
  ctx.quadraticCurveTo(x - 3 * s, y - 3 * s, x, y - 10 * s);
  ctx.fill();
}

// The bright day sky every scene shares, so a repainted patch blends in.
function daySky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#7ec8f7');
  sky.addColorStop(1, '#dff2fa');
  return sky;
}

function skyPatch(ctx, x, y, r) {
  ctx.fillStyle = daySky(ctx);
  ctx.beginPath();
  ctx.arc(x, y, r + 6, 0, Math.PI * 2);
  ctx.fill();
}

// --- Level 1: Sunny Playground ------------------------------------------
// v4: the opening hunt is the concept's playground — a boy in blue, a
// girl in pink, their brown-and-white dog, a yellow slide under a red
// roof, a smiling sun and a hot-air balloon over a city skyline. Seven
// differences, each a colour or an accessory the altered panel repaints
// in place, so the two panels match everywhere else.
const PLAYGROUND_DIFFS = [
  {
    id: 'sun-glasses', name: 'Sun sunglasses', x: 330, y: 76, r: 30,
    apply(ctx) {
      // Cool shades over the smiling sun: two black lenses, a bridge
      // and arms. Additive only — the sun's face stays underneath.
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.roundRect(310, 66, 18, 13, 5);
      ctx.roundRect(332, 66, 18, 13, 5);
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(328, 72);
      ctx.lineTo(332, 72);
      ctx.moveTo(310, 70);
      ctx.lineTo(304, 66);
      ctx.moveTo(350, 70);
      ctx.lineTo(356, 66);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(313, 68, 5, 4);
      ctx.fillRect(335, 68, 5, 4);
    },
  },
  {
    id: 'balloon-color', name: 'Balloon stripes', x: 485, y: 100, r: 28,
    apply(ctx) {
      // The same balloon, repainted blue-white over the red-white one.
      balloon(ctx, 485, 100, '#3f7dff');
    },
  },
  {
    id: 'bird-color', name: 'Bird colour', x: 140, y: 100, r: 26,
    apply(ctx) {
      // The same little bird, repainted red over the blue one.
      bird(ctx, 140, 100, '#e5534b');
    },
  },
  {
    id: 'flag-color', name: 'Roof flag', x: 292, y: 147, r: 20,
    apply(ctx) {
      // The same little flag on the play-structure roof, now blue.
      ctx.fillStyle = '#3f7dff';
      ctx.beginPath();
      ctx.moveTo(280, 140);
      ctx.lineTo(306, 147);
      ctx.lineTo(280, 154);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'ball-color', name: 'Soccer ball', x: 195, y: 395, r: 26,
    apply(ctx) {
      // The same ball, repainted with red patches over the black ones.
      soccerBall(ctx, 195, 395, 22, '#e5484d');
    },
  },
  {
    id: 'collar-color', name: 'Dog collar', x: 318, y: 396, r: 22,
    apply(ctx) {
      // The same collar band, repainted blue over the red one, tag kept.
      ctx.strokeStyle = '#3f7dff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(318, 392, 10, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(318, 402, 3.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'flower-color', name: 'Flower colour', x: 60, y: 440, r: 22,
    apply(ctx) {
      // The same bottom-left flower, repainted purple over white.
      flower(ctx, 60, 440, 0.9, '#9b5de5', '#ffd166');
    },
  },
];

function paintPlayground(ctx, altered, t) {
  // A sunny playground: blue sky, a smiling sun, a city skyline, a big
  // tree, a red-roofed play structure with a yellow slide, and two
  // children and their dog playing with a soccer ball on the grass.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 470);
  // Smiling sun with rays, cheeks and a smile.
  sun(ctx, 330, 76, 26, '#f2b705');
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(322, 72, 3, 0, Math.PI * 2);
  ctx.arc(338, 72, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(330, 80, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#ff9f9f';
  ellipse(ctx, 312, 82, 5, 3.5);
  ellipse(ctx, 348, 82, 5, 3.5);
  // Clouds, a songbird, a gull and a hot-air balloon.
  cloud(ctx, 80, 58, 0.9, '#ffffff');
  cloud(ctx, 210, 42, 0.7, '#ffffff');
  cloud(ctx, 440, 52, 0.6, '#f4fbff');
  bird(ctx, 140, 100, '#3f7dff');
  gull(ctx, 250, 70, '#33506b');
  balloon(ctx, 485, 100, '#e5534b');
  sparkle(ctx, 500, 56, 0.8, '#ffffff');
  // City skyline behind the fence.
  const towers = [
    [56, 186, 42, 76, '#8fa8c8'],
    [106, 168, 34, 94, '#7a9cc0'],
    [362, 178, 44, 84, '#8fa8c8'],
    [412, 158, 36, 104, '#7a9cc0'],
    [454, 192, 40, 70, '#9db4d4'],
    [500, 172, 34, 90, '#8fa8c8'],
  ];
  for (const [tx, ty, tw, th, tc] of towers) {
    ctx.fillStyle = tc;
    ctx.fillRect(tx, ty, tw, th);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let wy = ty + 12; wy < ty + th - 8; wy += 18) {
      for (let wx = tx + 7; wx < tx + tw - 6; wx += 13) {
        ctx.fillRect(wx, wy, 6, 8);
      }
    }
  }
  // Green grass.
  ctx.fillStyle = '#6fce7e';
  ctx.fillRect(0, 262, 560, 208);
  ctx.fillStyle = '#57b368';
  ellipse(ctx, 120, 452, 90, 14);
  ellipse(ctx, 460, 458, 110, 14);
  // White picket fence across the lawn.
  ctx.fillStyle = '#fffdf5';
  for (let x = 8; x <= 548; x += 26) {
    ctx.fillRect(x, 232, 14, 32);
    ctx.beginPath();
    ctx.moveTo(x, 232);
    ctx.lineTo(x + 7, 222);
    ctx.lineTo(x + 14, 232);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(0, 246, 560, 5);
  // Big tree on the left.
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(28, 150, 16, 115);
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.arc(60, 108, 46, 0, Math.PI * 2);
  ctx.arc(20, 140, 34, 0, Math.PI * 2);
  ctx.arc(104, 142, 34, 0, Math.PI * 2);
  ctx.arc(60, 78, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#35b04a';
  ctx.beginPath();
  ctx.arc(44, 96, 20, 0, Math.PI * 2);
  ctx.arc(84, 128, 16, 0, Math.PI * 2);
  ctx.fill();
  // Bushes on the right.
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.arc(520, 236, 28, 0, Math.PI * 2);
  ctx.arc(548, 220, 22, 0, Math.PI * 2);
  ctx.fill();
  // Play structure: yellow posts, red roof, a little flag.
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(226, 210, 10, 120);
  ctx.fillRect(324, 210, 10, 120);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(210, 212);
  ctx.lineTo(280, 158);
  ctx.lineTo(350, 212);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(218, 250, 124, 12);
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(278, 128, 3, 32);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(280, 140);
  ctx.lineTo(306, 147);
  ctx.lineTo(280, 154);
  ctx.closePath();
  ctx.fill();
  // Blue railing along the platform's back.
  ctx.fillStyle = '#3f7dff';
  ctx.fillRect(222, 232, 116, 6);
  for (const rx of [228, 280, 332]) ctx.fillRect(rx, 232, 5, 20);
  // Yellow slide down to the left.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(222, 258);
  ctx.lineTo(234, 268);
  ctx.lineTo(184, 340);
  ctx.lineTo(170, 330);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8b96a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(222, 258);
  ctx.lineTo(170, 330);
  ctx.moveTo(234, 268);
  ctx.lineTo(184, 340);
  ctx.stroke();
  // Red stairs up on the right.
  ctx.fillStyle = '#e5534b';
  const steps = [[352, 318], [346, 304], [340, 290], [334, 276], [328, 262]];
  for (const [sx, sy] of steps) ctx.fillRect(sx, sy, 26, 10);
  ctx.fillStyle = '#fffdf5';
  for (const [sx, sy] of steps) ctx.fillRect(sx, sy, 26, 3);
  // Boy in blue, running after the ball.
  ctx.strokeStyle = '#f2c9a0';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 334);
  ctx.lineTo(70, 350);
  ctx.moveTo(122, 334);
  ctx.lineTo(138, 320);
  ctx.moveTo(96, 380);
  ctx.lineTo(82, 402);
  ctx.moveTo(114, 380);
  ctx.lineTo(130, 398);
  ctx.stroke();
  ctx.fillStyle = '#3f7dff';
  ctx.beginPath();
  ctx.roundRect(86, 326, 38, 42, 10);
  ctx.fill();
  sparkle(ctx, 105, 344, 1.1, '#ffffff');
  ctx.fillStyle = '#2f5fc4';
  ctx.fillRect(88, 366, 34, 14);
  ctx.fillStyle = '#3f7dff';
  ellipse(ctx, 80, 404, 10, 6);
  ellipse(ctx, 132, 400, 10, 6);
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(105, 302, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(105, 300, 23, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(90, 282, 8, 0, Math.PI * 2);
  ctx.arc(105, 278, 9, 0, Math.PI * 2);
  ctx.arc(120, 283, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(97, 300, 2.5, 0, Math.PI * 2);
  ctx.arc(113, 300, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(105, 306, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#ff9f9f';
  ellipse(ctx, 92, 308, 4, 3);
  ellipse(ctx, 118, 308, 4, 3);
  // Girl in pink, chasing the dog.
  ctx.strokeStyle = '#f2c9a0';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(432, 332);
  ctx.lineTo(416, 348);
  ctx.moveTo(464, 332);
  ctx.lineTo(480, 318);
  ctx.moveTo(438, 372);
  ctx.lineTo(428, 396);
  ctx.moveTo(458, 372);
  ctx.lineTo(470, 394);
  ctx.stroke();
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.moveTo(430, 324);
  ctx.lineTo(466, 324);
  ctx.lineTo(478, 372);
  ctx.lineTo(418, 372);
  ctx.closePath();
  ctx.fill();
  flower(ctx, 448, 344, 0.5, '#ffffff', '#ffd166');
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 426, 398, 10, 6);
  ellipse(ctx, 472, 396, 10, 6);
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(448, 298, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(448, 296, 23, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(470, 292, 9, 0, Math.PI * 2);
  ctx.arc(474, 308, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.moveTo(428, 278);
  ctx.lineTo(414, 268);
  ctx.lineTo(414, 288);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(428, 278);
  ctx.lineTo(442, 268);
  ctx.lineTo(442, 288);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(428, 278, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(440, 296, 2.5, 0, Math.PI * 2);
  ctx.arc(456, 296, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(448, 302, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#ff9f9f';
  ellipse(ctx, 435, 304, 4, 3);
  ellipse(ctx, 461, 304, 4, 3);
  // Their brown-and-white dog, tongue out, red collar.
  ctx.fillStyle = '#fffdf5';
  ellipse(ctx, 300, 408, 30, 16);
  ctx.fillStyle = '#b07a45';
  ellipse(ctx, 312, 402, 12, 8);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(278, 420, 6, 12);
  ctx.fillRect(292, 420, 6, 12);
  ctx.fillRect(308, 420, 6, 12);
  ctx.fillRect(320, 420, 6, 12);
  ctx.save();
  ctx.translate(262, 392);
  ctx.rotate(-0.6);
  ellipse(ctx, 0, 0, 9, 4);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(328, 390, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b07a45';
  ellipse(ctx, 318, 384, 5, 9);
  ellipse(ctx, 338, 384, 5, 9);
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(340, 388, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(332, 386, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 334, 400, 4, 6);
  ctx.strokeStyle = '#e5534b';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(318, 392, 10, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(318, 402, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // The soccer ball between the boy and the dog.
  soccerBall(ctx, 195, 395, 22, '#2e2a26');
  // Flowers along the bottom, and a fluttering butterfly.
  flower(ctx, 60, 440, 0.9, '#ffffff', '#ffd166');
  flower(ctx, 130, 448, 0.8, '#ff8fc7', '#ffd166');
  flower(ctx, 480, 445, 0.9, '#ffd166', '#ff6b4a');
  flower(ctx, 520, 432, 0.8, '#ffffff', '#ff8fc7');
  flower(ctx, 25, 452, 0.7, '#ff8fc7', '#ffd166');
  flower(ctx, 350, 452, 0.8, '#ffffff', '#ffd166');
  butterfly(ctx, 380, 170, 0.9, '#ffd166', t);
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 2;
  for (const [gx, gy] of [[90, 460], [250, 455], [420, 458]]) {
    ctx.beginPath();
    ctx.moveTo(gx - 6, gy);
    ctx.quadraticCurveTo(gx, gy - 8, gx + 6, gy);
    ctx.stroke();
  }
  if (altered) for (const d of PLAYGROUND_DIFFS) d.apply(ctx, t);
}

// --- Level 2: Sunny Street Market ----------------------------------------
const MARKET_DIFFS = [
  {
    id: 'sun-rays', name: 'Sun rays', x: 478, y: 62, r: 34,
    apply(ctx) {
      ctx.fillStyle = daySky(ctx);
      ctx.beginPath();
      ctx.arc(478, 62, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(478, 62, 26, 0, Math.PI * 2);
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
      ctx.fillStyle = '#ffd166';
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
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LEMON', 300, 263);
    },
  },
  {
    id: 'basket-missing', name: 'Fruit basket', x: 452, y: 372, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#f7e8c8';
      ctx.fillRect(428, 348, 50, 40);
    },
  },
  {
    id: 'balloon-color', name: 'Balloon', x: 400, y: 117, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ff6b4a';
      ellipse(ctx, 400, 117, 11, 14);
      ctx.strokeStyle = '#2e2a26';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(400, 131);
      ctx.quadraticCurveTo(396, 142, 402, 150);
      ctx.stroke();
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
  // Bright daytime street: blue sky, smiling sun, bunting and balloons.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 470);
  sun(ctx, 478, 62, 26, '#f2b705');
  cloud(ctx, 90, 70, 0.9, '#ffffff');
  cloud(ctx, 300, 44, 0.7, '#ffffff');
  cloud(ctx, 180, 120, 0.6, '#f4fbff');
  gull(ctx, 140, 90, '#33506b');
  gull(ctx, 210, 60, '#33506b');
  // Bunting flags strung across the street.
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.quadraticCurveTo(280, 142, 560, 96);
  ctx.stroke();
  const bunting = ['#ff6b4a', '#ffd166', '#39c26d', '#3f7dff', '#ff8fc7'];
  for (let i = 0; i < 9; i += 1) {
    const bx = 40 + i * 60;
    const by = 96 + Math.sin((bx / 560) * Math.PI) * 26;
    ctx.fillStyle = bunting[i % bunting.length];
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.lineTo(bx + 10, by);
    ctx.lineTo(bx, by + 18);
    ctx.closePath();
    ctx.fill();
  }
  // A balloon tied to the first stall.
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 400, 117, 11, 14);
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(400, 131);
  ctx.quadraticCurveTo(396, 142, 402, 150);
  ctx.stroke();
  // Three stalls with sunny awnings.
  stall(ctx, 48, 130, '#ff6b4a', '#fff7e0', '#7a4a2b');
  stall(ctx, 232, 130, '#3f7dff', '#fff7e0', '#7a4a2b');
  stall(ctx, 416, 110, '#39c26d', '#fff7e0', '#7a4a2b');
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
  ctx.fillText('JUICE', 300, 263);
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
  // Goods on the counters: oranges, jars, baskets, flowers.
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
  flower(ctx, 60, 330, 0.8, '#ff8fc7', '#ffd166');
  flower(ctx, 500, 330, 0.8, '#ff6b4a', '#ffd166');
  flower(ctx, 520, 344, 0.7, '#ffd166', '#ff6b4a');
  // Sunny cobblestones at the bottom.
  ctx.fillStyle = '#f7e8c8';
  ctx.fillRect(0, 392, 560, 78);
  ctx.strokeStyle = 'rgba(180,140,60,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(40 + i * 70, 420, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (altered) for (const d of MARKET_DIFFS) d.apply(ctx, t);
}

// --- Level 3: Sunny Meadow ------------------------------------------------
const MEADOW_DIFFS = [
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
      skyPatch(ctx, 96, 128, 22);
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
      ctx.fillStyle = '#57b368';
      ellipse(ctx, 492, 418, 20, 12);
    },
  },
  {
    id: 'backpack-missing', name: 'Backpack', x: 168, y: 392, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#57b368';
      ellipse(ctx, 168, 392, 26, 18);
    },
  },
  {
    id: 'sun-ray', name: 'Sun ray', x: 448, y: 66, r: 26,
    apply(ctx) {
      skyPatch(ctx, 448, 66, 18);
      sun(ctx, 470, 60, 22, '#f2b705');
    },
  },
  {
    id: 'butterfly-color', name: 'Butterfly', x: 372, y: 150, r: 26,
    apply(ctx, t) {
      // The scene butterfly stays put (only its wings flutter), so the
      // repaint must sit on the same spot, same flutter phase.
      skyPatch(ctx, 372, 150, 26);
      butterfly(ctx, 372, 150, 1, '#9b5de5', t);
    },
  },
  {
    id: 'log-missing', name: 'Fire log', x: 448, y: 396, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#57b368';
      ctx.fillRect(434, 388, 34, 12);
    },
  },
  {
    id: 'cloud-extra', name: 'Extra cloud', x: 428, y: 300, r: 30,
    apply(ctx) { cloud(ctx, 428, 300, 0.6, '#ffffff'); },
  },
  {
    id: 'boots-missing', name: 'Boots', x: 356, y: 392, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#57b368';
      ellipse(ctx, 356, 392, 22, 12);
    },
  },
];

function paintMeadow(ctx, altered, t) {
  // A bright sunny meadow: blue sky, big sun, flower-dotted green grass.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 300);
  sun(ctx, 470, 60, 24, '#f2b705');
  cloud(ctx, 90, 60, 0.9, '#ffffff');
  cloud(ctx, 260, 44, 0.7, '#ffffff');
  cloud(ctx, 380, 110, 0.6, '#f4fbff');
  gull(ctx, 150, 80, '#33506b');
  gull(ctx, 220, 110, '#33506b');
  // Rolling green hills and a flower meadow.
  ctx.fillStyle = '#57b368';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  for (let x = 0; x <= 560; x += 40) ctx.lineTo(x, 268 + ((x * 7) % 23));
  ctx.lineTo(560, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6fce7e';
  ctx.fillRect(0, 300, 560, 170);
  ctx.fillStyle = '#57b368';
  ellipse(ctx, 120, 430, 90, 18);
  ellipse(ctx, 460, 440, 110, 20);
  flower(ctx, 60, 420, 0.9, '#ff8fc7', '#ffd166');
  flower(ctx, 120, 380, 0.8, '#ffd166', '#ff6b4a');
  flower(ctx, 200, 430, 0.9, '#ffffff', '#ffd166');
  flower(ctx, 470, 400, 0.8, '#ff8fc7', '#ffd166');
  flower(ctx, 530, 430, 0.9, '#ffd166', '#ff6b4a');
  flower(ctx, 30, 360, 0.7, '#ffffff', '#ff8fc7');
  // Big pines left and right.
  pine(ctx, 70, 300, 1.5, '#2f9e44');
  pine(ctx, 510, 310, 1.3, '#2a8a3a');
  pine(ctx, 150, 260, 0.9, '#35b04a');
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
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
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
  butterfly(ctx, 372, 150, 1, '#ffd166', t);
  butterfly(ctx, 90, 220, 0.8, '#ff8fc7', t + 2);
  ctx.strokeStyle = '#7fb3d5';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 452);
  ctx.quadraticCurveTo(280, 436, 560, 452);
  ctx.stroke();
  if (altered) for (const d of MEADOW_DIFFS) d.apply(ctx, t);
}

// --- Level 4: Rainbow Garden ---------------------------------------------
const GARDEN_DIFFS = [
  {
    id: 'rainbow-band', name: 'Rainbow band', x: 280, y: 140, r: 30,
    apply(ctx) {
      ctx.strokeStyle = '#ff8fc7';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(280, 320, 177, Math.PI * 1.35, Math.PI * 1.65);
      ctx.stroke();
    },
  },
  {
    id: 'sunflower-missing', name: 'Sunflower', x: 470, y: 390, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ellipse(ctx, 470, 390, 26, 30);
    },
  },
  {
    id: 'birdhouse-door', name: 'Birdhouse door', x: 90, y: 205, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#2e2a26';
      ctx.fillRect(83, 198, 14, 14);
    },
  },
  {
    id: 'watering-can', name: 'Watering can', x: 430, y: 380, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#ff6b4a';
      ctx.beginPath();
      ctx.ellipse(430, 380, 24, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff6b4a';
      ctx.fillRect(448, 372, 22, 6);
    },
  },
  {
    id: 'bee-missing', name: 'Bee', x: 350, y: 90, r: 22,
    apply(ctx) { skyPatch(ctx, 350, 90, 14); },
  },
  {
    id: 'tulip-color', name: 'Tulip', x: 150, y: 350, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#3f7dff';
      ellipse(ctx, 150, 342, 9, 12);
      ellipse(ctx, 143, 348, 7, 10);
      ellipse(ctx, 157, 348, 7, 10);
    },
  },
  {
    id: 'fence-plank', name: 'Fence plank', x: 250, y: 305, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ctx.fillRect(242, 288, 16, 34);
    },
  },
  {
    id: 'butterfly-color', name: 'Butterfly', x: 300, y: 180, r: 26,
    apply(ctx, t) {
      // Same spot and flutter phase as the scene butterfly, only purple.
      skyPatch(ctx, 300, 180, 26);
      butterfly(ctx, 300, 180, 1, '#9b5de5', t);
    },
  },
];

function paintGarden(ctx, altered, t) {
  // A flower garden under a big rainbow: beds, fence, birdhouse, bees.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 300);
  sun(ctx, 480, 58, 24, '#f2b705');
  cloud(ctx, 90, 70, 0.9, '#ffffff');
  cloud(ctx, 400, 40, 0.6, '#ffffff');
  gull(ctx, 180, 90, '#33506b');
  // Rainbow arcs over the garden.
  const bands = ['#ff6b4a', '#ff9f43', '#ffd166', '#39c26d', '#3f7dff', '#9b5de5'];
  for (let i = 0; i < 6; i += 1) {
    ctx.strokeStyle = bands[i];
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(280, 320, 200 - i * 15, Math.PI, 0);
    ctx.stroke();
  }
  // Green lawn with flower beds.
  ctx.fillStyle = '#6fce7e';
  ctx.fillRect(0, 300, 560, 170);
  ctx.fillStyle = '#57b368';
  ellipse(ctx, 120, 440, 100, 18);
  ellipse(ctx, 460, 445, 110, 18);
  // Picket fence across the lawn.
  ctx.fillStyle = '#fffdf5';
  for (let x = 30; x <= 530; x += 26) {
    ctx.fillRect(x, 288, 14, 34);
    ctx.beginPath();
    ctx.moveTo(x, 288);
    ctx.lineTo(x + 7, 278);
    ctx.lineTo(x + 14, 288);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(24, 300, 512, 5);
  // Flower rows: tulips, daisies, sunflowers.
  flower(ctx, 90, 350, 0.9, '#ff6b4a', '#ffd166');
  flower(ctx, 150, 350, 0.9, '#ff6b4a', '#ffd166');
  flower(ctx, 210, 350, 0.9, '#ff8fc7', '#ffd166');
  flower(ctx, 270, 350, 0.9, '#ffffff', '#ffd166');
  flower(ctx, 330, 350, 0.9, '#ff8fc7', '#ffd166');
  flower(ctx, 390, 350, 0.9, '#ff6b4a', '#ffd166');
  // Sunflowers along the back.
  for (const sx of [60, 470, 520]) {
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, 400);
    ctx.lineTo(sx, 372);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ellipse(ctx, sx + Math.cos(a) * 10, 366 + Math.sin(a) * 10, 6, 6);
    }
    ctx.fillStyle = '#7a4a2b';
    ctx.beginPath();
    ctx.arc(sx, 366, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Birdhouse on a pole.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(86, 216, 8, 70);
  ctx.fillStyle = '#ff6b4a';
  ctx.fillRect(66, 180, 48, 38);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(62, 180);
  ctx.lineTo(90, 162);
  ctx.lineTo(118, 180);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(90, 205, 7, 0, Math.PI * 2);
  ctx.fill();
  // Watering can and wheelbarrow.
  ctx.fillStyle = '#39c26d';
  ctx.beginPath();
  ctx.ellipse(430, 380, 24, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(448, 372, 22, 6);
  ctx.fillStyle = '#2f9e44';
  ctx.fillRect(408, 366, 8, 8);
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.moveTo(160, 410);
  ctx.lineTo(230, 410);
  ctx.lineTo(220, 436);
  ctx.lineTo(170, 436);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(170, 436, 7, 0, Math.PI * 2);
  ctx.arc(220, 436, 7, 0, Math.PI * 2);
  ctx.fill();
  flower(ctx, 185, 404, 0.7, '#ff8fc7', '#ffd166');
  flower(ctx, 205, 404, 0.7, '#ffd166', '#ff6b4a');
  // Bees and butterflies.
  for (const [bx, by] of [[200, 120], [350, 90]]) {
    ctx.fillStyle = '#ffd166';
    ellipse(ctx, bx, by, 7, 5);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 2, by - 4);
    ctx.lineTo(bx - 2, by + 4);
    ctx.moveTo(bx + 2, by - 4);
    ctx.lineTo(bx + 2, by + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(ctx, bx - 3, by - 7, 4, 3);
    ellipse(ctx, bx + 3, by - 7, 4, 3);
  }
  butterfly(ctx, 300, 180, 1, '#ffd166', t);
  butterfly(ctx, 450, 150, 0.8, '#ff8fc7', t + 3);
  // Stepping stones.
  ctx.fillStyle = '#fffdf5';
  for (const [sx, sy] of [[270, 440], [300, 452], [330, 440], [360, 452]]) {
    ellipse(ctx, sx, sy, 16, 7);
  }
  if (altered) for (const d of GARDEN_DIFFS) d.apply(ctx, t);
}

// --- Level 5: Beach Party -------------------------------------------------
const BEACH_DIFFS = [
  {
    id: 'umbrella-stripe', name: 'Umbrella stripe', x: 140, y: 270, r: 30,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.moveTo(140, 252);
      ctx.lineTo(168, 252);
      ctx.lineTo(154, 282);
      ctx.lineTo(140, 282);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'crab-missing', name: 'Crab', x: 200, y: 430, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ffe1a0';
      ellipse(ctx, 200, 430, 26, 16);
    },
  },
  {
    id: 'starfish-color', name: 'Starfish', x: 480, y: 440, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ff8fc7';
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = a + Math.PI / 5;
        ctx.lineTo(480 + Math.cos(a) * 16, 440 + Math.sin(a) * 16);
        ctx.lineTo(480 + Math.cos(a2) * 7, 440 + Math.sin(a2) * 7);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'surfboard-stripe', name: 'Surfboard stripe', x: 500, y: 330, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ff6b4a';
      ctx.fillRect(492, 318, 16, 10);
    },
  },
  {
    id: 'castle-flag', name: 'Sandcastle flag', x: 300, y: 365, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#ffe1a0';
      ctx.fillRect(292, 348, 22, 24);
    },
  },
  {
    id: 'ball-stripe', name: 'Beach ball stripe', x: 420, y: 400, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#39c26d';
      ctx.beginPath();
      ctx.moveTo(420, 378);
      ctx.lineTo(438, 392);
      ctx.lineTo(420, 414);
      ctx.lineTo(404, 400);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'palm-coconuts', name: 'Palm coconuts', x: 520, y: 290, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#7ec8f7';
      ctx.beginPath();
      ctx.arc(514, 292, 10, 0, Math.PI * 2);
      ctx.arc(528, 294, 10, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'icecream-scoop', name: 'Ice cream scoop', x: 90, y: 360, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#7fe0a8';
      ctx.beginPath();
      ctx.arc(90, 356, 10, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'towel-stripe', name: 'Towel stripe', x: 250, y: 430, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(226, 420, 48, 8);
    },
  },
];

function paintBeach(ctx, altered, t) {
  // A sunny beach party: blue sea, golden sand, umbrella, castle, cart.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 260);
  sun(ctx, 480, 58, 26, '#f2b705');
  cloud(ctx, 90, 70, 0.9, '#ffffff');
  cloud(ctx, 280, 44, 0.7, '#ffffff');
  gull(ctx, 160, 90, '#33506b');
  gull(ctx, 230, 60, '#33506b');
  const sea = ctx.createLinearGradient(0, 260, 0, 360);
  sea.addColorStop(0, '#4fc3f7');
  sea.addColorStop(1, '#2f9fd8');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 260, 560, 100);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  for (const [wx, wy, wl] of [[60, 300, 80], [240, 330, 90], [420, 300, 70]]) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + wl / 2, wy - 6, wx + wl, wy);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffe1a0';
  ctx.fillRect(0, 360, 560, 110);
  ctx.fillStyle = '#f5cf7d';
  ellipse(ctx, 100, 440, 90, 12);
  ellipse(ctx, 470, 455, 110, 12);
  // Striped beach umbrella.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(138, 282, 4, 90);
  const umbrella = ['#ff6b4a', '#fffdf5', '#ffd166', '#fffdf5', '#3f7dff'];
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = umbrella[i];
    ctx.beginPath();
    ctx.moveTo(140, 252);
    ctx.lineTo(92 + i * 19, 282);
    ctx.lineTo(92 + (i + 1) * 19, 282);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(140, 250, 5, 0, Math.PI * 2);
  ctx.fill();
  // Sandcastle with a flag.
  ctx.fillStyle = '#f5cf7d';
  ctx.fillRect(272, 380, 56, 44);
  ctx.fillStyle = '#e8b96a';
  ctx.fillRect(262, 396, 16, 28);
  ctx.fillRect(332, 396, 16, 28);
  ctx.fillStyle = '#f5cf7d';
  ctx.beginPath();
  ctx.arc(300, 380, 14, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(298, 348, 3, 32);
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(301, 348);
  ctx.lineTo(322, 354);
  ctx.lineTo(301, 361);
  ctx.closePath();
  ctx.fill();
  // Beach ball.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(420, 400, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(420, 378);
  ctx.lineTo(438, 392);
  ctx.lineTo(420, 414);
  ctx.lineTo(404, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(420, 378);
  ctx.lineTo(404, 400);
  ctx.lineTo(420, 414);
  ctx.lineTo(436, 402);
  ctx.closePath();
  ctx.fill();
  // Surfboard stuck in the sand.
  ctx.save();
  ctx.translate(500, 330);
  ctx.rotate(0.12);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f7dff';
  ctx.fillRect(-12, -8, 24, 10);
  ctx.fillStyle = '#ff6b4a';
  ctx.fillRect(-12, 14, 24, 6);
  ctx.restore();
  // Crab on the sand.
  ctx.fillStyle = '#ff6b4a';
  ellipse(ctx, 200, 430, 16, 11);
  ctx.beginPath();
  ctx.arc(186, 420, 6, 0, Math.PI * 2);
  ctx.arc(214, 420, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff6b4a';
  ctx.lineWidth = 3;
  for (const lx of [188, 196, 204, 212]) {
    ctx.beginPath();
    ctx.moveTo(lx, 440);
    ctx.lineTo(lx - 4, 448);
    ctx.stroke();
  }
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(194, 426, 2, 0, Math.PI * 2);
  ctx.arc(206, 426, 2, 0, Math.PI * 2);
  ctx.fill();
  // Starfish, shells and a striped towel.
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(480 + Math.cos(a) * 16, 440 + Math.sin(a) * 16);
    ctx.lineTo(480 + Math.cos(a2) * 7, 440 + Math.sin(a2) * 7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.arc(60, 420, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(60, 420, 8, 0.6, Math.PI * 1.4);
  ctx.stroke();
  ctx.fillStyle = '#3f7dff';
  ctx.fillRect(226, 420, 48, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(226, 420, 48, 6);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(226, 434, 48, 6);
  // Ice cream cart with scoops.
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(60, 368, 60, 34);
  ctx.fillStyle = '#ff6b4a';
  ctx.fillRect(60, 368, 60, 8);
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(70, 402, 7, 0, Math.PI * 2);
  ctx.arc(110, 402, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.arc(90, 356, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(78, 360, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ICE CREAM', 90, 388);
  // Palm tree with coconuts.
  ctx.fillStyle = '#8a6b46';
  ctx.beginPath();
  ctx.moveTo(516, 360);
  ctx.quadraticCurveTo(520, 320, 528, 296);
  ctx.lineTo(534, 296);
  ctx.quadraticCurveTo(528, 322, 524, 360);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2f9e44';
  for (const [fx, fy, rot] of [[500, 288, -0.6], [528, 282, 0.2], [548, 296, 0.9], [508, 306, -1.2], [544, 312, 1.4]]) {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(18, 0, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#7a4a2b';
  ctx.beginPath();
  ctx.arc(514, 292, 6, 0, Math.PI * 2);
  ctx.arc(528, 294, 6, 0, Math.PI * 2);
  ctx.fill();
  // Bucket and spade.
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(352, 428);
  ctx.lineTo(372, 428);
  ctx.lineTo(368, 448);
  ctx.lineTo(356, 448);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(378, 424, 4, 22);
  ctx.beginPath();
  ctx.moveTo(378, 424);
  ctx.lineTo(392, 432);
  ctx.lineTo(378, 438);
  ctx.closePath();
  ctx.fill();
  if (altered) for (const d of BEACH_DIFFS) d.apply(ctx, t);
}

// --- Level 6: Sunny Farm --------------------------------------------------
const FARM_DIFFS = [
  {
    id: 'barn-door', name: 'Barn door', x: 110, y: 250, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.fillRect(92, 228, 36, 46);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(92, 228, 36, 4);
      ctx.fillRect(108, 228, 4, 46);
    },
  },
  {
    id: 'cow-spots', name: 'Cow spots', x: 280, y: 380, r: 30,
    apply(ctx) {
      ctx.fillStyle = '#ffffff';
      ellipse(ctx, 268, 372, 14, 10);
    },
  },
  {
    id: 'chicken-missing', name: 'Chicken', x: 180, y: 430, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ellipse(ctx, 180, 430, 20, 12);
    },
  },
  {
    id: 'sunflower-missing', name: 'Sunflower', x: 450, y: 420, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ellipse(ctx, 450, 420, 20, 22);
    },
  },
  {
    id: 'windmill-blade', name: 'Windmill blade', x: 480, y: 190, r: 26,
    apply(ctx) {
      skyPatch(ctx, 470, 172, 20);
    },
  },
  {
    id: 'hay-bale', name: 'Hay bale', x: 350, y: 420, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ellipse(ctx, 350, 420, 26, 16);
    },
  },
  {
    id: 'tractor-wheel', name: 'Tractor wheel', x: 140, y: 420, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(140, 420, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2e2a26';
      ctx.beginPath();
      ctx.arc(140, 420, 4, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'duck-missing', name: 'Duck', x: 500, y: 440, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#4fc3f7';
      ellipse(ctx, 500, 440, 20, 10);
    },
  },
];

function paintFarm(ctx, altered, t) {
  // A sunny farm: red barn, windmill, cow, chickens, sunflowers, pond.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 280);
  sun(ctx, 480, 58, 24, '#f2b705');
  cloud(ctx, 90, 60, 0.9, '#ffffff');
  cloud(ctx, 300, 40, 0.7, '#ffffff');
  cloud(ctx, 200, 110, 0.6, '#f4fbff');
  gull(ctx, 150, 80, '#33506b');
  // Green fields and a dirt path.
  ctx.fillStyle = '#6fce7e';
  ctx.fillRect(0, 280, 560, 190);
  ctx.fillStyle = '#57b368';
  ellipse(ctx, 120, 450, 110, 16);
  ellipse(ctx, 460, 455, 120, 16);
  ctx.fillStyle = '#e8c98a';
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.lineTo(0, 440);
  ctx.quadraticCurveTo(280, 420, 560, 446);
  ctx.lineTo(560, 470);
  ctx.closePath();
  ctx.fill();
  // Red barn with white trim.
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(60, 200, 100, 80);
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(110, 158);
  ctx.lineTo(170, 200);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(92, 228, 36, 46);
  ctx.fillRect(92, 228, 36, 4);
  ctx.fillRect(108, 228, 4, 46);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(100, 176, 20, 16);
  ctx.strokeStyle = '#fffdf5';
  ctx.lineWidth = 2;
  ctx.strokeRect(100, 176, 20, 16);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(110, 150, 5, 0, Math.PI * 2);
  ctx.fill();
  // Windmill.
  ctx.fillStyle = '#f2f4f8';
  ctx.beginPath();
  ctx.moveTo(462, 280);
  ctx.lineTo(474, 200);
  ctx.lineTo(490, 200);
  ctx.lineTo(502, 280);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.moveTo(474, 200);
  ctx.lineTo(482, 182);
  ctx.lineTo(490, 200);
  ctx.closePath();
  ctx.fill();
  const blade = Math.sin(t * 0.8) * 0.2;
  ctx.save();
  ctx.translate(482, 192);
  ctx.rotate(blade);
  ctx.fillStyle = '#fffdf5';
  for (let i = 0; i < 4; i += 1) {
    ctx.save();
    ctx.rotate((i / 4) * Math.PI * 2);
    ctx.fillRect(-3, -34, 6, 30);
    ctx.restore();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Wooden fence.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(0, 300, 560, 5);
  ctx.fillRect(0, 318, 560, 5);
  for (let x = 20; x <= 540; x += 60) ctx.fillRect(x, 292, 8, 36);
  // Cow grazing.
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 280, 380, 34, 22);
  ctx.beginPath();
  ctx.arc(312, 366, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ellipse(ctx, 268, 372, 12, 9);
  ellipse(ctx, 292, 390, 9, 7);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(318, 360, 4, 0, Math.PI * 2);
  ctx.arc(326, 360, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 318, 374, 7, 5);
  ctx.fillStyle = '#2e2a26';
  ctx.fillRect(252, 396, 6, 14);
  ctx.fillRect(268, 398, 6, 14);
  ctx.fillRect(292, 398, 6, 14);
  ctx.fillRect(306, 396, 6, 14);
  // Chickens pecking.
  for (const [cx, cy] of [[180, 430], [220, 440]]) {
    ctx.fillStyle = '#fffdf5';
    ellipse(ctx, cx, cy, 12, 9);
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6b4a';
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 14);
    ctx.lineTo(cx + 12, cy - 18);
    ctx.lineTo(cx + 14, cy - 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.moveTo(cx + 16, cy - 8);
    ctx.lineTo(cx + 22, cy - 6);
    ctx.lineTo(cx + 16, cy - 4);
    ctx.closePath();
    ctx.fill();
  }
  // Sunflowers.
  for (const sx of [420, 450, 480]) {
    ctx.strokeStyle = '#2f9e44';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx, 440);
    ctx.lineTo(sx, 412);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ellipse(ctx, sx + Math.cos(a) * 10, 406 + Math.sin(a) * 10, 6, 6);
    }
    ctx.fillStyle = '#7a4a2b';
    ctx.beginPath();
    ctx.arc(sx, 406, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hay bales.
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, 350, 420, 24, 15);
  ellipse(ctx, 384, 430, 20, 12);
  ctx.strokeStyle = '#e8b96a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(350, 420, 18, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Red tractor.
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(96, 392, 70, 26);
  ctx.fillRect(130, 372, 30, 22);
  ctx.fillStyle = '#7ec8f7';
  ctx.fillRect(134, 376, 22, 14);
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(112, 420, 12, 0, Math.PI * 2);
  ctx.arc(150, 420, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f4f8';
  ctx.beginPath();
  ctx.arc(112, 420, 5, 0, Math.PI * 2);
  ctx.arc(150, 420, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(166, 392);
  ctx.lineTo(166, 368);
  ctx.stroke();
  // Pond with a duck.
  ctx.fillStyle = '#4fc3f7';
  ellipse(ctx, 500, 440, 34, 12);
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, 500, 436, 10, 7);
  ctx.beginPath();
  ctx.arc(508, 430, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(512, 430);
  ctx.lineTo(518, 432);
  ctx.lineTo(512, 434);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(509, 428, 1.5, 0, Math.PI * 2);
  ctx.fill();
  if (altered) for (const d of FARM_DIFFS) d.apply(ctx, t);
}

// --- Level 7: Candy Town --------------------------------------------------
const CANDY_DIFFS = [
  {
    id: 'lollipop-color', name: 'Lollipop swirl', x: 60, y: 140, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#3f7dff';
      ctx.beginPath();
      ctx.arc(60, 140, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(60, 140, 12, 0.4, Math.PI * 1.4);
      ctx.stroke();
    },
  },
  {
    id: 'gumdrop-missing', name: 'Gumdrop', x: 300, y: 440, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#fff0f5';
      ellipse(ctx, 300, 440, 20, 12);
    },
  },
  {
    id: 'shop-sign', name: 'Shop sign', x: 280, y: 240, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(244, 224, 72, 32);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('COOKIE', 280, 241);
    },
  },
  {
    id: 'cane-stripe', name: 'Candy cane stripe', x: 200, y: 300, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#39c26d';
      ctx.fillRect(196, 288, 8, 12);
    },
  },
  {
    id: 'frosting-drip', name: 'Frosting drip', x: 120, y: 220, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ff8fc7';
      ctx.fillRect(112, 210, 16, 18);
    },
  },
  {
    id: 'jellybean-color', name: 'Jellybean', x: 150, y: 400, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#9b5de5';
      ellipse(ctx, 150, 400, 8, 6);
    },
  },
  {
    id: 'window-count', name: 'House window', x: 440, y: 240, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#7fe0a8';
      ctx.fillRect(428, 228, 24, 24);
    },
  },
  {
    id: 'chimney-smoke', name: 'Chimney smoke', x: 100, y: 180, r: 22,
    apply(ctx) { skyPatch(ctx, 100, 180, 16); },
  },
  {
    id: 'cotton-cloud', name: 'Cotton cloud', x: 300, y: 80, r: 26,
    apply(ctx) {
      cloud(ctx, 300, 80, 0.9, '#aee3ff');
    },
  },
];

function lollipopTree(ctx, x, y, color) {
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(x - 3, y, 6, 60);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 14, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 14, 12, 0.4, Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - 14, 5, 2.2, Math.PI * 0.6);
  ctx.stroke();
}

function paintCandy(ctx, altered, t) {
  // A candy town: frosting-roofed houses, lollipop trees, a cupcake
  // shop, candy-cane lamps and a gumdrop path.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 280);
  sun(ctx, 480, 58, 24, '#f2b705');
  // Cotton-candy cloud.
  cloud(ctx, 300, 80, 0.9, '#ffd6e8');
  cloud(ctx, 120, 60, 0.7, '#ffffff');
  gull(ctx, 200, 100, '#33506b');
  // Pink lawn.
  ctx.fillStyle = '#ffe3ef';
  ctx.fillRect(0, 280, 560, 190);
  ctx.fillStyle = '#ffd6e8';
  ellipse(ctx, 100, 450, 100, 14);
  ellipse(ctx, 460, 452, 110, 14);
  // Left house: pink with frosting roof and a gumdrop chimney.
  ctx.fillStyle = '#ff8fc7';
  ctx.fillRect(80, 220, 100, 70);
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath();
  ctx.moveTo(70, 220);
  ctx.lineTo(130, 178);
  ctx.lineTo(190, 220);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 100, 222, 10, 6);
  ellipse(ctx, 130, 222, 10, 6);
  ellipse(ctx, 160, 222, 10, 6);
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(150, 186, 14, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(100, 180, 9, 0, Math.PI * 2);
  ctx.arc(108, 168, 7, 0, Math.PI * 2);
  ctx.arc(114, 158, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ec8f7';
  ctx.fillRect(96, 244, 22, 22);
  ctx.fillRect(142, 244, 22, 22);
  ctx.fillStyle = '#2e2a26';
  ctx.fillRect(122, 256, 16, 34);
  // Cupcake shop in the middle.
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(240, 220, 90, 70);
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(232, 220);
  ctx.lineTo(285, 182);
  ctx.lineTo(338, 220);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(244, 224, 72, 32);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CUPCAKE', 280, 241);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(258, 264, 54, 26);
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.arc(285, 264, 12, Math.PI, 0);
  ctx.fill();
  // Right house: mint with a round window.
  ctx.fillStyle = '#7fe0a8';
  ctx.fillRect(400, 220, 100, 70);
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.moveTo(392, 220);
  ctx.lineTo(450, 182);
  ctx.lineTo(508, 220);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7ec8f7';
  ctx.beginPath();
  ctx.arc(450, 240, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(436, 262, 28, 28);
  // Lollipop trees.
  lollipopTree(ctx, 60, 140, '#ff6b4a');
  lollipopTree(ctx, 520, 150, '#3f7dff');
  // Candy-cane lampposts.
  for (const lx of [200, 360]) {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(lx - 4, 280, 8, 60);
    ctx.fillStyle = '#e5534b';
    ctx.fillRect(lx - 4, 288, 8, 8);
    ctx.fillRect(lx - 4, 304, 8, 8);
    ctx.fillRect(lx - 4, 320, 8, 8);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(lx, 272, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  // Jellybean bushes.
  for (const [jx, jy] of [[150, 400], [420, 410]]) {
    ctx.fillStyle = '#2f9e44';
    ellipse(ctx, jx, jy, 26, 16);
    const beans = ['#ff6b4a', '#ffd166', '#3f7dff', '#ff8fc7'];
    beans.forEach((c, i) => {
      ctx.fillStyle = c;
      ellipse(ctx, jx - 16 + i * 10, jy - 6 + (i % 2) * 8, 5, 4);
    });
  }
  // Gumdrop path.
  const drops = ['#ff6b4a', '#ffd166', '#39c26d', '#3f7dff', '#ff8fc7'];
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = drops[i];
    ctx.beginPath();
    ctx.arc(240 + i * 30, 440, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(240 + i * 30 - 11, 440, 22, 6);
  }
  if (altered) for (const d of CANDY_DIFFS) d.apply(ctx, t);
}

// --- Level 8: Butterfly Meadow -------------------------------------------
const BUTTERFLY_DIFFS = [
  {
    id: 'butterfly-color', name: 'Butterfly', x: 200, y: 140, r: 26,
    apply(ctx, t) {
      // Same spot and flutter phase as the scene butterfly, only purple.
      skyPatch(ctx, 200, 140, 26);
      butterfly(ctx, 200, 140, 1, '#9b5de5', t);
    },
  },
  {
    id: 'ladybug-spots', name: 'Ladybug spots', x: 120, y: 380, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#e5484d';
      ellipse(ctx, 120, 380, 14, 11);
    },
  },
  {
    id: 'frog-missing', name: 'Frog', x: 470, y: 420, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#4fc3f7';
      ellipse(ctx, 470, 420, 22, 12);
    },
  },
  {
    id: 'daisy-missing', name: 'Daisy', x: 300, y: 400, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#6fce7e';
      ellipse(ctx, 300, 400, 18, 14);
    },
  },
  {
    id: 'bee-missing', name: 'Bee', x: 350, y: 100, r: 20,
    apply(ctx) { skyPatch(ctx, 350, 100, 14); },
  },
  {
    id: 'mushroom-cap', name: 'Mushroom cap', x: 90, y: 430, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#3f7dff';
      ctx.beginPath();
      ctx.arc(90, 428, 11, Math.PI, 0);
      ctx.fill();
    },
  },
  {
    id: 'pond-lily', name: 'Lily pad', x: 440, y: 430, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#4fc3f7';
      ellipse(ctx, 440, 430, 16, 8);
    },
  },
];

function paintButterflyMeadow(ctx, altered, t) {
  // A daisy meadow full of butterflies, bees, a ladybug and a frog pond.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 280);
  sun(ctx, 480, 58, 24, '#f2b705');
  cloud(ctx, 90, 60, 0.9, '#ffffff');
  cloud(ctx, 300, 44, 0.7, '#ffffff');
  cloud(ctx, 420, 120, 0.6, '#f4fbff');
  gull(ctx, 160, 90, '#33506b');
  ctx.fillStyle = '#6fce7e';
  ctx.fillRect(0, 280, 560, 190);
  ctx.fillStyle = '#57b368';
  ellipse(ctx, 120, 450, 110, 16);
  ellipse(ctx, 460, 452, 120, 16);
  // Daisies everywhere.
  for (const [dx, dy, ds] of [[60, 330, 0.9], [140, 380, 0.8], [220, 330, 0.9], [300, 400, 0.9], [380, 340, 0.8], [460, 360, 0.9], [520, 400, 0.8], [100, 440, 0.8], [250, 440, 0.9]]) {
    flower(ctx, dx, dy, ds, '#ffffff', '#ffd166');
  }
  flower(ctx, 180, 420, 0.8, '#ff8fc7', '#ffd166');
  flower(ctx, 340, 430, 0.8, '#ffd166', '#ff6b4a');
  // Three butterflies dancing.
  butterfly(ctx, 200, 140, 1, '#ffd166', t);
  butterfly(ctx, 330, 180, 0.9, '#ff8fc7', t + 2);
  butterfly(ctx, 450, 130, 0.8, '#3f7dff', t + 4);
  // Bees.
  for (const [bx, by] of [[350, 100], [260, 80]]) {
    ctx.fillStyle = '#ffd166';
    ellipse(ctx, bx, by, 7, 5);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 2, by - 4);
    ctx.lineTo(bx - 2, by + 4);
    ctx.moveTo(bx + 2, by - 4);
    ctx.lineTo(bx + 2, by + 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(ctx, bx - 3, by - 7, 4, 3);
    ellipse(ctx, bx + 3, by - 7, 4, 3);
  }
  // Ladybug on a leaf.
  ctx.fillStyle = '#2f9e44';
  ellipse(ctx, 120, 392, 20, 9);
  ctx.fillStyle = '#e5484d';
  ellipse(ctx, 120, 380, 14, 11);
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(114, 376, 2.5, 0, Math.PI * 2);
  ctx.arc(126, 376, 2.5, 0, Math.PI * 2);
  ctx.arc(120, 384, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 370);
  ctx.lineTo(120, 390);
  ctx.stroke();
  // Mushroom by the pond.
  ctx.fillStyle = '#f2f4f8';
  ctx.fillRect(87, 420, 5, 12);
  ctx.fillStyle = '#e5534b';
  ctx.beginPath();
  ctx.arc(90, 418, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(86, 414, 2, 0, Math.PI * 2);
  ctx.arc(94, 412, 2, 0, Math.PI * 2);
  ctx.fill();
  // Pond with a frog and lily pads.
  ctx.fillStyle = '#4fc3f7';
  ellipse(ctx, 460, 428, 46, 16);
  ctx.fillStyle = '#2f9e44';
  ellipse(ctx, 440, 430, 14, 7);
  ellipse(ctx, 486, 434, 11, 6);
  flower(ctx, 486, 430, 0.5, '#ff8fc7', '#ffd166');
  ctx.fillStyle = '#39c26d';
  ellipse(ctx, 470, 420, 12, 9);
  ctx.beginPath();
  ctx.arc(474, 412, 6, 0, Math.PI * 2);
  ctx.arc(464, 412, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(473, 410, 2, 0, Math.PI * 2);
  ctx.arc(465, 410, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(464, 418);
  ctx.quadraticCurveTo(470, 421, 476, 418);
  ctx.stroke();
  if (altered) for (const d of BUTTERFLY_DIFFS) d.apply(ctx, t);
}

// --- Level 9: Toy Workshop -------------------------------------------------
const TOY_DIFFS = [
  {
    id: 'teddy-bow', name: 'Teddy bow', x: 100, y: 380, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#39c26d';
      ctx.beginPath();
      ctx.moveTo(100, 368);
      ctx.lineTo(88, 360);
      ctx.lineTo(88, 376);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(100, 368);
      ctx.lineTo(112, 360);
      ctx.lineTo(112, 376);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'block-letter', name: 'Block letter', x: 300, y: 400, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#fffdf5';
      ctx.fillRect(288, 388, 24, 24);
      ctx.fillStyle = '#3f7dff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', 300, 401);
    },
  },
  {
    id: 'train-chimney', name: 'Train smoke', x: 420, y: 400, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#ffe3c2';
      ellipse(ctx, 420, 400, 16, 12);
    },
  },
  {
    id: 'kite-tail', name: 'Kite tail bow', x: 120, y: 170, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(112, 158, 16, 18);
    },
  },
  {
    id: 'balloon-color', name: 'Balloon', x: 500, y: 140, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ellipse(ctx, 500, 140, 12, 15);
    },
  },
  {
    id: 'robot-antenna', name: 'Robot antenna', x: 480, y: 330, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(474, 318, 12, 14);
    },
  },
  {
    id: 'horse-mane', name: 'Rocking horse mane', x: 250, y: 400, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#9b5de5';
      ctx.beginPath();
      ctx.moveTo(244, 388);
      ctx.lineTo(258, 388);
      ctx.lineTo(254, 408);
      ctx.lineTo(246, 408);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'paint-jar', name: 'Paint jar', x: 200, y: 300, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(192, 292, 16, 16);
    },
  },
];

function paintToy(ctx, altered, t) {
  // A bright toy workshop: sunny window, workbench, teddy, train, kite.
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(0, 0, 560, 300);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(0, 0, 560, 40);
  // Window with blue sky and sun.
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(380, 50, 140, 120);
  ctx.fillStyle = '#7ec8f7';
  ctx.fillRect(388, 58, 124, 104);
  sun(ctx, 478, 84, 14, '#f2b705');
  cloud(ctx, 420, 90, 0.5, '#ffffff');
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(446, 58, 8, 104);
  ctx.fillRect(388, 106, 124, 8);
  // Kite on the wall.
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(120, 110);
  ctx.lineTo(150, 150);
  ctx.lineTo(120, 190);
  ctx.lineTo(90, 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(120, 110);
  ctx.lineTo(150, 150);
  ctx.lineTo(120, 150);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 190);
  ctx.quadraticCurveTo(130, 210, 120, 228);
  ctx.stroke();
  ctx.fillStyle = '#3f7dff';
  ctx.beginPath();
  ctx.moveTo(120, 204);
  ctx.lineTo(112, 210);
  ctx.lineTo(128, 210);
  ctx.closePath();
  ctx.fill();
  // Balloons in the corner.
  for (const [bx, by, bc] of [[500, 140, '#ff8fc7'], [520, 120, '#3f7dff'], [480, 118, '#ffd166']]) {
    ctx.fillStyle = bc;
    ellipse(ctx, bx, by, 12, 15);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + 15);
    ctx.quadraticCurveTo(bx - 4, by + 30, bx + 2, by + 42);
    ctx.stroke();
  }
  // Wooden floor and a round rug.
  ctx.fillStyle = '#e8c98a';
  ctx.fillRect(0, 300, 560, 170);
  ctx.strokeStyle = 'rgba(120,80,20,0.25)';
  ctx.lineWidth = 2;
  for (let y = 320; y < 470; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(560, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff8fc7';
  ellipse(ctx, 280, 430, 130, 26);
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, 280, 430, 90, 18);
  // Workbench with paint jars and gears.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(160, 300, 160, 14);
  ctx.fillRect(172, 314, 10, 40);
  ctx.fillRect(298, 314, 10, 40);
  const jars = ['#ff6b4a', '#3f7dff', '#39c26d'];
  jars.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(180 + i * 30, 282, 16, 18);
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(180 + i * 30, 282, 16, 4);
  });
  ctx.fillStyle = '#ffd166';
  for (const [gx, gy] of [[330, 290], [348, 300]]) {
    ctx.beginPath();
    ctx.arc(gx, gy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a6b46';
    ctx.beginPath();
    ctx.arc(gx, gy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
  }
  // Teddy bear with a red bow.
  ctx.fillStyle = '#b07a45';
  ellipse(ctx, 100, 396, 22, 20);
  ctx.beginPath();
  ctx.arc(100, 362, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(86, 350, 7, 0, Math.PI * 2);
  ctx.arc(114, 350, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c98a';
  ellipse(ctx, 100, 400, 12, 10);
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(94, 360, 2, 0, Math.PI * 2);
  ctx.arc(106, 360, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(100, 368);
  ctx.lineTo(88, 360);
  ctx.lineTo(88, 376);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(100, 368);
  ctx.lineTo(112, 360);
  ctx.lineTo(112, 376);
  ctx.closePath();
  ctx.fill();
  // ABC blocks.
  const blocks = [['#ff6b4a', 'A', 288, 388], ['#3f7dff', 'B', 314, 388], ['#39c26d', 'C', 301, 362]];
  for (const [bc, letter, bx, by] of blocks) {
    ctx.fillStyle = bc;
    ctx.fillRect(bx, by, 24, 24);
    ctx.fillStyle = '#fffdf5';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, bx + 12, by + 13);
  }
  // Rocking horse.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.moveTo(230, 430);
  ctx.quadraticCurveTo(280, 446, 330, 430);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#8a5a2b';
  ctx.stroke();
  ctx.fillStyle = '#fffdf5';
  ellipse(ctx, 272, 400, 30, 16);
  ctx.beginPath();
  ctx.arc(296, 384, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(244, 388);
  ctx.lineTo(258, 388);
  ctx.lineTo(254, 408);
  ctx.lineTo(246, 408);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(258, 414);
  ctx.lineTo(258, 428);
  ctx.moveTo(286, 414);
  ctx.lineTo(286, 428);
  ctx.stroke();
  // Toy train.
  ctx.fillStyle = '#e5534b';
  ctx.fillRect(396, 396, 60, 26);
  ctx.fillRect(456, 404, 44, 18);
  ctx.fillStyle = '#2e2a26';
  ctx.fillRect(400, 378, 10, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(420, 372, 8, 0, Math.PI * 2);
  ctx.arc(428, 360, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(412, 422, 9, 0, Math.PI * 2);
  ctx.arc(440, 422, 9, 0, Math.PI * 2);
  ctx.arc(472, 422, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ec8f7';
  ctx.fillRect(404, 402, 14, 12);
  // Tin robot.
  ctx.fillStyle = '#9aa5bd';
  ctx.fillRect(462, 344, 36, 40);
  ctx.beginPath();
  ctx.arc(480, 330, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9aa5bd';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(480, 318);
  ctx.lineTo(480, 308);
  ctx.stroke();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.arc(480, 306, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(475, 328, 3, 0, Math.PI * 2);
  ctx.arc(485, 328, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.fillRect(470, 356, 20, 4);
  ctx.fillRect(470, 364, 20, 4);
  if (altered) for (const d of TOY_DIFFS) d.apply(ctx, t);
}

// --- Level 10: Fruit Festival ---------------------------------------------
const FRUIT_DIFFS = [
  {
    id: 'watermelon-slice', name: 'Watermelon slice', x: 100, y: 320, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(84, 306, 32, 16);
    },
  },
  {
    id: 'grape-bunch', name: 'Grape bunch', x: 300, y: 200, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#7fe07a';
      for (const [gx, gy] of [[292, 192], [308, 192], [300, 204], [292, 214], [308, 214]]) {
        ctx.beginPath();
        ctx.arc(gx, gy, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: 'orange-missing', name: 'Orange', x: 460, y: 320, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#8a5a2b';
      ellipse(ctx, 460, 320, 16, 10);
    },
  },
  {
    id: 'juice-sign', name: 'Juice sign', x: 285, y: 250, r: 28,
    apply(ctx) {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(249, 234, 72, 32);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SWEET', 285, 251);
    },
  },
  {
    id: 'bunting-flag', name: 'Bunting flag', x: 200, y: 110, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.moveTo(190, 104);
      ctx.lineTo(210, 104);
      ctx.lineTo(200, 122);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'balloon-color', name: 'Balloon', x: 520, y: 120, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ff6b4a';
      ellipse(ctx, 520, 120, 12, 15);
    },
  },
  {
    id: 'lemon-missing', name: 'Lemon', x: 70, y: 190, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#2f9e44';
      ellipse(ctx, 70, 190, 14, 10);
    },
  },
  {
    id: 'strawberry-color', name: 'Strawberry', x: 480, y: 420, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#3f7dff';
      ellipse(ctx, 480, 420, 9, 11);
    },
  },
  {
    id: 'basket-count', name: 'Fruit basket', x: 380, y: 420, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#fff3c4';
      ellipse(ctx, 380, 420, 22, 12);
    },
  },
];

function fruitStall(ctx, x, w, awningA, awningB) {
  ctx.fillStyle = '#3a2c22';
  ctx.fillRect(x, 300, w, 90);
  ctx.fillStyle = '#7a4a2b';
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

function paintFruit(ctx, altered, t) {
  // A fruit festival: striped stalls, watermelon, grapes, juice, bunting.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 280);
  sun(ctx, 480, 58, 24, '#f2b705');
  cloud(ctx, 100, 60, 0.9, '#ffffff');
  cloud(ctx, 300, 40, 0.7, '#ffffff');
  gull(ctx, 180, 90, '#33506b');
  // Bunting across the top.
  ctx.strokeStyle = '#2e2a26';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.quadraticCurveTo(280, 142, 560, 96);
  ctx.stroke();
  const bunting = ['#ff6b4a', '#ffd166', '#39c26d', '#3f7dff', '#ff8fc7'];
  for (let i = 0; i < 9; i += 1) {
    const bx = 40 + i * 60;
    const by = 96 + Math.sin((bx / 560) * Math.PI) * 26;
    ctx.fillStyle = bunting[i % bunting.length];
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.lineTo(bx + 10, by);
    ctx.lineTo(bx, by + 18);
    ctx.closePath();
    ctx.fill();
  }
  // Lemon tree on the left.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(66, 200, 8, 60);
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.arc(70, 176, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  for (const [lx, ly] of [[52, 168], [70, 190], [88, 170], [78, 156]]) {
    ellipse(ctx, lx, ly, 7, 9);
  }
  // Balloons on the right.
  for (const [bx, by, bc] of [[520, 120, '#3f7dff'], [500, 100, '#ff8fc7'], [540, 96, '#ffd166']]) {
    ctx.fillStyle = bc;
    ellipse(ctx, bx, by, 12, 15);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + 15);
    ctx.quadraticCurveTo(bx - 4, by + 30, bx + 2, by + 42);
    ctx.stroke();
  }
  // Grape bunch hanging in the middle.
  ctx.strokeStyle = '#2f9e44';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 176);
  ctx.lineTo(300, 186);
  ctx.stroke();
  ctx.fillStyle = '#9b5de5';
  for (const [gx, gy] of [[292, 192], [308, 192], [300, 204], [292, 214], [308, 214]]) {
    ctx.beginPath();
    ctx.arc(gx, gy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Three stalls.
  fruitStall(ctx, 48, 130, '#ff6b4a', '#fff7e0');
  fruitStall(ctx, 232, 130, '#39c26d', '#fff7e0');
  fruitStall(ctx, 416, 110, '#ffd166', '#fff7e0');
  // Juice stand sign on the middle stall.
  ctx.fillStyle = '#2c2118';
  ctx.fillRect(249, 234, 72, 32);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FRESH', 285, 251);
  // Watermelon slices on the left counter.
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.arc(100, 312, 16, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#2f9e44';
  ctx.beginPath();
  ctx.arc(100, 312, 16, 0, Math.PI);
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(94, 318, 1.5, 0, Math.PI * 2);
  ctx.arc(104, 320, 1.5, 0, Math.PI * 2);
  ctx.arc(100, 322, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8c42';
  for (const [ox, oy] of [[126, 316], [140, 316], [133, 306]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Orange pile on the right counter.
  ctx.fillStyle = '#ff8c42';
  for (const [ox, oy] of [[452, 316], [468, 316], [460, 304], [444, 328], [474, 328]]) {
    ctx.beginPath();
    ctx.arc(ox, oy, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2f9e44';
  ellipse(ctx, 460, 296, 6, 3);
  // Juice glasses on the middle counter.
  ctx.fillStyle = '#ff9f43';
  ctx.fillRect(250, 292, 12, 16);
  ctx.fillStyle = '#ff8fc7';
  ctx.fillRect(268, 292, 12, 16);
  ctx.fillStyle = '#7fe07a';
  ctx.fillRect(286, 292, 12, 16);
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(250, 292, 48, 4);
  // Baskets of strawberries on the ground.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(366, 412, 28, 16);
  ctx.fillRect(466, 412, 28, 16);
  ctx.fillStyle = '#e5484d';
  for (const [sx, sy] of [[374, 408], [382, 406], [390, 408], [474, 408], [482, 406], [490, 408]]) {
    ellipse(ctx, sx, sy, 6, 8);
    ctx.fillStyle = '#2f9e44';
    ellipse(ctx, sx, sy - 6, 4, 2);
    ctx.fillStyle = '#e5484d';
  }
  // Sunny ground.
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(0, 390, 560, 80);
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, 280, 450, 180, 12);
  if (altered) for (const d of FRUIT_DIFFS) d.apply(ctx, t);
}

// --- Level 11: Pool Party --------------------------------------------------
const POOL_DIFFS = [
  {
    id: 'duck-float', name: 'Duck float', x: 200, y: 300, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ff8fc7';
      ellipse(ctx, 200, 300, 20, 14);
      ctx.beginPath();
      ctx.arc(212, 290, 8, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'donut-sprinkles', name: 'Donut sprinkles', x: 350, y: 320, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#ff8fc7';
      ctx.beginPath();
      ctx.arc(350, 320, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(350, 320, 8, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: 'ball-stripe', name: 'Beach ball stripe', x: 420, y: 260, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#39c26d';
      ctx.beginPath();
      ctx.moveTo(420, 242);
      ctx.lineTo(436, 254);
      ctx.lineTo(420, 272);
      ctx.lineTo(406, 260);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'umbrella-stripe', name: 'Umbrella stripe', x: 100, y: 240, r: 26,
    apply(ctx) {
      ctx.fillStyle = '#2a9d8f';
      ctx.beginPath();
      ctx.moveTo(100, 222);
      ctx.lineTo(124, 222);
      ctx.lineTo(114, 248);
      ctx.lineTo(100, 248);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 'towel-color', name: 'Towel stripe', x: 480, y: 380, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#ff6b4a';
      ctx.fillRect(456, 372, 48, 8);
    },
  },
  {
    id: 'cart-sign', name: 'Cart sign', x: 90, y: 370, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#2c2118';
      ctx.fillRect(72, 362, 36, 14);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('JUICE', 90, 369);
    },
  },
  {
    id: 'lounger-missing', name: 'Sun lounger', x: 300, y: 430, r: 24,
    apply(ctx) {
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(276, 416, 48, 28);
    },
  },
  {
    id: 'palm-coconuts', name: 'Palm coconuts', x: 520, y: 210, r: 22,
    apply(ctx) {
      ctx.fillStyle = '#7ec8f7';
      ctx.beginPath();
      ctx.arc(514, 212, 10, 0, Math.PI * 2);
      ctx.arc(528, 214, 10, 0, Math.PI * 2);
      ctx.fill();
    },
  },
];

function paintPool(ctx, altered, t) {
  // A pool party: blue pool, duck and donut floats, umbrella, loungers.
  ctx.fillStyle = daySky(ctx);
  ctx.fillRect(0, 0, 560, 200);
  sun(ctx, 480, 58, 24, '#f2b705');
  cloud(ctx, 90, 60, 0.9, '#ffffff');
  cloud(ctx, 280, 44, 0.7, '#ffffff');
  gull(ctx, 160, 80, '#33506b');
  // Sunny deck.
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(0, 200, 560, 270);
  ctx.fillStyle = '#ffe9a8';
  ellipse(ctx, 280, 450, 200, 12);
  // The pool: blue water with lanes and sparkles.
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.roundRect(90, 230, 380, 150, 20);
  ctx.fill();
  ctx.fillStyle = '#2f9fd8';
  ctx.beginPath();
  ctx.roundRect(90, 230, 380, 150, 20);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(100 + i * 90, 250);
    ctx.lineTo(100 + i * 90, 360);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  for (const [wx, wy, wl] of [[140, 280, 60], [260, 340, 70], [380, 290, 60]]) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + wl / 2, wy - 5, wx + wl, wy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(90, 230, 380, 150, 20);
  ctx.stroke();
  // Duck float.
  ctx.fillStyle = '#ffd166';
  ellipse(ctx, 200, 300, 20, 14);
  ctx.beginPath();
  ctx.arc(212, 290, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.moveTo(219, 290);
  ctx.lineTo(226, 292);
  ctx.lineTo(219, 294);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(213, 288, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Donut float with sprinkles.
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.arc(350, 320, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(350, 320, 8, 0, Math.PI * 2);
  ctx.fill();
  const sprinkles = ['#ffd166', '#3f7dff', '#39c26d', '#ffffff'];
  sprinkles.forEach((c, i) => {
    ctx.fillStyle = c;
    const a = (i / 4) * Math.PI * 2 + 0.4;
    ctx.fillRect(350 + Math.cos(a) * 13 - 3, 320 + Math.sin(a) * 13 - 1, 6, 2);
  });
  // Striped umbrella on the deck.
  ctx.fillStyle = '#8a6b46';
  ctx.fillRect(98, 248, 4, 60);
  const umbrella2 = ['#ff6b4a', '#fffdf5', '#ffd166', '#fffdf5', '#3f7dff'];
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = umbrella2[i];
    ctx.beginPath();
    ctx.moveTo(100, 222);
    ctx.lineTo(56 + i * 18, 248);
    ctx.lineTo(56 + (i + 1) * 18, 248);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(100, 220, 5, 0, Math.PI * 2);
  ctx.fill();
  // Beach ball on the deck.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(420, 260, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b4a';
  ctx.beginPath();
  ctx.moveTo(420, 242);
  ctx.lineTo(436, 254);
  ctx.lineTo(420, 272);
  ctx.lineTo(406, 260);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(420, 242);
  ctx.lineTo(406, 260);
  ctx.lineTo(420, 272);
  ctx.lineTo(434, 262);
  ctx.closePath();
  ctx.fill();
  // Towels on the deck.
  ctx.fillStyle = '#3f7dff';
  ctx.fillRect(456, 372, 48, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(456, 372, 48, 6);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(456, 386, 48, 6);
  ctx.fillStyle = '#ff8fc7';
  ctx.fillRect(456, 402, 48, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(456, 402, 48, 6);
  // Ice cream cart.
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(60, 368, 60, 30);
  ctx.fillStyle = '#ff6b4a';
  ctx.fillRect(60, 368, 60, 8);
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(70, 398, 6, 0, Math.PI * 2);
  ctx.arc(110, 398, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8fc7';
  ctx.beginPath();
  ctx.arc(90, 356, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ICE CREAM', 90, 384);
  // Sun loungers.
  for (const lx of [280, 340]) {
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(lx, 420, 44, 8);
    ctx.fillRect(lx + 30, 410, 14, 12);
    ctx.strokeStyle = '#8a6b46';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + 4, 428);
    ctx.lineTo(lx + 4, 440);
    ctx.moveTo(lx + 40, 428);
    ctx.lineTo(lx + 40, 440);
    ctx.stroke();
  }
  // Palm tree.
  ctx.fillStyle = '#8a6b46';
  ctx.beginPath();
  ctx.moveTo(516, 280);
  ctx.quadraticCurveTo(520, 240, 528, 216);
  ctx.lineTo(534, 216);
  ctx.quadraticCurveTo(528, 242, 524, 280);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2f9e44';
  for (const [fx, fy, rot] of [[500, 208, -0.6], [528, 202, 0.2], [548, 216, 0.9], [508, 226, -1.2], [544, 232, 1.4]]) {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(18, 0, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#7a4a2b';
  ctx.beginPath();
  ctx.arc(514, 212, 6, 0, Math.PI * 2);
  ctx.arc(528, 214, 6, 0, Math.PI * 2);
  ctx.fill();
  if (altered) for (const d of POOL_DIFFS) d.apply(ctx, t);
}

const PAINTERS = [
  paintPlayground, paintMarket, paintMeadow, paintGarden, paintBeach,
  paintFarm, paintCandy, paintButterflyMeadow, paintToy, paintFruit, paintPool,
];
const DIFF_SETS = [
  PLAYGROUND_DIFFS, MARKET_DIFFS, MEADOW_DIFFS, GARDEN_DIFFS, BEACH_DIFFS,
  FARM_DIFFS, CANDY_DIFFS, BUTTERFLY_DIFFS, TOY_DIFFS, FRUIT_DIFFS, POOL_DIFFS,
];

// ------------------------------------------------------------------ world

export function diffsOf(levelIndex) {
  return DIFF_SETS[levelIndex] ?? PLAYGROUND_DIFFS;
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
    const pick = random.shuffle(unfound)[0];
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
