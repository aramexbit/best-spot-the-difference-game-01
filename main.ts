// Spot the Difference — entry program (Node 22, standard library only).
//
// v4: the opening level is a sunny playground, and the HUD wears the
// concept's wooden sign, timer pill and bottom bar. The screenshots are
// the playground at 4/7, the garden at 3/8, the playground cleared, and
// the level grid — all byte-different from v3. The entry program itself
// is unchanged since v3 (clear only the output directory's contents,
// never the directory itself — the grader mounts it).
// v5: a twelfth scene, the Firefly Night Garden, joins the hunt; the HUD
// names every difference already found; the playground is denser; the
// screenshots are the playground at 4/7, the night garden at 4/7, the
// playground cleared, and the twelve-card grid — all byte-different
// from v4. The entry program's copy logic is unchanged since v3.
// v5 revision pass: the night swarm glows a touch brighter and the
// Found line reads at 15px, so the re-taken shots match the code.
//
// The game lives in game/ as plain static files a desktop browser loads
// offline (game/index.html plus its ES modules, no library, no network
// request): twelve procedural scenes, 98 planted differences.
// This program hands it in: it copies game/ and screenshots/
// from beside this file into the output directory and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library (vendor/makefun-game.ts, the kit's copy, unchanged).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/**
 * Remove everything inside `dir` without removing `dir` itself.
 * The grader mounts the output directory as a volume, so removing
 * the mount point throws at once: v2 died on this call in 387 ms
 * with exit 1, before copying a single file, and the failure
 * reproduces locally as EACCES at the same call under the grader's
 * mount (read-only repo, another cwd, uid 65534, empty mounted
 * output). The directory already exists at the grader; creating it
 * only matters for a local run.
 */
function clearDirectoryContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

// Start from a clean output directory so a stale file from an earlier
// run can never leak into the entry. Fail loudly when the game itself
// is missing instead of handing in an empty directory.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing; nothing to hand in');
}
clearDirectoryContents(out);
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB — the four staged scenes cover, play, end and levels —;
// more than 993 files in game/ or 48 MiB of game files in all, or a path
// under game/ over 1000 bytes — game/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
