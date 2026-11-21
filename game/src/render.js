// The renderer: everything the player sees, painted on one canvas.
// The HUD (counter, score, timer bar, hint button), the two picture
// panels with their found-markers and hint pulse, the floating score
// popups, and the title / level-select / clear / over / done screens.
//
// The game is drawn in a fixed 1280x720 logical space and scaled to the
// window, so the screenshots are the same frame at any window size.

import {
  FIELD,
  FONT,
  HUD,
  MESSAGE_Y,
  PALETTE,
  PANEL,
  PANEL_LEFT,
  PANEL_RIGHT,
  TOTAL_DIFFS,
} from './config.js';
import {
  SCREEN_CLEAR,
  SCREEN_DONE,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_SELECT,
  SCREEN_TITLE,
} from './world.js';

export { SCREEN_CLEAR, SCREEN_DONE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_SELECT, SCREEN_TITLE };

// Where the level cards sit on the select screen (logical coordinates).
export const LEVEL_CARDS = [
  { x: 110, y: 250, w: 320, h: 220 },
  { x: 480, y: 250, w: 320, h: 220 },
  { x: 850, y: 250, w: 320, h: 220 },
];
export const NEXT_BUTTON = { x: 490, y: 520, w: 300, h: 64 };
export const RETRY_BUTTON = { x: 490, y: 500, w: 300, h: 64 };
export const START_BUTTON = { x: 440, y: 520, w: 400, h: 70 };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');
  const panelA = document.createElement('canvas');
  panelA.width = PANEL.width;
  panelA.height = PANEL.height;
  const panelB = document.createElement('canvas');
  panelB.width = PANEL.width;
  panelB.height = PANEL.height;

  function drawFoundRing(pctx, x, y, pulse) {
    const r = 26 + (pulse ? Math.sin(pulse * 6) * 2 : 0);
    pctx.save();
    pctx.strokeStyle = PALETTE.ring;
    pctx.lineWidth = 5;
    pctx.shadowColor = 'rgba(255,209,102,0.9)';
    pctx.shadowBlur = 12;
    pctx.beginPath();
    pctx.arc(x, y, r, 0, Math.PI * 2);
    pctx.stroke();
    pctx.shadowBlur = 0;
    pctx.strokeStyle = PALETTE.ringFound;
    pctx.lineWidth = 2.5;
    pctx.beginPath();
    pctx.arc(x, y, r - 7, 0, Math.PI * 2);
    pctx.stroke();
    pctx.strokeStyle = '#ffffff';
    pctx.lineWidth = 4;
    pctx.lineCap = 'round';
    pctx.beginPath();
    pctx.moveTo(x - 9, y);
    pctx.lineTo(x - 3, y + 7);
    pctx.lineTo(x + 10, y - 7);
    pctx.stroke();
    pctx.restore();
  }

  function drawPanels(world) {
    const state = world.state;
    const pctxA = panelA.getContext('2d');
    const pctxB = panelB.getContext('2d');
    world.paintScene(pctxA, false);
    world.paintScene(pctxB, true);
    // Found markers and the hint pulse live on the panels, on both sides.
    const found = world.diffs().filter((d) => state.found.includes(d.id));
    for (const d of found) {
      drawFoundRing(pctxA, d.x, d.y, 0);
      drawFoundRing(pctxB, d.x, d.y, 0);
    }
    if (state.hintPulse) {
      const hp = state.hintPulse;
      const pulse = 1 - hp.t / 2.6;
      for (const pctx of [pctxA, pctxB]) {
        pctx.save();
        pctx.strokeStyle = PALETTE.hintPulse;
        pctx.lineWidth = 4;
        pctx.globalAlpha = 0.9 - pulse * 0.5;
        pctx.beginPath();
        pctx.arc(hp.x, hp.y, 18 + pulse * 22, 0, Math.PI * 2);
        pctx.stroke();
        pctx.restore();
      }
    }
    // Floating score popups rise from the panel where the find happened.
    for (const p of state.popups) {
      for (const pctx of [pctxA, pctxB]) {
        pctx.save();
        pctx.globalAlpha = Math.min(1, p.t);
        pctx.font = `bold 26px ${FONT}`;
        pctx.textAlign = 'center';
        pctx.textBaseline = 'middle';
        pctx.lineWidth = 5;
        pctx.strokeStyle = 'rgba(0,0,0,0.6)';
        const py = p.y - 44 - (1.1 - p.t) * 26;
        pctx.strokeText(p.text, p.x, py);
        pctx.fillStyle = PALETTE.accent;
        pctx.fillText(p.text, p.x, py);
        pctx.restore();
      }
    }
  }

  function blitPanels(world) {
    const state = world.state;
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 22 : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake * 16 : 0;
    for (const [panel, at] of [[panelA, PANEL_LEFT], [panelB, PANEL_RIGHT]]) {
      ctx.save();
      ctx.shadowColor = PALETTE.panelShadow;
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, at.x + shakeX, at.y + shakeY, PANEL.width, PANEL.height, PANEL.radius);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRect(ctx, at.x + shakeX, at.y + shakeY, PANEL.width, PANEL.height, PANEL.radius);
      ctx.clip();
      ctx.drawImage(panel, at.x + shakeX, at.y + shakeY);
      ctx.restore();
      ctx.strokeStyle = PALETTE.panelEdge;
      ctx.lineWidth = 2;
      roundRect(ctx, at.x + shakeX, at.y + shakeY, PANEL.width, PANEL.height, PANEL.radius);
      ctx.stroke();
    }
    text(ctx, 'ORIGINAL', PANEL_LEFT.x + 14, PANEL_LEFT.y - 16, 15, PALETTE.muted, 'bold');
    text(ctx, 'CHANGED — SPOT THE DIFFERENCES', PANEL_RIGHT.x + 14, PANEL_RIGHT.y - 16, 15, PALETTE.muted, 'bold');
  }

  function drawHud(world, best, screen) {
    const state = world.state;
    const lvl = world.level();
    // On the clear/done screens totalScore already includes this level's
    // score; while playing it does not, so add the running score then.
    const runningTotal = (screen === SCREEN_CLEAR || screen === SCREEN_DONE)
      ? state.totalScore
      : state.totalScore + state.score;
    // Top bar.
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 24, 12, 1232, 76, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hudEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 24, 12, 1232, 76, 12);
    ctx.stroke();
    text(ctx, 'SPOT THE DIFFERENCE', 44, 34, 24, PALETTE.text);
    text(ctx, `${lvl.name}  ·  Level ${state.levelIndex + 1} of 3`, 44, 64, 15, PALETTE.muted, 'normal');
    // Counter — the heart of the game, big and central.
    const total = world.diffs().length;
    const found = state.found.length;
    text(ctx, `FOUND  ${found} / ${total}`, 640, 34, 30, found === total ? PALETTE.good : PALETTE.accent, 'bold', 'center');
    text(ctx, `${total - found} still hiding`, 640, 64, 14, PALETTE.muted, 'normal', 'center');
    // Score.
    text(ctx, `SCORE  ${state.score}`, 1010, 34, 22, PALETTE.text, 'bold', 'right');
    text(ctx, `Best ${Math.max(best, runningTotal)}`, 1010, 64, 13, PALETTE.muted, 'normal', 'right');
    // Timer bar, in the strip between the panels and the message line.
    const barX = 44;
    const barY = 600;
    const barW = 760;
    const frac = Math.max(0, state.timeLeft / state.timeTotal);
    ctx.fillStyle = '#10141f';
    roundRect(ctx, barX, barY, barW, 12, 6);
    ctx.fill();
    const low = frac < 0.25;
    ctx.fillStyle = low ? PALETTE.bad : frac < 0.5 ? PALETTE.accent : PALETTE.good;
    if (frac > 0) {
      roundRect(ctx, barX, barY, barW * frac, 12, 6);
      ctx.fill();
    }
    text(ctx, `⏱ ${formatTime(state.timeLeft)}`, barX + barW + 16, barY + 6, 17, low ? PALETTE.bad : PALETTE.text);
    // Hint button.
    const hb = HUD.hintButton;
    const disabled = state.hintsLeft <= 0 || state.hintCooldown > 0;
    ctx.fillStyle = disabled ? PALETTE.buttonDisabled : PALETTE.button;
    roundRect(ctx, hb.x, hb.y, hb.w, hb.h, 12);
    ctx.fill();
    const label = state.hintCooldown > 0
      ? `Hint… ${Math.ceil(state.hintCooldown)}s`
      : `💡 Hint  (${state.hintsLeft} left)`;
    text(ctx, label, hb.x + hb.w / 2, hb.y + hb.h / 2, 17, '#ffffff', 'bold', 'center');
    text(ctx, 'or press H', hb.x + hb.w / 2, hb.y + hb.h + 14, 12, PALETTE.muted, 'normal', 'center');
    // Combo flame.
    if (state.combo >= 2) {
      text(ctx, `🔥 COMBO x${state.combo}`, 44, MESSAGE_Y + 46, 20, '#ff9f43', 'bold');
    }
    // Message strip.
    if (state.messageT > 0) {
      ctx.globalAlpha = Math.min(1, state.messageT);
      text(ctx, state.message, 640, MESSAGE_Y + 46, 18, PALETTE.text, 'normal', 'center');
      ctx.globalAlpha = 1;
    }
    // Wrong-click flash.
    if (state.wrongFlash > 0) {
      ctx.fillStyle = `rgba(255,60,60,${state.wrongFlash * 0.22})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  function drawBackdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, PALETTE.backdropTop);
    g.addColorStop(1, PALETTE.backdrop);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawTitle(world, best) {
    text(ctx, '🔍  SPOT THE DIFFERENCE', 640, 150, 52, PALETTE.text, 'bold', 'center');
    text(ctx, 'Two pictures. Almost the same. Find what changed.', 640, 205, 22, PALETTE.muted, 'normal', 'center');
    text(ctx, 'Click a difference on either picture  ·  H hint  ·  P pause  ·  N next level', 640, 248, 17, PALETTE.muted, 'normal', 'center');
    // A miniature preview: the harbor scene, both panels, mid-hunt.
    drawPanels(world);
    blitPanels(world);
    text(ctx, `3 hand-drawn scenes  ·  ${TOTAL_DIFFS} hidden differences  ·  combos, hints & a race against the clock`, 640, 640, 17, PALETTE.muted, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h, 14);
    ctx.fill();
    text(ctx, '▶  START HUNTING', 640, START_BUTTON.y + 36, 24, '#ffffff', 'bold', 'center');
    if (best > 0) text(ctx, `Best total score: ${best}`, 640, START_BUTTON.y + 96, 16, PALETTE.accent, 'bold', 'center');
  }

  function drawSelect(world) {
    text(ctx, 'CHOOSE YOUR HUNT', 640, 130, 44, PALETTE.text, 'bold', 'center');
    text(ctx, 'Clear a level to unlock the next one. Harder scenes hide more differences.', 640, 178, 18, PALETTE.muted, 'normal', 'center');
    const state = world.state;
    const names = ['Harbor Morning', 'Night Market', 'Forest Camp'];
    const descs = ['7 differences · 2:30', '8 differences · 2:30', '10 differences · 3:00'];
    const emojis = ['⚓', '🏮', '🌲'];
    for (let i = 0; i < 3; i += 1) {
      const card = LEVEL_CARDS[i];
      const locked = i > state.unlocked;
      ctx.fillStyle = locked ? '#1a2132' : PALETTE.hudPanel;
      roundRect(ctx, card.x, card.y, card.w, card.h, 16);
      ctx.fill();
      ctx.strokeStyle = i === state.levelIndex ? PALETTE.accent : PALETTE.hudEdge;
      ctx.lineWidth = i === state.levelIndex ? 3 : 1.5;
      roundRect(ctx, card.x, card.y, card.w, card.h, 16);
      ctx.stroke();
      text(ctx, emojis[i], card.x + card.w / 2, card.y + 58, 44, '#ffffff', 'bold', 'center');
      text(ctx, names[i], card.x + card.w / 2, card.y + 122, 22, locked ? PALETTE.muted : PALETTE.text, 'bold', 'center');
      text(ctx, locked ? '🔒 Locked — clear the previous level' : descs[i], card.x + card.w / 2, card.y + 158, 15, PALETTE.muted, 'normal', 'center');
      if (state.levelScores[i] !== undefined) {
        text(ctx, `Best: ${state.levelScores[i]} pts`, card.x + card.w / 2, card.y + 188, 15, PALETTE.good, 'bold', 'center');
      }
    }
    text(ctx, 'Click a card to play it  ·  Esc back to title', 640, 520, 17, PALETTE.muted, 'normal', 'center');
  }

  function drawClear(world) {
    const state = world.state;
    const lvl = world.level();
    ctx.fillStyle = 'rgba(10,14,24,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '🎉  LEVEL CLEAR!', 640, 210, 52, PALETTE.good, 'bold', 'center');
    text(ctx, `${lvl.name} — all ${world.diffs().length} differences found`, 640, 268, 22, PALETTE.text, 'normal', 'center');
    text(ctx, `Level score  ${state.score} pts   (time bonus +${state.clearBonus})`, 640, 330, 22, PALETTE.accent, 'bold', 'center');
    text(ctx, `Total so far  ${state.totalScore} pts   ·   Best combo x${state.bestCombo}`, 640, 372, 18, PALETTE.muted, 'normal', 'center');
    text(ctx, state.levelIndex + 1 < 3 ? 'Next up: a harder scene with more hiding spots.' : '', 640, 414, 17, PALETTE.muted, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, NEXT_BUTTON.x, NEXT_BUTTON.y, NEXT_BUTTON.w, NEXT_BUTTON.h, 14);
    ctx.fill();
    text(ctx, state.levelIndex + 1 < 3 ? 'NEXT LEVEL  (N)  ▶' : 'SEE RESULTS  (N)  ▶', 640, NEXT_BUTTON.y + 33, 21, '#ffffff', 'bold', 'center');
  }

  function drawOver(world) {
    const state = world.state;
    ctx.fillStyle = 'rgba(10,14,24,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '⏰  TIME UP!', 640, 220, 52, PALETTE.bad, 'bold', 'center');
    text(ctx, `${world.level().name} — you found ${state.found.length} of ${world.diffs().length} differences`, 640, 280, 22, PALETTE.text, 'normal', 'center');
    text(ctx, `Score this level: ${state.score} pts`, 640, 326, 20, PALETTE.accent, 'bold', 'center');
    text(ctx, 'The remaining differences were still hiding in plain sight.', 640, 368, 17, PALETTE.muted, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, RETRY_BUTTON.x, RETRY_BUTTON.y, RETRY_BUTTON.w, RETRY_BUTTON.h, 14);
    ctx.fill();
    text(ctx, '↻  TRY AGAIN  (R)', 640, RETRY_BUTTON.y + 33, 21, '#ffffff', 'bold', 'center');
  }

  function drawDone(world, best) {
    const state = world.state;
    ctx.fillStyle = 'rgba(10,14,24,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '🏆  MASTER SPOTTER!', 640, 180, 52, PALETTE.accent, 'bold', 'center');
    text(ctx, 'All three scenes cleared — every one of the 25 differences found.', 640, 238, 22, PALETTE.text, 'normal', 'center');
    text(ctx, `TOTAL SCORE  ${state.totalScore} pts`, 640, 310, 34, PALETTE.good, 'bold', 'center');
    text(ctx, `Best combo x${state.bestCombo}  ·  Best total ${Math.max(best, state.totalScore)}`, 640, 362, 18, PALETTE.muted, 'normal', 'center');
    text(ctx, 'Harbor Morning  ✓     Night Market  ✓     Forest Camp  ✓', 640, 420, 20, PALETTE.text, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, NEXT_BUTTON.x, NEXT_BUTTON.y, NEXT_BUTTON.w, NEXT_BUTTON.h, 14);
    ctx.fill();
    text(ctx, '↻  PLAY AGAIN  (R)', 640, NEXT_BUTTON.y + 33, 21, '#ffffff', 'bold', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(10,14,24,0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '⏸  PAUSED', 640, 320, 48, PALETTE.text, 'bold', 'center');
    text(ctx, 'Press P or click to keep hunting', 640, 380, 20, PALETTE.muted, 'normal', 'center');
  }

  function draw(world, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackdrop();
    if (screen === SCREEN_TITLE) {
      drawTitle(world, best);
      return;
    }
    if (screen === SCREEN_SELECT) {
      drawSelect(world);
      return;
    }
    drawPanels(world);
    drawHud(world, best, screen);
    blitPanels(world);
    // Panels are blitted after the HUD so the timer bar stays on top of
    // nothing; the message strip sits below them.
    if (screen === SCREEN_CLEAR) drawClear(world);
    else if (screen === SCREEN_OVER) drawOver(world);
    else if (screen === SCREEN_DONE) drawDone(world, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
  }

  return { draw };
}
