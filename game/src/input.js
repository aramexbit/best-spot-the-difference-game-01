// Input: mouse clicks and keyboard, translated into game actions.
// The canvas is drawn in a fixed 1280x720 logical space and scaled to
// the window by CSS, so a click's client coordinates are converted back
// to logical coordinates before anything tests them. Arrow keys move
// the highlighted card on the level-select screen (eleven cards now,
// so the keyboard is the quick way across them).
//
// Actions are bit flags consumed once per frame by main.js; a click also
// carries its logical position, because the world needs to know where
// the player pointed.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_NEXT = 8;
export const ACTION_RETRY = 16;
export const ACTION_BACK = 32;
export const ACTION_MUTE = 64;
export const ACTION_MOVE_LEFT = 128;
export const ACTION_MOVE_RIGHT = 256;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  h: ACTION_HINT,
  H: ACTION_HINT,
  n: ACTION_NEXT,
  N: ACTION_NEXT,
  r: ACTION_RETRY,
  R: ACTION_RETRY,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  Escape: ACTION_BACK,
  ArrowLeft: ACTION_MOVE_LEFT,
  ArrowRight: ACTION_MOVE_RIGHT,
};

export function createInput(canvas) {
  let actions = 0;
  let click = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    // Only the primary button plays; a right-click must never find
    // a difference by accident.
    if (event.button !== 0) return;
    click = toLogical(event);
    actions |= ACTION_CONFIRM;
  });

  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (action !== undefined) {
      event.preventDefault();
      actions |= action;
    }
  });

  // The browser must not scroll or select while the game is played.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    /** Actions pressed since the last call, then cleared. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click's logical position since the last call, then cleared. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
