# Withered Dex

Interactive **Dragon Quest Monsters: The Dark Prince / Withered World (DQM4)** family tree.

Synthesis pedigrees with in-game-style cards, MetalKid sprite portraits, pan/zoom, and expand-until-scoutable.

Data is from [MetalKid Databases](https://github.com/MetalKid/Databases) (DQM4). Sprites are sliced from their `monsters-sprite.jpg` sheet.

## Run locally

```bash
npm install
npm run dev
```

Dev server: `http://localhost:8080`.

Static host: [https://maaaaaarrk.github.io/DQM4/](https://maaaaaarrk.github.io/DQM4/). Pushes to `main` build with `VITE_BASE_PATH=/DQM4/` and publish via GitHub Pages.

```bash
npm run typecheck
npm run build
```

## What you can do

- Search / pick any monster as the tree root
- Horizontal (focus left, parents up/down) or vertical (focus top, parents below)
- Expand / collapse a node with **+ / −**
- **Expand all**, **Expand to Scoutable** (stop at wild-caught monsters), **Minimize all**
- Family+rank wildcards with a dropdown to pick a species
- Wheel zoom toward cursor, drag to pan

## Stack

TanStack Start + React 19 + Tailwind v4. Auth/DB are **off** — this is a static client app over JSON.

See [HANDOFF.md](HANDOFF.md) for architecture, file map, and next-session notes.
