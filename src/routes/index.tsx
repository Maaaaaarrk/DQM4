import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { FamilyTree, type ExpandCommand, type TreeOrient } from "@/components/family-tree";
import { SynthIcon } from "@/components/synth-icon";
import { TreeViewport } from "@/components/tree-viewport";
import { cn } from "@/lib/utils";
import {
  monster,
  ROOT_OPTIONS,
  searchSpecies,
  SPECIES,
  type Family,
} from "@/lib/monsters";

export const Route = createFileRoute("/")({ component: Home });

const FAMILIES: Family[] = [
  "slime",
  "dragon",
  "nature",
  "beast",
  "material",
  "demon",
  "undead",
  "boss",
];

const METALKID_REPO = "https://github.com/MetalKid/Databases";

function Home() {
  const defaultRoot = ROOT_OPTIONS[0] ?? SPECIES[0].id;
  const [rootId, setRootId] = useState<string>(defaultRoot);
  const [query, setQuery] = useState("");
  const [orient, setOrient] = useState<TreeOrient>("horizontal");
  const [expandCommand, setExpandCommand] = useState<ExpandCommand>({
    action: "none",
    seq: 0,
  });
  const matches = useMemo(() => searchSpecies(query).slice(0, 80), [query]);
  const options = useMemo(() => {
    const list = query.trim()
      ? matches
      : [
          ...ROOT_OPTIONS.map(monster),
          ...matches.filter((m) => !ROOT_OPTIONS.includes(m.id)),
        ];
    if (!list.some((m) => m.id === rootId)) {
      return [monster(rootId), ...list];
    }
    return list;
  }, [query, matches, rootId]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar relative flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <h1 className="font-display text-2xl font-extrabold tracking-wide text-gold drop-shadow-[0_2px_0_rgb(0_0_0_/0.45)] md:text-3xl">
          Family Tree
        </h1>
        <div
          role="group"
          aria-label="Tree layout"
          className="flex shrink-0 rounded-lg border-2 border-gold p-0.5"
        >
          {(["horizontal", "vertical"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={orient === mode}
              onClick={() => setOrient(mode)}
              className={cn(
                "rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide md:text-sm",
                orient === mode
                  ? "bg-gold text-chrome"
                  : "text-gold hover:bg-chrome-hi",
              )}
            >
              {mode === "horizontal" ? "Horizontal" : "Vertical"}
            </button>
          ))}
        </div>
        <div
          role="group"
          aria-label="Expand tree"
          className="flex shrink-0 rounded-lg border-2 border-gold p-0.5"
        >
          <button
            type="button"
            onClick={() =>
              setExpandCommand((c) => ({ action: "all", seq: c.seq + 1 }))
            }
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() =>
              setExpandCommand((c) => ({ action: "scoutable", seq: c.seq + 1 }))
            }
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Expand to Scoutable
          </button>
          <button
            type="button"
            onClick={() =>
              setExpandCommand((c) => ({ action: "none", seq: c.seq + 1 }))
            }
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Minimize all
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <label className="sr-only" htmlFor="search">
            Search monsters
          </label>
          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${SPECIES.length} monsters`}
            className="w-36 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-56"
          />
          <label className="sr-only" htmlFor="root">
            Root monster
          </label>
          <select
            id="root"
            value={rootId}
            onChange={(e) => setRootId(e.target.value)}
            className="max-w-48 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold"
          >
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="stage-field relative min-h-0 flex-1 overflow-hidden">
        <TreeViewport key={rootId}>
          <FamilyTree
            key={rootId}
            rootId={rootId}
            orient={orient}
            expandCommand={expandCommand}
          />
        </TreeViewport>
      </main>

      <footer className="border-t-[3px] border-chrome-hi bg-chrome px-3 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg border-2 border-gold bg-chrome-hi/50 px-3 py-1.5">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold text-gold">
            <li className="flex items-center gap-1.5">
              <span className="min-w-5 rounded bg-rank px-1 text-center text-[10px] font-black text-white ring-2 ring-white">
                F
              </span>
              Rank
            </li>
            <li className="flex items-center gap-1.5">
              <SynthIcon size="sm" />
              Synthesis Only
            </li>
            <li className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-md bg-line text-parchment ring-2 ring-white">
                +
              </span>
              Expand
            </li>
            <li className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-md bg-line text-parchment ring-2 ring-white">
                −
              </span>
              Minimize
            </li>
          </ul>
          <span className="hidden h-4 w-px bg-gold/40 sm:block" aria-hidden />
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {FAMILIES.map((f) => (
              <span key={f} className="inline-flex" title={familyLabel(f)}>
                <FamilyIcon family={f} size="sm" />
                <span className="sr-only">{familyLabel(f)}</span>
              </span>
            ))}
            <span className="text-sm font-bold text-gold">Family</span>
          </div>
          <span className="hidden h-4 w-px bg-gold/40 sm:block" aria-hidden />
          <a
            href={METALKID_REPO}
            className="font-display text-xs font-bold text-gold underline decoration-gold/50 underline-offset-2 hover:text-parchment"
          >
            Data from MetalKid Databases · DQM4
          </a>
        </div>
      </footer>
    </div>
  );
}
