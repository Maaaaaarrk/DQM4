import { useCallback, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toBlob } from "html-to-image";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { RankBadge } from "@/components/rank-badge";
import { SiteDisclaimer } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { FamilyTree, type ExpandCommand, type TreeOrient } from "@/components/family-tree";
import { ScoutIcon } from "@/components/scout-icon";
import { SynthIcon } from "@/components/synth-icon";
import { TreeViewport, type TreeViewportHandle } from "@/components/tree-viewport";
import { cn } from "@/lib/utils";
import {
  MONSTERS,
  monster,
  ROOT_OPTIONS,
  searchSpecies,
  SPECIES,
  type Family,
} from "@/lib/monsters";

export const Route = createFileRoute("/get")({
  validateSearch: (search: Record<string, unknown>) => {
    const monster = typeof search.monster === "string" ? search.monster : "";
    return monster ? { monster } : {};
  },
  component: GetGuide,
});

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
const PARCHMENT = "#f3e4b8";

function imageName(monsterName: string) {
  const safe = monsterName.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "");
  return `${safe || "dqm4"}-synthesis-tree.png`;
}

async function saveStageImage(stage: HTMLElement, monsterName: string) {
  const blob = await toBlob(stage, {
    backgroundColor: PARCHMENT,
    pixelRatio: 2,
    cacheBust: true,
    width: stage.clientWidth,
    height: stage.clientHeight,
  });
  if (!blob) throw new Error("Could not create the image");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = imageName(monsterName);
  link.click();
  URL.revokeObjectURL(url);
}

function GetGuide() {
  const { monster: requested } = Route.useSearch();
  const defaultRoot =
    requested && requested in MONSTERS ? requested : (ROOT_OPTIONS[0] ?? SPECIES[0].id);
  const [rootId, setRootId] = useState<string>(defaultRoot);
  const [query, setQuery] = useState("");
  const [orient, setOrient] = useState<TreeOrient>("horizontal");
  const [expandCommand, setExpandCommand] = useState<ExpandCommand>({
    action: "none",
    seq: 0,
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const viewportRef = useRef<TreeViewportHandle>(null);
  const stageRef = useRef<HTMLElement>(null);
  const recenterTree = useCallback((path?: string) => {
    viewportRef.current?.frame(path);
  }, []);
  const matches = useMemo(() => searchSpecies(query).slice(0, 80), [query]);
  const options = useMemo(() => {
    const list = query.trim()
      ? matches
      : [...ROOT_OPTIONS.map(monster), ...matches.filter((m) => !ROOT_OPTIONS.includes(m.id))];
    if (!list.some((m) => m.id === rootId)) return [monster(rootId), ...list];
    return list;
  }, [query, matches, rootId]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar relative flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
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
                orient === mode ? "bg-gold text-chrome" : "text-gold hover:bg-chrome-hi",
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
            onClick={() => setExpandCommand((c) => ({ action: "all", seq: c.seq + 1 }))}
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setExpandCommand((c) => ({ action: "scoutable", seq: c.seq + 1 }))}
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Expand to Scoutable
          </button>
          <button
            type="button"
            onClick={() => setExpandCommand((c) => ({ action: "none", seq: c.seq + 1 }))}
            className="rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi md:text-sm"
          >
            Minimize all
          </button>
        </div>
        <button
          type="button"
          disabled={saveState === "saving"}
          onClick={() => {
            const stage = stageRef.current;
            if (!stage) return;
            setSaveState("saving");
            void saveStageImage(stage, monster(rootId).name)
              .then(() => setSaveState("idle"))
              .catch(() => setSaveState("error"));
          }}
          className="shrink-0 whitespace-nowrap rounded-lg border-2 border-gold px-2.5 py-1 font-display text-xs font-extrabold tracking-wide text-gold hover:bg-chrome-hi disabled:opacity-60 md:text-sm"
        >
          {saveState === "saving"
            ? "Saving…"
            : saveState === "error"
              ? "Save failed"
              : "Save image"}
        </button>
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
                {m.name} · {m.synthOnly ? "Synthesis only" : "Scoutable"}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main ref={stageRef} className="stage-field relative min-h-0 flex-1 overflow-hidden">
        <TreeViewport key={rootId} ref={viewportRef}>
          <FamilyTree
            key={rootId}
            rootId={rootId}
            orient={orient}
            expandCommand={expandCommand}
            onStructureChange={recenterTree}
          />
        </TreeViewport>
      </main>

      <footer className="border-t-[3px] border-chrome-hi bg-chrome px-3 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg border-2 border-gold bg-chrome-hi/50 px-3 py-1.5">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold text-gold">
            <li className="flex items-center gap-1.5">
              <RankBadge rank="F" />
              Rank
            </li>
            <li className="flex items-center gap-1.5">
              <ScoutIcon size="sm" />
              Scoutable
            </li>
            <li className="flex items-center gap-1.5">
              <SynthIcon size="sm" />
              Synthesis only
            </li>
            <li className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-md bg-line text-parchment ring-2 ring-white">
                +
              </span>
              Expand
            </li>
            <li className="flex items-center gap-1.5">
              <span className="grid size-5 place-items-center rounded-md bg-focus text-parchment ring-2 ring-white">
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
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-bold text-gold">
            <li>Scroll to zoom</li>
            <li>Click and drag to move</li>
          </ul>
          <span className="hidden h-4 w-px bg-gold/40 sm:block" aria-hidden />
          <a
            href={METALKID_REPO}
            className="font-display text-xs font-bold text-gold underline decoration-gold/50 underline-offset-2 hover:text-parchment"
          >
            English names from MetalKid Databases
          </a>
          <span className="hidden h-4 w-px bg-gold/40 sm:block" aria-hidden />
          <span className="font-display text-xs font-extrabold tracking-[0.18em] text-gold">
            Scout. Synth. Repeat.
          </span>
        </div>
        <SiteDisclaimer />
      </footer>
    </div>
  );
}
