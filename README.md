[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/aramexbit/best-spot-the-difference-game-01/rank.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/aramexbit/best-spot-the-difference-game-01/reward.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)

# Spot the Difference — Harbor, Market & Forest

Two pictures. Almost the same. Find what changed — before the clock runs out.

An original spot-the-difference game built for the [make.fun bounty](https://make.fun/c/best-spot-the-difference-game-20261121-0451) (best spot the difference game, $50). Every scene is drawn procedurally on canvas — vector shapes, no image files, no network requests — so the two panels are pixel-identical except for the differences planted on purpose.

## How to play

- **Click** a difference on either picture: a gold ring snaps around it with a chime, and your combo grows.
- **Wrong click**: a small shake, the combo breaks, and 5 seconds come off the clock.
- **Hint** (button or `H`): 3 per level, 8s cooldown — one hiding difference pulses blue.
- **Timer bar**: clear the level before it empties for a time bonus.
- **Keys**: `H` hint · `N` next level · `P` pause · `R` retry · `M` mute · `Esc` back.

## The three hunts

| Level | Scene | Differences | Time |
| --- | --- | --- | --- |
| 1 | Harbor Morning ⚓ | 7 — sun rays, sail colour, a missing gull… | 2:30 |
| 2 | Night Market 🏮 | 8 — moon phase, lantern, roof cat… | 2:30 |
| 3 | Forest Camp 🌲 | 10 — tent colour, owl, campfire flame… | 3:00 |

25 differences in all. Clear a level to unlock the next; clear all three to become Master Spotter.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies: `game/` is plain static files.

## Layout

- `game/index.html` + `game/style.css` — page chrome around the canvas
- `game/src/main.js` — boot, game loop, click routing, screens
- `game/src/config.js` — tuning numbers, palettes, level definitions
- `game/src/world.js` — the three procedural scenes, the planted differences, rules & scoring
- `game/src/render.js` — HUD, panels, found-rings, title / select / clear screens
- `game/src/input.js` — mouse + keyboard
- `game/src/sound.js` — WebAudio effects (no audio files)
- `game/src/shots.js` — the four screenshot scenes (`?shot=cover|play|end|levels`)
- `game/src/random.js` — deterministic random source (`?seed=N`)
- `main.ts` — the entry program: copies `game/` + `screenshots/` and writes `dossier.json`
- `shots.json` — the screenshot list for the entry

## License

MIT — see [LICENSE](LICENSE).
