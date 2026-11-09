# Synthline

Public guide site for Dragon Quest Monsters: The Dark Prince synthesis. The product name is Synthline. Pushing `main` publishes [GitHub Pages](https://maaaaaarrk.github.io/DQM4/).

Read [README.md](README.md) for the guides and how to run the app.

## Data

- Roster, recipes, skills, traits, personalities, growth, and scout spots live in `src/data/dqm4/`.
- Credit English names to MetalKid Databases. The How to get footer links that credit.
- The UI shows English. Japanese stays in the JSON.
- `synthOnly` is true when that species has no row in `ScoutSpot.json`.
- `pickParents` prefers a species-specific pair. A scoutable result with no specific pair has no parents in the tree. Any other result uses the family-and-rank wildcard pair.
- A family parent is `{ type: "family", tokenId, family, rank }`. The user picks the species.
- Portraits are `public/portraits/{identifier}.png`. A missing portrait uses the family icon.
- Leave `*.local` files untracked. Commit the derived JSON and the images the site serves.
- Keep notes about producing those files out of the repository.

## UI invariants

- Tree nodes use path keys. The same species can appear more than once.
- Parent layout uses packed subtrees in `src/components/family-tree.tsx`.
- The zoom viewport is `absolute inset-0` on the stage.
- Pointer capture starts after the pan threshold so a click still reaches a card.
- Family icons, portraits, and status icons go through `publicAsset()` so they resolve when the site is served at `/DQM4/`.
- Local dev base is `/`. The Pages workflow sets `VITE_BASE_PATH=/DQM4/`.

## Checks

```bash
npm run typecheck
npm run build
```
