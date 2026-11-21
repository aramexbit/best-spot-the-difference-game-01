[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/aramexbit/best-spot-the-difference-game-01/rank.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/aramexbit/best-spot-the-difference-game-01/reward.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)

# Spot the Difference — 11 Sunny Scenes

Two pictures. Almost the same. Find what changed — before the clock runs out.

An original spot-the-difference game built for the [make.fun bounty](https://make.fun/c/best-spot-the-difference-game-20261121-0451) (best spot the difference game, $50). Every scene is drawn procedurally on canvas — vector shapes, no image files, no network requests — so the two panels are pixel-identical except for the differences planted on purpose. Eleven sunny scenes in a cheerful palette: bright blue sky, sunny yellow, coral, mint and warm cream. Each scene is packed with objects, animals, decorations and small activities — busy frames worth studying.

## How to play

- **Click** a difference on either picture: a gold ring snaps around it with a chime, and your combo grows.
- **Wrong click**: a small shake, the combo breaks, and 5 seconds come off the clock.
- **Hint** (button or `H`): 3 per level, 8s cooldown — one hiding difference pulses blue.
- **Timer bar**: clear the level before it empties for a time bonus.
- **Keys**: `H` hint · `N` next level · `P` pause · `R` retry · `M` mute · `Esc` back · `←` `→` move between level cards.

## The eleven hunts

| Level | Scene | Differences | Time |
| --- | --- | --- | --- |
| 1 | Harbor Morning ⚓ | 7 — sun rays, sail colour, a missing gull… | 2:30 |
| 2 | Sunny Street Market 🛍️ | 8 — sun rays, lantern colour, a missing cat… | 2:30 |
| 3 | Sunny Meadow 🌳 | 10 — tent colour, owl, campfire flame… | 3:00 |
| 4 | Rainbow Garden 🌈 | 8 — rainbow band, a missing sunflower, a bee… | 2:30 |
| 5 | Beach Party 🏖️ | 9 — umbrella stripe, a missing crab, a castle flag… | 2:30 |
| 6 | Sunny Farm 🚜 | 8 — barn door, cow spots, a missing chicken… | 2:30 |
| 7 | Candy Town 🍭 | 9 — lollipop swirl, shop sign, a missing gumdrop… | 2:30 |
| 8 | Butterfly Meadow 🦋 | 7 — a purple butterfly, ladybug spots, a missing frog… | 2:30 |
| 9 | Toy Workshop 🧸 | 8 — teddy bow, block letter, a missing chimney puff… | 2:30 |
| 10 | Fruit Festival 🍓 | 9 — watermelon slice, grape bunch, juice sign… | 2:30 |
| 11 | Pool Party 🏊 | 8 — duck float, donut sprinkles, umbrella stripe… | 2:30 |

91 differences in all. Clear a level to unlock the next; clear all eleven to become Master Spotter. The butterflies flutter, the campfire flickers and the pool sparkles — the scenes stay gently alive while you hunt.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies: `game/` is plain static files.

## Screenshot scenes

Append `?shot=…&seed=7` to stage one of four fixed frames (the same seed always gives the same frame):

- `?shot=cover` — Candy Town mid-hunt, 4 of 9 found
- `?shot=play` — Rainbow Garden mid-hunt, 3 of 8 found
- `?shot=end` — Harbor Morning cleared, score and time bonus
- `?shot=levels` — the level-select grid, five levels unlocked

## Layout

- `game/index.html` + `game/style.css` — page chrome around the canvas
- `game/src/main.js` — boot, game loop, click routing, screens
- `game/src/config.js` — tuning numbers, palettes, level definitions
- `game/src/world.js` — the eleven procedural scenes, the planted differences, rules & scoring
- `game/src/render.js` — HUD, panels, found-rings, title / select / clear screens
- `game/src/input.js` — mouse + keyboard (arrow keys move between level cards)
- `game/src/sound.js` — WebAudio effects (no audio files)
- `game/src/shots.js` — the four screenshot scenes (`?shot=cover|play|end|levels`)
- `game/src/random.js` — deterministic random source (`?seed=N`)
- `main.ts` — the entry program: copies `game/` + `screenshots/` and writes `dossier.json`
- `shots.json` — the screenshot list for the entry

## License

MIT — see [LICENSE](LICENSE).
