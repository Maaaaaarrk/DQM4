# Handoff — Withered Dex family tree

For the next session (human or agent). This started in Grok App Builder as a better UI than [MetalKid's Synthesis Tree](https://dev.metalkid.info/DQM4/SynthesisTree).

## Product status

Working **Family Tree** page only. Original user goal: rebuild MetalKid's DQM4 tools with a clearer pedigree (in-game Warhog tree as the visual spec).

Not built yet: Monsterpedia stats page, multi-recipe picker, team builder, location maps.

## Why it exists

MetalKid's site has the data but the synthesis UI is hard to use. User (slime-family / drag-and-drive player) wanted:

1. In-game style pedigree (focus + two parents, brown T-junctions with a junction **node**)
2. Never-ending expand through synth-only monsters
3. Family+rank wildcards the **user** picks (not auto-resolved)
4. Scoutable vs synthesis-only
5. Real portraits

## File map

| Path | Role |
|---|---|
| `src/routes/index.tsx` | Page chrome: layout toggle, expand commands, search, footer legend |
| `src/components/family-tree.tsx` | Layout, wires, expand state, path keys |
| `src/components/tree-viewport.tsx` | Wheel zoom (cursor-anchored), drag pan, no text-select |
| `src/components/monster-card.tsx` | Portrait + name + rank/family/synth/expand |
| `src/components/wildcard-card.tsx` | Family − Rank title, member `<select>` |
| `src/components/monster-sprite.tsx` | Portrait, or the family icon when none exists |
| `src/components/family-icon.tsx` | Family PNG badges (`public/families/*.png`) |
| `src/lib/monsters.ts` | Index the JSON, `pickParents`, `familyMembers` |
| `src/data/dqm4/*.json` | Roster, recipes, traits, skills, growth, resistances, scout places |
| `public/portraits/{id}.png` | Species portraits. Missing ids use the family icon |
| `src/styles.css` | Parchment / chrome / gold / green tokens |

## Data rules (`monsters.ts`)

- Species = rows in `Monster.json` whose name does **not** contain `Family (`.
- `synthOnly` = species with no row in `ScoutSpot.json`.
- `pickParents(resultId)`:
  1. Prefer a **specific** (non-family) pair.
  2. If the result is catchable, return `[]` rather than a family wildcard (so scoutable mons are leaves unless they have a concrete recipe).
  3. Else use the family+rank wildcard pair.
- `familyMembers(family, rank)` sorts scouted first (`· wild` in the dropdown).

## Tree layout (`family-tree.tsx`)

- Nodes keyed by **path**, not species id (Komodo / Swarmtroop duplicates).
- `open: Set<string>` of expanded paths. Root's two parents are always shown.
- `picks: Record<path, speciesId>` for wildcard dropdowns. Changing a pick prunes open descendants.
- Cycle guard: `ancestors` set of species ids while walking.
- **Packed subtrees**: each expanded node lays out left/right parent subtrees side by side (`SUBTREE_GAP`), then centers itself on the parent-portrait midpoint. This stopped sibling T-bars merging into one line.
- **Horizontal**: up-tree (`dir:"up"`) stacked above down-tree; focus left, vertically centered on the two parent portraits.
- **Vertical**: both parent subtrees `dir:"down"` under the focus.
- Wires: SVG orthogonal T (`tee`) with a filled circle at the bar. Horizontal root uses a rail + junction.

### Expand commands

`ExpandCommand = { action: "all" | "scoutable" | "none"; seq: number }`

- `all` — recurse every species (and already-picked wildcards).
- `scoutable` — expand only while `monster.synthOnly` (stop at wild-caught).
- `none` — collapse to the two immediate parents.

## Viewport (`tree-viewport.tsx`)

- Viewport is `absolute inset-0` on `main.stage-field` (must fill the stage; sizing to the tree clipped pan/zoom).
- Transform: `translate(x,y) scale(z)` origin top-left. Wheel uses `preventDefault` (native listener, `{passive:false}`).
- Pan: pointerdown records origin; **only after >6px move** call `setPointerCapture`. Immediate capture stole card clicks.
- `user-select: none` + `selectstart` preventDefault so drag doesn't highlight names.

## Portraits

`MonsterSprite` loads `public/portraits/{identifier}.png` when `portrait-ids.json` lists that id. Otherwise it shows the family icon.

Wildcard cards: family icon until a species is picked, then that portrait.

## Visual contract

- Focus card: dark green (`--color-focus`). Parents: lighter green (`--color-parent`).
- Portrait left; name; under name: rank badge, family icon, purple flask if synth-only, square +/−.
- Rank/family/synth/expand badges: white ring, square `rounded-md` (not circles).
- Family icons fill the badge (no inner padding).
- Lines: 6px `--color-line`, round caps, junction circle r=6.

## Known issues / next

1. **Monsterpedia** was the planned second page (stats, locations, skills) — not started.
2. Only **one** recipe per result (`pickParents` takes the first specific). Some monsters have multiple recipes.
3. `Size.json` is unused (user asked to drop size from the card).
4. Deep trees are wide; zoom/pan is the intended navigation. No minimap.
5. Grok App Builder scaffold (`public/__grok`, `scripts/grok-pwa-*`, `server/`) is still in the repo. Safe to leave; auth is unused.
6. Footer legend is one row: Rank, Synthesis Only, Expand, Minimize, family icons + “Family”, MetalKid credit.

## Suggested first tasks in a new session

1. Confirm `npm install && npm run dev` and expand Hunter Mech → Avian Android.
2. Monster details already live at `/monster`. Stats, traits, skills, drops, growth, resistances, and habitats are on that page.
3. Optional: recipe switcher when `recipesByResult` has more than one specific pair.

## Commands

```bash
npm install
npm run dev          # :8080
npm run typecheck
npm run build
```
