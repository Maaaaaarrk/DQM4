# Withered Dex — project rules

Product: DQM4 synthesis family tree. Visual target is the in-game pedigree (parchment, brown T-junctions, green capsules).

## Do

- Keep path-based React keys / open-set (`root/up:avian-android/0:mecha-mynah`). Species ids duplicate in a tree.
- `ParentRef` is either `{type:"species",id}` or `{type:"family",tokenId,family,rank}`. Never auto-pick a wildcard species.
- `synthOnly === !scouted` from `MonsterLocation.json`. Scoutable expand stops at `!synthOnly`.
- Recipes: specific pair wins; if the result is catchable, do not fall back to family wildcards (`src/lib/monsters.ts` `pickParents`).
- Sprite portraits from `/dqm4/monsters-sprite.jpg` + `src/data/dqm4/sprite-map.json` (75px tiles, CSS background-position). Fallback to family icon.
- Credit MetalKid in the footer; data lives under `src/data/dqm4/`.

## Don't

- Don't layout with fixed pixel offsets for parent splits — use packed subtrees (`layoutSubtree` in `family-tree.tsx`).
- Don't `setPointerCapture` on pointerdown in the viewport (it ate card clicks). Capture only after the pan threshold.
- Don't size the zoom viewport to the tree; it must `absolute inset-0` on the stage.
- Don't add auth, Neon, or extra scaffold routes unless the user asks.

## Verify

`npm run typecheck`. Click expand on a parent card, pan, wheel-zoom, toggle horizontal/vertical, Expand to Scoutable.
