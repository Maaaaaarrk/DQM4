# Synthline

Unofficial synthesis guides for **Dragon Quest Monsters: The Dark Prince**.

Scout. Synth. Repeat.

Live site: [https://maaaaaarrk.github.io/DQM4/](https://maaaaaarrk.github.io/DQM4/)

Dragon Quest and Dragon Quest Monsters are trademarks of Square Enix. Synthline is an unofficial fan database and is not affiliated with or endorsed by Square Enix.

English names are from [MetalKid Databases](https://github.com/MetalKid/Databases).

## Guides

- **How do I get this monster** walks the pedigree back to a monster you can scout.
- **What can I build from this monster** locks a monster you have and climbs the syntheses you choose.
- **Monster list** filters the roster by rank, family, and scoutable or synthesis-only.
- **Monster details** shows caps, traits, skill, drops, growth, resistances, and habitat.
- **Skills** lists each skill, its talent-point costs, and the traits and abilities it teaches.
- **Personalities** shows how each personality raises or lowers growth.
- **Team planner** holds four main slots and four reserve slots. A large monster fills two slots. The lineup stays in this browser. A share link carries only the party.
- **Maps** opens each field, dungeon, and town map.

## Develop

Requires Node 22.

```bash
npm install
npm run dev
```

The dev server is [http://localhost:8080](http://localhost:8080).

```bash
npm run typecheck
npm run build
```

A push to `main` builds the static site and publishes it with GitHub Pages. That build sets `VITE_BASE_PATH=/DQM4/`.

The app is a static client over the JSON in `src/data/dqm4/`. The team planner is stored in the browser.
