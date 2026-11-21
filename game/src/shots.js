// The screenshot scenes behind ?shot=cover|play|end|levels. Each one
// sets the real game state — a level in progress with some differences
// already ringed and some still hiding, a level-clear screen, or the
// level-select screen — so the frame is exactly what a player sees, with
// the same seed always giving the same frame.
//
//   cover  — Harbor Morning mid-hunt: 3 of 7 found, counter and timer live
//   play   — Night Market mid-hunt: 2 of 8 found, a different scene
//   end    — Harbor Morning cleared: score, time bonus, next-level button
//   levels — the level-select screen, two levels unlocked
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
    return stageMidHunt(world, 1, ['moon-phase', 'lantern-color'], 225, 2, 121);
  }
  if (name === 'end') {
    world.startLevel(0);
    const state = world.state;
    state.found = world.diffs().map((d) => d.id);
    state.score = 1540;
    state.clearBonus = 840;
    state.totalScore = 1540;
    state.bestCombo = 5;
    state.timeLeft = 84;
    state.animTime = 0.6;
    state.messageT = 0;
    state.screen = SCREEN_CLEAR;
    return { screen: SCREEN_CLEAR, best: 1540 };
  }
  if (name === 'levels') {
    world.startLevel(0);
    const state = world.state;
    state.unlocked = 1;
    state.levelScores = [1540];
    state.animTime = 0.6;
    state.screen = SCREEN_SELECT;
    return { screen: SCREEN_SELECT, best: 1540 };
  }
  // cover (and the default): Harbor Morning, 3 of 7 found.
  return stageMidHunt(world, 0, ['sun-rays', 'sail-color', 'gull-missing'], 340, 2, 98);
}
