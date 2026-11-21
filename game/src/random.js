// A small deterministic random source (mulberry32) so a ?seed=N URL
// always deals the same scene, and the screenshot scenes are stable.
// The game itself seeds from the clock unless a seed is given.

export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    /** Next float in [0, 1). */
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Next integer in [min, max]. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Pick one element of an array (never called on an empty one). */
    pick(list) {
      if (list.length === 0) throw new Error('createRandom.pick: empty list');
      return list[Math.floor(this.next() * list.length)];
    },
  };
}
