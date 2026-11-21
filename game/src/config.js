// Every tuning number, colour and level definition in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.
//
// Layout (logical pixels): a HUD bar across the top, then two picture
// panels side by side — the original on the left, the altered copy on
// the right — and a message strip along the bottom. Each panel shows the
// same procedural scene; only the planted differences change.

export const FIELD = { width: 1280, height: 720 };

// The simulation's fixed step, in seconds: 60 updates a second whatever
// the display's rate.
export const STEP = 1 / 60;

// One picture panel, in scene coordinates (the scene is drawn at this
// size on an offscreen canvas, then blitted into both panels).
export const PANEL = { width: 560, height: 470, radius: 10 };
export const PANEL_LEFT = { x: 40, y: 118 };
export const PANEL_RIGHT = { x: 680, y: 118 };
export const PANEL_GAP = 40;

export const HUD = { height: 96, hintButton: { x: 1052, y: 18, w: 188, h: 60 } };
export const MESSAGE_Y = 612;

// Scoring: a find is worth 100, plus 25 for each step of the combo
// chain; a wrong click breaks the chain and costs 5 seconds.
export const SCORE = {
  findBase: 100,
  comboStep: 25,
  wrongTimePenalty: 5,
  levelClearTimeBonus: 10,
  maxCombo: 8,
};

// Hints: how many each level grants, how long one hint pulses, and the
// cooldown between hints.
export const HINT = { perLevel: 3, pulseSeconds: 2.6, cooldownSeconds: 8 };

// Seconds on the clock when a level starts. The bar drains in real time;
// finding everything before it empties clears the level.
export const LEVELS = [
  { name: 'Harbor Morning', sub: 'Level 1 — Easy · 7 differences', seconds: 150, diffs: 7 },
  { name: 'Night Market', sub: 'Level 2 — Medium · 8 differences', seconds: 150, diffs: 8 },
  { name: 'Forest Camp', sub: 'Level 3 — Hard · 10 differences', seconds: 180, diffs: 10 },
];

/** Differences hidden across all three scenes (7 + 8 + 10). */
export const TOTAL_DIFFS = LEVELS.reduce((sum, level) => sum + level.diffs, 0);

export const PALETTE = {
  backdrop: '#141a26',
  backdropTop: '#1c2436',
  hudPanel: '#202839',
  hudEdge: '#39445e',
  text: '#f2f4f8',
  muted: '#9aa5bd',
  accent: '#ffd166',
  accentDark: '#e8a93d',
  good: '#7ee787',
  bad: '#ff6b6b',
  ring: '#ffd166',
  ringFound: '#7ee787',
  hintPulse: '#4fc3f7',
  panelEdge: '#3a4560',
  panelShadow: 'rgba(0,0,0,0.45)',
  button: '#2f6fed',
  buttonHover: '#3f7dff',
  buttonDisabled: '#3a4358',
  chip: '#28314a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'spot-the-difference.best';

/** Where the last unlocked level is kept between visits. */
export const UNLOCK_KEY = 'spot-the-difference.unlocked';
