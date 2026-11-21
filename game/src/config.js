// Every tuning number, colour and level definition in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.
//
// Layout (logical pixels): a HUD bar across the top, then two picture
// panels side by side — the original on the left, the altered copy on
// the right — and a message strip along the bottom. Each panel shows the
// same procedural scene; only the planted differences change.
//
// v2: eleven sunny scenes, 91 planted differences, and a cheerful light
// palette — bright sky blue, sunny yellow, coral, mint and warm cream —
// so every frame reads bright and friendly at a glance.
// v4: the opening hunt is a sunny playground (boy, girl, dog, slide and
// a smiling sun), and the HUD wears the concept's wooden sign, a dark
// blue timer pill and a wooden "Click the differences!" bar. The pause
// circle and the hint pill are clickable rects too — see main.js.

export const FIELD = { width: 1280, height: 720 };

// The simulation's fixed step, in seconds: 60 updates a second whatever
// the display's rate.
export const STEP = 1 / 60;

// One picture panel, in scene coordinates (the scene is drawn at this
// size on an offscreen canvas, then blitted into both panels).
export const PANEL = { width: 560, height: 470, radius: 10 };
export const PANEL_LEFT = { x: 40, y: 118 };
export const PANEL_RIGHT = { x: 680, y: 118 };
export const PANEL_GAP = 80;

export const HUD = {
  height: 96,
  // Bottom-left, under the left panel, like the concept's Hint pill.
  hintButton: { x: 24, y: 612, w: 150, h: 56 },
  // Orange pause circle, top-right beside the timer pill.
  pauseButton: { x: 1200, y: 13, w: 52, h: 52 },
  // Wooden "Find all N differences!" sign, centred across the top.
  sign: { x: 440, y: 14, w: 400, h: 50 },
  // Dark blue timer + counter pill, top-right.
  pill: { x: 880, y: 14, w: 300, h: 50 },
  // Green "N Found • M To Go!" strip under the pill.
  strip: { x: 900, y: 68, w: 260, h: 22 },
  // Wooden "Click the differences!" bar along the bottom.
  bottomBar: { x: 300, y: 612, w: 680, h: 56 },
  // Cream score chip, bottom-right.
  scoreChip: { x: 1000, y: 612, w: 256, h: 56 },
};
export const MESSAGE_Y = 650;

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
  { name: 'Sunny Playground', sub: 'Level 1 — Easy · 7 differences', seconds: 150, diffs: 7, emoji: '🛝' },
  { name: 'Sunny Street Market', sub: 'Level 2 — Easy · 8 differences', seconds: 150, diffs: 8, emoji: '🛍️' },
  { name: 'Sunny Meadow', sub: 'Level 3 — Medium · 10 differences', seconds: 180, diffs: 10, emoji: '🌳' },
  { name: 'Rainbow Garden', sub: 'Level 4 — Medium · 8 differences', seconds: 150, diffs: 8, emoji: '🌈' },
  { name: 'Beach Party', sub: 'Level 5 — Medium · 9 differences', seconds: 150, diffs: 9, emoji: '🏖️' },
  { name: 'Sunny Farm', sub: 'Level 6 — Medium · 8 differences', seconds: 150, diffs: 8, emoji: '🚜' },
  { name: 'Candy Town', sub: 'Level 7 — Hard · 9 differences', seconds: 150, diffs: 9, emoji: '🍭' },
  { name: 'Butterfly Meadow', sub: 'Level 8 — Medium · 7 differences', seconds: 150, diffs: 7, emoji: '🦋' },
  { name: 'Toy Workshop', sub: 'Level 9 — Medium · 8 differences', seconds: 150, diffs: 8, emoji: '🧸' },
  { name: 'Fruit Festival', sub: 'Level 10 — Hard · 9 differences', seconds: 150, diffs: 9, emoji: '🍓' },
  { name: 'Pool Party', sub: 'Level 11 — Medium · 8 differences', seconds: 150, diffs: 8, emoji: '🏊' },
];

/** Differences hidden across all eleven scenes (7 + 8 + 10 + 8 + 9 + 8 + 9 + 7 + 8 + 9 + 8). */
export const TOTAL_DIFFS = LEVELS.reduce((sum, level) => sum + level.diffs, 0);

// Cheerful light palette: bright sky blue, sunny yellow, coral, mint
// and warm cream. The page and HUD are light, so all text is dark and
// stays readable; the accent colours carry the sunny mood.
export const PALETTE = {
  backdrop: '#ffe9a8',
  backdropTop: '#aee3ff',
  hudPanel: '#fffdf5',
  hudEdge: '#f0d9a0',
  text: '#2e2a26',
  muted: '#7a6a55',
  accent: '#ff7a3d',
  accentDark: '#e85d26',
  good: '#1faa5c',
  bad: '#e5484d',
  ring: '#ffb703',
  ringFound: '#1faa5c',
  // v4: the concept's wood, pill blue and found-ring red.
  wood: '#a06a35',
  woodDark: '#6f4520',
  woodLight: '#c08a4e',
  pill: '#155a8a',
  pillDark: '#0f4266',
  foundRing: '#e5484d',
  pauseOrange: '#ff9f1c',
  hintPulse: '#2196f3',
  panelEdge: '#ffffff',
  panelShadow: 'rgba(120,80,20,0.25)',
  button: '#ff6b4a',
  buttonHover: '#ff8266',
  buttonDisabled: '#d8cfc0',
  chip: '#fff0c2',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best total score is kept between visits (this browser only). */
export const BEST_KEY = 'spot-the-difference.best';

/** Where the last unlocked level is kept between visits. */
export const UNLOCK_KEY = 'spot-the-difference.unlocked';
