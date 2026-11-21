// Boot and the one loop: input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one),
// and the renderer paints what is there. The game moves between six
// screens: title, level select, play, paused, level clear, time up, and
// the all-levels-done screen.
//
// ?seed=N fixes the scene's random draws. ?shot=cover|play|end|levels
// (with &seed=N) stages that scene instead of running the loop, paints
// it twice and sets window.__shotReady for a screenshot.
//
// A click is routed by where it lands: the hint button and the big
// screen buttons first, the level cards on the select screen, and only
// then the two picture panels (either panel counts — both share scene
// coordinates). Keyboard: H hint, N next, P pause, R retry, Esc back.

import { BEST_KEY, FIELD, HUD, LEVELS, PANEL, PANEL_LEFT, PANEL_RIGHT, STEP, UNLOCK_KEY } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_CLEAR,
  EVENT_FOUND,
  EVENT_HINT,
  EVENT_OVER,
  EVENT_WRONG,
  SCREEN_CLEAR,
  SCREEN_DONE,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_SELECT,
  SCREEN_TITLE,
  createWorld,
} from './world.js';
import {
  ACTION_BACK,
  ACTION_CONFIRM,
  ACTION_HINT,
  ACTION_MOVE_LEFT,
  ACTION_MOVE_RIGHT,
  ACTION_MUTE,
  ACTION_NEXT,
  ACTION_PAUSE,
  ACTION_RETRY,
  createInput,
} from './input.js';
import {
  LEVEL_CARDS,
  NEXT_BUTTON,
  PAUSE_BUTTON,
  RETRY_BUTTON,
  START_BUTTON,
  createRenderer,
} from './render.js';
import { createSound } from './sound.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readNumber(key) {
  try {
    return Number.parseInt(window.localStorage.getItem(key) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveNumber(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Which picture panel (if either) holds this logical point, and where
// inside the scene it is.
function panelHit(x, y) {
  if (y >= PANEL_LEFT.y && y <= PANEL_LEFT.y + PANEL.height) {
    if (x >= PANEL_LEFT.x && x <= PANEL_LEFT.x + PANEL.width) {
      return { x: x - PANEL_LEFT.x, y: y - PANEL_LEFT.y };
    }
    if (x >= PANEL_RIGHT.x && x <= PANEL_RIGHT.x + PANEL.width) {
      return { x: x - PANEL_RIGHT.x, y: y - PANEL_RIGHT.y };
    }
  }
  return null;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readNumber(BEST_KEY);
  let unlocked = readNumber(UNLOCK_KEY);
  world.state.unlocked = Math.min(unlocked, LEVELS.length - 1);
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen
  // changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function bankScore() {
    const total = world.state.totalScore;
    if (total > best) {
      best = total;
      saveNumber(BEST_KEY, best);
    }
    if (world.state.unlocked > unlocked) {
      unlocked = world.state.unlocked;
      saveNumber(UNLOCK_KEY, unlocked);
    }
  }

  function startLevel(index) {
    world.startLevel(index);
    screen = SCREEN_PLAY;
    accumulator = 0;
    announce(`Playing ${LEVELS[index].name}. Find ${LEVELS[index].diffs} differences.`);
  }

  function handleClick(point) {
    sound.unlock();
    if (!point) return;
    const state = world.state;
    if (screen === SCREEN_TITLE) {
      if (inRect(point.x, point.y, START_BUTTON)) {
        screen = SCREEN_SELECT;
        announce('Choose your hunt.');
      }
      return;
    }
    if (screen === SCREEN_SELECT) {
      for (let i = 0; i < LEVEL_CARDS.length; i += 1) {
        if (inRect(point.x, point.y, LEVEL_CARDS[i]) && i <= state.unlocked) {
          sound.click();
          startLevel(i);
          return;
        }
      }
      return;
    }
    if (screen === SCREEN_CLEAR || screen === SCREEN_DONE) {
      if (inRect(point.x, point.y, NEXT_BUTTON)) {
        sound.click();
        if (screen === SCREEN_DONE) {
          world.reset();
          world.state.unlocked = unlocked;
          screen = SCREEN_SELECT;
        } else {
          startLevel(state.levelIndex + 1);
        }
      }
      return;
    }
    if (screen === SCREEN_OVER) {
      if (inRect(point.x, point.y, RETRY_BUTTON)) {
        sound.click();
        startLevel(state.levelIndex);
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    // The orange pause circle in the HUD's top-right corner (v4).
    if (inRect(point.x, point.y, PAUSE_BUTTON)) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (inRect(point.x, point.y, HUD.hintButton)) {
      if (world.useHint() & EVENT_HINT) sound.hint();
      return;
    }
    const hit = panelHit(point.x, point.y);
    if (!hit) return;
    const events = world.clickAt(hit.x, hit.y);
    if (events & EVENT_FOUND) {
      sound.found(state.combo);
      announce(state.message);
    }
    if (events & EVENT_WRONG) {
      sound.wrong();
      announce(state.message);
    }
    if (events & EVENT_CLEAR) {
      if (state.screen === SCREEN_DONE) sound.fanfare();
      else sound.clear();
      bankScore();
      screen = state.screen;
      announce(`Level clear! Score ${state.score}.`);
    }
    if (events & EVENT_OVER) {
      sound.over();
      bankScore();
      screen = SCREEN_OVER;
      announce('Time up.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    if (click) handleClick(click);
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (world.useHint() & EVENT_HINT) sound.hint();
    }
    if (actions & ACTION_MOVE_LEFT && screen === SCREEN_SELECT) {
      world.state.levelIndex = Math.max(0, world.state.levelIndex - 1);
    }
    if (actions & ACTION_MOVE_RIGHT && screen === SCREEN_SELECT) {
      world.state.levelIndex = Math.min(world.state.unlocked, world.state.levelIndex + 1);
    }
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_NEXT) {
      if (screen === SCREEN_CLEAR) startLevel(world.state.levelIndex + 1);
      else if (screen === SCREEN_DONE) {
        world.reset();
        world.state.unlocked = unlocked;
        screen = SCREEN_SELECT;
      }
    }
    if (actions & ACTION_RETRY) {
      if (screen === SCREEN_OVER) startLevel(world.state.levelIndex);
      else if (screen === SCREEN_DONE) {
        world.reset();
        world.state.unlocked = unlocked;
        screen = SCREEN_SELECT;
      }
    }
    if (actions & ACTION_BACK) {
      if (screen === SCREEN_SELECT) screen = SCREEN_TITLE;
      else if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      }
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) {
      screen = SCREEN_SELECT;
      announce('Choose your hunt.');
    }
  }

  function step() {
    const events = world.step(STEP);
    if (events & EVENT_OVER) {
      sound.over();
      bankScore();
      screen = SCREEN_OVER;
      announce('Time up.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    // The world owns the end-of-level transitions (clear / time up);
    // adopt them even when the click arrived outside handleClick, so
    // the shown screen can never disagree with the world.
    if (screen === SCREEN_PLAY && world.state.screen !== SCREEN_PLAY) {
      if (world.state.screen === SCREEN_CLEAR || world.state.screen === SCREEN_DONE) {
        if (world.state.screen === SCREEN_DONE) sound.fanfare();
        else sound.clear();
        bankScore();
      } else if (world.state.screen === SCREEN_OVER) {
        sound.over();
        bankScore();
      }
      screen = world.state.screen;
    }
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      // The scenes stay gently alive behind the title and menus.
      while (accumulator >= STEP) {
        world.state.animTime += STEP;
        accumulator -= STEP;
      }
    }
    renderer.draw(world, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the clock
  // run down unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  // A small test hook for the maker's own playtest: the live state, the
  // difference list and a click driver, so a script can play the real
  // rules and check the counter moves.
  window.__spot = {
    state: world.state,
    diffs: () => world.diffs(),
    screen: () => screen,
    clickAt: (x, y) => world.clickAt(x, y),
    hint: () => world.useHint(),
    startLevel,
  };

  announce('Spot the Difference. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
