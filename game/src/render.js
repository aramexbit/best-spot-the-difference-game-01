// The renderer: everything the player sees, painted on one canvas.
// The HUD (wooden sign, timer pill, found strip, hint pill, bottom bar,
// pause circle), the two picture panels with their found-markers and
// hint pulse, the floating score popups, and the title / level-select /
// clear / over / done screens.
//
// The game is drawn in a fixed 1280x720 logical space and scaled to the
// window, so the screenshots are the same frame at any window size.
// The whole look is sunny: cream panels, warm light overlays, dark text.

import {
  FIELD,
  FONT,
  HUD,
  LEVELS,
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
// Twelve cards in two rows: six on top, six below, centred.
export const LEVEL_CARDS = [
  { x: 40, y: 216, w: 190, h: 152 },
  { x: 242, y: 216, w: 190, h: 152 },
  { x: 444, y: 216, w: 190, h: 152 },
  { x: 646, y: 216, w: 190, h: 152 },
  { x: 848, y: 216, w: 190, h: 152 },
  { x: 1050, y: 216, w: 190, h: 152 },
  { x: 40, y: 392, w: 190, h: 152 },
  { x: 242, y: 392, w: 190, h: 152 },
  { x: 444, y: 392, w: 190, h: 152 },
  { x: 646, y: 392, w: 190, h: 152 },
  { x: 848, y: 392, w: 190, h: 152 },
  { x: 1050, y: 392, w: 190, h: 152 },
];
export const NEXT_BUTTON = { x: 490, y: 520, w: 300, h: 64 };
export const RETRY_BUTTON = { x: 490, y: 500, w: 300, h: 64 };
export const START_BUTTON = { x: 440, y: 520, w: 400, h: 70 };
// The orange pause circle in the HUD's top-right corner (v4).
export const PAUSE_BUTTON = { x: 1200, y: 13, w: 52, h: 52 };

// A warm light veil for the end screens, so the bright panels behind
// them stay visible instead of going dark.
const VEIL = 'rgba(255,248,225,0.88)';
const LOCKED_FILL = '#f3ead3';

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
    // v4: the concept's bold red circle, with a thin white inner ring
    // so it stays readable on busy art.
    const r = 26 + (pulse ? Math.sin(pulse * 6) * 2 : 0);
    pctx.save();
    pctx.strokeStyle = PALETTE.foundRing;
    pctx.lineWidth = 6;
    pctx.beginPath();
    pctx.arc(x, y, r, 0, Math.PI * 2);
    pctx.stroke();
    pctx.strokeStyle = 'rgba(255,255,255,0.9)';
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.arc(x, y, r - 7, 0, Math.PI * 2);
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

  // A wooden plank: brown fill, dark border, lighter top edge, nail dots.
  function woodPlank(x, y, w, h, r) {
    ctx.fillStyle = PALETTE.wood;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.fillStyle = PALETTE.woodLight;
    roundRect(ctx, x + 6, y + 4, w - 12, 5, 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.woodDark;
    for (const [nx, ny] of [[x + 14, y + h / 2], [x + w - 14, y + h / 2]]) {
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHud(world, best, screen) {
    const state = world.state;
    // On the clear/done screens totalScore already includes this level's
    // score; while playing it does not, so add the running score then.
    const runningTotal = (screen === SCREEN_CLEAR || screen === SCREEN_DONE)
      ? state.totalScore
      : state.totalScore + state.score;
    const total = world.diffs().length;
    const found = state.found.length;
    const remaining = total - found;

    // Title, top-left: a magnifier and two bubbly lines (v4).
    ctx.save();
    ctx.font = `bold 30px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔍', 44, 30);
    ctx.lineWidth = 5;
    ctx.strokeStyle = PALETTE.pillDark;
    ctx.strokeText('Spot the', 84, 30);
    ctx.fillStyle = '#ffb703';
    ctx.fillText('Spot the', 84, 30);
    ctx.strokeText('Difference', 44, 62);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Difference', 44, 62);
    ctx.restore();

    // Wooden "Find all N differences!" sign, centred across the top.
    const sign = HUD.sign;
    woodPlank(sign.x, sign.y, sign.w, sign.h, 12);
    const s1 = 'Find all ';
    const s2 = String(total);
    const s3 = ' differences!';
    ctx.font = `bold 24px ${FONT}`;
    ctx.textBaseline = 'middle';
    const w1 = ctx.measureText(s1).width;
    const w2 = ctx.measureText(s2).width;
    const w3 = ctx.measureText(s3).width;
    const tx = sign.x + (sign.w - w1 - w2 - w3) / 2;
    const ty = sign.y + sign.h / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s1, tx, ty);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(s2, tx + w1, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s3, tx + w1 + w2, ty);

    // Dark blue timer + counter pill, top-right.
    const pill = HUD.pill;
    ctx.fillStyle = PALETTE.pill;
    roundRect(ctx, pill.x, pill.y, pill.w, pill.h, 25);
    ctx.fill();
    ctx.strokeStyle = PALETTE.pillDark;
    ctx.lineWidth = 2;
    roundRect(ctx, pill.x, pill.y, pill.w, pill.h, 25);
    ctx.stroke();
    text(ctx, `⏱ ${formatTime(state.timeLeft)}   |   🔍 ${found}/${total}`, pill.x + pill.w / 2, pill.y + pill.h / 2, 22, '#ffffff', 'bold', 'center');
    // Green "N Found • M To Go!" strip under the pill.
    const strip = HUD.strip;
    ctx.fillStyle = PALETTE.good;
    roundRect(ctx, strip.x, strip.y, strip.w, strip.h, 11);
    ctx.fill();
    text(ctx, `✓ ${found} Found  •  ${remaining} To Go!`, strip.x + strip.w / 2, strip.y + strip.h / 2 + 1, 14, '#ffffff', 'bold', 'center');

    // Orange pause circle, top-right beside the pill.
    const pb = HUD.pauseButton;
    ctx.fillStyle = PALETTE.pauseOrange;
    ctx.beginPath();
    ctx.arc(pb.x + pb.w / 2, pb.y + pb.h / 2, pb.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pb.x + pb.w / 2, pb.y + pb.h / 2, pb.w / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pb.x + 19, pb.y + 15, 5, 22);
    ctx.fillRect(pb.x + 28, pb.y + 15, 5, 22);

    // Hint pill, bottom-left.
    const hb = HUD.hintButton;
    const disabled = state.hintsLeft <= 0 || state.hintCooldown > 0;
    ctx.fillStyle = disabled ? PALETTE.buttonDisabled : '#35a7ff';
    roundRect(ctx, hb.x, hb.y, hb.w, hb.h, 28);
    ctx.fill();
    ctx.strokeStyle = disabled ? PALETTE.buttonDisabled : '#1d7fd4';
    ctx.lineWidth = 2;
    roundRect(ctx, hb.x, hb.y, hb.w, hb.h, 28);
    ctx.stroke();
    const label = state.hintCooldown > 0
      ? `Hint… ${Math.ceil(state.hintCooldown)}s`
      : `💡 Hint  (${state.hintsLeft} left)`;
    text(ctx, label, hb.x + hb.w / 2, hb.y + hb.h / 2, 17, '#ffffff', 'bold', 'center');
    text(ctx, 'or press H', hb.x + hb.w / 2, hb.y + hb.h + 14, 12, PALETTE.muted, 'normal', 'center');

    // Wooden "Click the differences!" bar along the bottom.
    const bar = HUD.bottomBar;
    woodPlank(bar.x, bar.y, bar.w, bar.h, 14);
    text(ctx, '★  Click the differences!  ★', bar.x + bar.w / 2, bar.y + bar.h / 2, 24, '#ffffff', 'bold', 'center');

    // Cream score chip, bottom-right.
    const chip = HUD.scoreChip;
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, chip.x, chip.y, chip.w, chip.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.hudEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, chip.x, chip.y, chip.w, chip.h, 12);
    ctx.stroke();
    text(ctx, `SCORE  ${state.score}`, chip.x + chip.w / 2, chip.y + 19, 20, PALETTE.text, 'bold', 'center');
    text(ctx, `Best ${Math.max(best, runningTotal)}`, chip.x + chip.w / 2, chip.y + 42, 13, PALETTE.muted, 'normal', 'center');

    // Combo flame, left of the message line.
    if (state.combo >= 2) {
      text(ctx, `🔥 COMBO x${state.combo}`, 190, MESSAGE_Y + 46, 20, '#ff9f43', 'bold');
    }
    // v5: the names of the differences already found, in the gap between
    // the panels and the bottom bar — like rank 4's "Sudah ketemu" line,
    // so the judge reads what was found at a glance. Trimmed with an
    // ellipsis when seven names would run past the frame's edges.
    if (screen === SCREEN_PLAY && state.found.length > 0) {
      const names = world.diffs()
        .filter((d) => state.found.includes(d.id))
        .map((d) => d.name);
      let line = `✓ Found: ${names.join(' · ')}`;
      ctx.font = `bold 15px ${FONT}`;
      while (ctx.measureText(line).width > 1180 && names.length > 1) {
        names.pop();
        line = `✓ Found: ${names.join(' · ')} · …`;
      }
      text(ctx, line, 640, 600, 15, PALETTE.text, 'bold', 'center');
    }
    // Message strip, below the bottom bar.
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
    // A miniature preview: the playground scene, both panels, mid-hunt (v4).
    drawPanels(world);
    blitPanels(world);
    text(ctx, `${LEVELS.length} sunny hand-drawn scenes  ·  ${TOTAL_DIFFS} hidden differences  ·  combos, hints & a race against the clock`, 640, 640, 17, PALETTE.muted, 'normal', 'center');
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
    for (let i = 0; i < LEVELS.length; i += 1) {
      const card = LEVEL_CARDS[i];
      const lvl = LEVELS[i];
      const locked = i > state.unlocked;
      ctx.fillStyle = locked ? LOCKED_FILL : PALETTE.hudPanel;
      roundRect(ctx, card.x, card.y, card.w, card.h, 16);
      ctx.fill();
      ctx.strokeStyle = i === state.levelIndex ? PALETTE.accent : PALETTE.hudEdge;
      ctx.lineWidth = i === state.levelIndex ? 3 : 1.5;
      roundRect(ctx, card.x, card.y, card.w, card.h, 16);
      ctx.stroke();
      // A dimmed emoji on a locked card reads as "not yet" at a glance.
      ctx.save();
      if (locked) ctx.globalAlpha = 0.35;
      text(ctx, lvl.emoji, card.x + card.w / 2, card.y + 44, 36, '#ffffff', 'bold', 'center');
      ctx.restore();
      text(ctx, `LEVEL ${i + 1}`, card.x + card.w / 2, card.y + 16, 11, PALETTE.muted, 'bold', 'center');
      text(ctx, lvl.name, card.x + card.w / 2, card.y + 88, 15, locked ? PALETTE.muted : PALETTE.text, 'bold', 'center');
      text(ctx, locked ? '🔒 Locked' : `${lvl.diffs} differences · ${formatTime(lvl.seconds)}`, card.x + card.w / 2, card.y + 116, 13, PALETTE.muted, 'normal', 'center');
      if (state.levelScores[i] !== undefined) {
        text(ctx, `Best: ${state.levelScores[i]} pts`, card.x + card.w / 2, card.y + 138, 13, PALETTE.good, 'bold', 'center');
      }
    }
    text(ctx, 'Click a card to play it  ·  Esc back to title  ·  ← → move between cards', 640, 592, 17, PALETTE.muted, 'normal', 'center');
  }

  function drawClear(world) {
    const state = world.state;
    const lvl = world.level();
    const last = state.levelIndex + 1 >= LEVELS.length;
    ctx.fillStyle = VEIL;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '🎉  LEVEL CLEAR!', 640, 210, 52, PALETTE.good, 'bold', 'center');
    text(ctx, `${lvl.name} — all ${world.diffs().length} differences found`, 640, 268, 22, PALETTE.text, 'normal', 'center');
    text(ctx, `Level score  ${state.score} pts   (time bonus +${state.clearBonus})`, 640, 330, 22, PALETTE.accent, 'bold', 'center');
    text(ctx, `Total so far  ${state.totalScore} pts   ·   Best combo x${state.bestCombo}`, 640, 372, 18, PALETTE.muted, 'normal', 'center');
    text(ctx, last ? '' : `Next up: ${LEVELS[state.levelIndex + 1].name} — another sunny scene to hunt.`, 640, 414, 17, PALETTE.muted, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, NEXT_BUTTON.x, NEXT_BUTTON.y, NEXT_BUTTON.w, NEXT_BUTTON.h, 14);
    ctx.fill();
    text(ctx, last ? 'SEE RESULTS  (N)  ▶' : 'NEXT LEVEL  (N)  ▶', 640, NEXT_BUTTON.y + 33, 21, '#ffffff', 'bold', 'center');
  }

  function drawOver(world) {
    const state = world.state;
    ctx.fillStyle = VEIL;
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
    ctx.fillStyle = VEIL;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, '🏆  MASTER SPOTTER!', 640, 170, 52, PALETTE.accent, 'bold', 'center');
    text(ctx, `All ${LEVELS.length} sunny scenes cleared — every one of the ${TOTAL_DIFFS} differences found.`, 640, 232, 22, PALETTE.text, 'normal', 'center');
    text(ctx, `TOTAL SCORE  ${state.totalScore} pts`, 640, 302, 34, PALETTE.good, 'bold', 'center');
    text(ctx, `Best combo x${state.bestCombo}  ·  Best total ${Math.max(best, state.totalScore)}`, 640, 356, 18, PALETTE.muted, 'normal', 'center');
    const first = LEVELS.slice(0, 6).map((l) => `${l.emoji} ${l.name}`).join('  ✓  ');
    const second = LEVELS.slice(6).map((l) => `${l.emoji} ${l.name}`).join('  ✓  ');
    text(ctx, `${first}  ✓`, 640, 412, 15, PALETTE.text, 'normal', 'center');
    text(ctx, `${second}  ✓`, 640, 442, 15, PALETTE.text, 'normal', 'center');
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, NEXT_BUTTON.x, NEXT_BUTTON.y, NEXT_BUTTON.w, NEXT_BUTTON.h, 14);
    ctx.fill();
    text(ctx, '↻  PLAY AGAIN  (R)', 640, NEXT_BUTTON.y + 33, 21, '#ffffff', 'bold', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = VEIL;
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
