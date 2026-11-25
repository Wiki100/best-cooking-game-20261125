# Simmer & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Wiki100/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Wiki100/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Simmer & Serve is an original two-minute kitchen rush for make.fun's `best-cooking-game-20261125-0137` bounty. Orders land on the board, patience drains, and you chop, cook, plate and serve before the tickets walk out.

## How to play

- **Take an order** from the board at the top — each ticket shows the dish, its parts and a patience bar.
- **Pantry (click, or keys 1–6):** pick up tomato, noodle, egg, rice, berry or flour.
- **Chop [C]:** put a tomato on the board; it is chopped after a short wait.
- **Cook [V]:** put noodles, egg, rice or flour on a burner; take it off when it is cooked — leave it and it burns.
- **Plate [B]:** add a finished part to the plate (up to three parts).
- **Serve [Space] or the bell:** serve the plate when it matches an open order. Fast serves pay a tip; serving in a row builds a combo.
- **Trash [X]:** throw away what you hold, or clear a burnt burner.
- **Move:** click anywhere to walk there, or use the arrow keys / WASD. **M** mutes the synthesized sounds.

The last 30 seconds are the rush: tickets arrive faster and wait less patiently. A shift is 120 seconds; the end screen shows dishes served, coins, best combo and score.

## The menu

| Dish | Parts | Price |
| --- | --- | --- |
| Tomato Noodle Bowl | cooked noodle + chopped tomato | $12 |
| Golden Fried Rice | cooked rice + cooked egg | $14 |
| Berry Pancake Stack | cooked flour + berry | $13 |
| Garden Salad | chopped tomato + berry | $9 |
| Sunrise Noodles | cooked noodle + cooked egg + chopped tomato | $15 |
| Berry Rice Pudding | cooked rice + berry | $11 |

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network: every script is a file under `game/`, and the sounds are synthesized with the Web Audio API.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `game/` and `screenshots/` to `out/` and writes `out/dossier.json`. Screenshots are taken in headless Chrome at 1280×720 from the game itself, using `shots.json`: the title, a dish mid-assembly, the rush, and the end screen.

## Layout

- `game/src/config.js` — tuning, palette and station layout
- `game/src/recipes.js` — ingredients and the six dishes
- `game/src/orders.js` — the order board and its patience
- `game/src/kitchen.js` — hands, board, burners, plate and serving
- `game/src/render.js` — everything drawn on the canvas
- `game/src/input.js` — mouse and keyboard
- `game/src/audio.js` — synthesized sounds
- `game/src/shots.js` — deterministic screenshot setups
- `game/src/main.js` — boot and the shift loop

---

Entered on [make.fun](https://make.fun/?ref=jp7z4tkr&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards
