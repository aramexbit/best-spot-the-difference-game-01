// The screenshot scenes behind ?shot=cover|play|end|levels. Each one
// sets the real game state — a level in progress with some differences
// already ringed and some still hiding, a level-clear screen, or the
// level-select screen — so the frame is exactly what a player sees, with
// the same seed always giving the same frame.
//
//   cover  — Candy Town mid-hunt: 4 of 9 found, the densest scene
//   play   — Rainbow Garden mid-hunt: 3 of 8 found, a different scene
//   end    — Harbor Morning cleared: score, time bonus, next-level button
//   levels — the level-select screen, five levels unlocked
// Any other name stages the cover.

import { SCREEN_CLEAR, SCREEN_PLAY, SCREEN_SELECT } from './world.js';

function stageMidHunt(world, levelIndex, foundIds, score, combo, timeLeft) {
  world.startLevel(levelIndex);
  const state = world.state;
  state.found = [...foundIds];
  state.score = score;
  state.combo = combo;
  state.bestCombo = combo;
  state.timeLeft = timeLeft;
  state.animTime = 0.6;
  state.message = `${foundIds.length} found — ${world.remaining()} still hiding. Keep looking!`;
  state.messageT = 99;
  state.screen = SCREEN_PLAY;
  return { screen: SCREEN_PLAY, best: 0 };
}

export function stageShot(name, world) {
  if (name === 'play') {
    // Rainbow Garden, 3 of 8 found (100 + 125 + 150 = 375).
    return stageMidHunt(world, 3, ['rainbow-band', 'sunflower-missing', 'birdhouse-door'], 375, 3, 121);
  }
  if (name === 'end') {
    world.startLevel(0);
    const state = world.state;
    state.found = world.diffs().map((d) => d.id);
    // 7 finds at combo 1..7: 100+125+150+175+200+225+250 = 1225,
    // plus the time bonus 84s x 10 = 840, so 2065 in total.
    state.score = 2065;
    state.clearBonus = 840;
    state.totalScore = 2065;
    state.bestCombo = 7;
    state.timeLeft = 84;
    state.animTime = 0.6;
    state.messageT = 0;
    state.screen = SCREEN_CLEAR;
    return { screen: SCREEN_CLEAR, best: 2065 };
  }
  if (name === 'levels') {
    world.startLevel(0);
    const state = world.state;
    state.unlocked = 4;
    state.levelScores = [1540, 1280, 1910, 940];
    // Highlight the newest unlocked card (Beach Party) with the accent ring.
    state.levelIndex = 4;
    state.animTime = 0.6;
    state.screen = SCREEN_SELECT;
    return { screen: SCREEN_SELECT, best: 1910 };
  }
  // cover (and the default): Candy Town, 4 of 9 found
  // (100 + 125 + 150 + 175 = 550) — the densest scene mid-hunt.
  return stageMidHunt(world, 6, ['lollipop-color', 'gumdrop-missing', 'shop-sign', 'cane-stripe'], 550, 4, 98);
}
