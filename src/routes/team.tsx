import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FamilyIcon } from "@/components/family-icon";
import { FamilyTree, type ExpandCommand, type TreeOrient } from "@/components/family-tree";
import { HaveFlag } from "@/components/have-flag";
import { MonsterSprite } from "@/components/monster-sprite";
import { RankBadge } from "@/components/rank-badge";
import { TreeViewport, type TreeViewportHandle } from "@/components/tree-viewport";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { mapForArea } from "@/lib/game-maps";
import { renderTeamImage } from "@/lib/team-image";
import { loadTeam, saveTeam } from "@/lib/team-store";
import {
  CAMPAIGN_AREAS,
  clearSlot,
  earliestScout,
  emptySlots,
  encodeLineup,
  monsterStatus,
  parseLineup,
  placeMonster,
  scoutTimeline,
  setSlotSize,
  SLOT_CONTINUE,
  slotFits,
  slotIsLarge,
  areaIndex,
  slotKey,
  slotMonsterId,
  spotLine,
  treeObtainable,
  type Bank,
  type Slots,
} from "@/lib/team";
import { monster, searchSpecies, type Monster } from "@/lib/monsters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/team")({
  validateSearch: (search: Record<string, unknown>) => ({
    main: typeof search.main === "string" ? search.main : "",
    reserve: typeof search.reserve === "string" ? search.reserve : "",
  }),
  component: TeamPlanner,
});

const NO_HAVE = new Set<string>();
const EMPTY_PICKS: Record<string, string> = {};

function TeamPlanner() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [progress, setProgress] = useState(0);
  const [trees, setTrees] = useState<Record<string, string[]>>({});
  const [picksBySlot, setPicksBySlot] = useState<Record<string, Record<string, string>>>({});
  const [main, setMain] = useState<Slots>(emptySlots);
  const [reserve, setReserve] = useState<Slots>(emptySlots);
  const [ready, setReady] = useState(false);
  const [focus, setFocus] = useState<{ bank: Bank; index: number } | null>(null);
  const [picking, setPicking] = useState<{ bank: Bank; index: number } | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [treeOrient, setTreeOrient] = useState<TreeOrient>("horizontal");
  const focusKey = focus ? slotKey(focus.bank, focus.index) : null;
  const focusPaths = useMemo(
    () => new Set(focusKey ? (trees[focusKey] ?? []) : []),
    [trees, focusKey],
  );

  useEffect(() => {
    let cancel = false;
    loadTeam()
      .then((saved) => {
        if (cancel) return;
        if (saved) {
          setProgress(Math.min(saved.progress, CAMPAIGN_AREAS.length - 1));
          setTrees(saved.trees);
          setPicksBySlot(saved.picks);
          if (!search.main && !search.reserve) {
            setMain(parseLineup(saved.main));
            setReserve(parseLineup(saved.reserve));
          }
        }
        if (search.main || search.reserve) {
          setMain(parseLineup(search.main));
          setReserve(parseLineup(search.reserve));
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      cancel = true;
    };
    // The shared lineup is read once. Later edits write the address themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveTeam({
      progress,
      have: [],
      trees,
      picks: picksBySlot,
      main: encodeLineup(main),
      reserve: encodeLineup(reserve),
    });
  }, [ready, progress, trees, picksBySlot, main, reserve]);

  useEffect(() => {
    if (!ready) return;
    const nextMain = encodeLineup(main);
    const nextReserve = encodeLineup(reserve);
    if (nextMain === search.main && nextReserve === search.reserve) return;
    void navigate({ search: { main: nextMain, reserve: nextReserve }, replace: true });
  }, [ready, main, reserve, navigate, search.main, search.reserve]);

  function toggleHave(key: string, path: string) {
    setTrees((current) => {
      const list = current[key] ?? [];
      const nextList = list.includes(path) ? list.filter((item) => item !== path) : [...list, path];
      const next = { ...current };
      if (nextList.length) next[key] = nextList;
      else delete next[key];
      return next;
    });
  }

  function resize(bank: Bank, index: number, large: boolean) {
    const slots = bank === "main" ? main : reserve;
    const next = setSlotSize(slots, index, large);
    if (!next || next === slots) return;
    if (bank === "main") setMain(next);
    else setReserve(next);
  }

  function addMonster(id: string) {
    if (!picking) return;
    const bank = picking.bank === "main" ? main : reserve;
    const next = placeMonster(bank, picking.index, id);
    if (!next) return;
    if (picking.bank === "main") setMain(next);
    else setReserve(next);
    setFocus({ bank: picking.bank, index: picking.index });
    setPicking(null);
    setQuery("");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function saveImage() {
    const blob = await renderTeamImage(main, reserve);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthline-team.png";
    link.click();
    URL.revokeObjectURL(url);
  }

  const timelineMembers = useMemo(() => {
    const list: { id: string; owned: string[]; picks: Record<string, string> }[] = [];
    for (const bank of ["main", "reserve"] as const) {
      const slots = bank === "main" ? main : reserve;
      for (let index = 0; index < 4; index += 1) {
        const id = slotMonsterId(slots, index);
        if (!id) continue;
        list.push({
          id,
          owned: trees[slotKey(bank, index)] ?? [],
          picks: picksBySlot[slotKey(bank, index)] ?? {},
        });
      }
    }
    return list;
  }, [main, reserve, trees, picksBySlot]);

  const focusedSlots = focus ? (focus.bank === "main" ? main : reserve) : null;
  const focusedId = focusedSlots ? slotMonsterId(focusedSlots, focus!.index) : null;
  const focused = focusedId ? monster(focusedId) : null;

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-lg border-2 border-gold px-3 py-1 font-display text-sm font-extrabold text-gold"
          >
            {copied ? "Copied" : "Copy lineup link"}
          </button>
          <button
            type="button"
            onClick={() => void saveImage()}
            className="rounded-lg border-2 border-gold bg-gold px-3 py-1 font-display text-sm font-extrabold text-chrome"
          >
            Save team image
          </button>
        </div>
      </header>
      <main className="stage-field min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <section className="rounded-2xl border-2 border-gold/30 bg-parchment-deep/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xs font-extrabold tracking-widest text-chrome">
                Furthest area reached
              </h2>
              <Link
                to="/maps"
                search={{ map: "" }}
                className="rounded-lg border-2 border-gold bg-chrome px-3 py-1 font-display text-sm font-extrabold text-gold"
              >
                Maps
              </Link>
              <button
                type="button"
                aria-expanded={timelineOpen}
                onClick={() => setTimelineOpen((open) => !open)}
                className={cn(
                  "rounded-lg border-2 border-gold px-3 py-1 font-display text-sm font-extrabold",
                  timelineOpen ? "bg-gold text-chrome" : "bg-chrome text-gold",
                )}
              >
                Scout timeline
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAMPAIGN_AREAS.map((area, index) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setProgress(index)}
                  className={cn(
                    "rounded-lg border-2 px-2.5 py-1 font-display text-xs font-extrabold",
                    index <= progress
                      ? "border-gold bg-chrome text-gold"
                      : "border-chrome/20 bg-transparent text-muted",
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </section>

          {timelineOpen ? (
            <ScoutTimelinePanel members={timelineMembers} progress={progress} />
          ) : null}

          {(["main", "reserve"] as const).map((bank) => (
            <PartyBank
              key={bank}
              bank={bank}
              slots={bank === "main" ? main : reserve}
              progress={progress}
              trees={trees}
              focus={focus}
              onFocus={(index) => {
                if (focus?.bank === bank && focus.index === index) {
                  setFocus(null);
                  return;
                }
                setFocus({ bank, index });
                setPicking(null);
              }}
              onEmpty={(index) => {
                setPicking({ bank, index });
                setFocus(null);
              }}
              onSize={(index, large) => resize(bank, index, large)}
            />
          ))}

          {picking ? (
            <Picker
              slots={picking.bank === "main" ? main : reserve}
              index={picking.index}
              query={query}
              onQuery={setQuery}
              progress={progress}
              onPick={addMonster}
            />
          ) : null}

          {focused && focus && focusKey ? (
            <Plan
              id={focused.id}
              treeKey={focusKey}
              progress={progress}
              large={slotIsLarge(focus.bank === "main" ? main : reserve, focus.index)}
              canGrow={
                focus.index < 3 && !(focus.bank === "main" ? main : reserve)[focus.index + 1]
              }
              paths={focusPaths}
              picks={picksBySlot[focusKey] ?? EMPTY_PICKS}
              onPicksChange={(next) =>
                setPicksBySlot((current) => {
                  const copy = { ...current };
                  if (Object.keys(next).length) copy[focusKey] = next;
                  else delete copy[focusKey];
                  return copy;
                })
              }
              orient={treeOrient}
              onOrient={setTreeOrient}
              onHave={(path) => toggleHave(focusKey, path)}
              onSize={(large) => resize(focus.bank, focus.index, large)}
              onHide={() => setFocus(null)}
              onRemove={() => {
                const bank = focus.bank;
                const index = focus.index;
                const clear = (slots: Slots) => clearSlot(slots, index);
                if (bank === "main") setMain(clear);
                else setReserve(clear);
                setTrees((current) => {
                  if (!current[focusKey]) return current;
                  const next = { ...current };
                  delete next[focusKey];
                  return next;
                });
                setPicksBySlot((current) => {
                  if (!current[focusKey]) return current;
                  const next = { ...current };
                  delete next[focusKey];
                  return next;
                });
                setFocus(null);
              }}
            />
          ) : picking ? null : (
            <p className="text-sm font-bold text-chrome">
              Add a monster, then set Large or Small. A seed changes its size, and Large takes two slots. Select one to open its synthesis tree.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PartyBank({
  bank,
  slots,
  progress,
  trees,
  focus,
  onFocus,
  onEmpty,
  onSize,
}: {
  bank: Bank;
  slots: Slots;
  progress: number;
  trees: Record<string, string[]>;
  focus: { bank: Bank; index: number } | null;
  onFocus: (index: number) => void;
  onEmpty: (index: number) => void;
  onSize: (index: number, large: boolean) => void;
}) {
  const cells = [];
  let index = 0;
  while (index < 4) {
    const slotIndex = index;
    if (slots[slotIndex] === SLOT_CONTINUE) {
      index += 1;
      continue;
    }
    const id = slotMonsterId(slots, slotIndex);
    const large = slotIsLarge(slots, slotIndex);
    if (!id) {
      cells.push(
        <button
          key={`${bank}-empty-${slotIndex}`}
          type="button"
          onClick={() => onEmpty(slotIndex)}
          className="grid min-h-16 place-items-center rounded-2xl border-2 border-dashed border-chrome/30 text-xs font-bold text-muted"
        >
          Add monster
        </button>,
      );
      index += 1;
      continue;
    }
    const m = monster(id);
    const owned = new Set(trees[slotKey(bank, slotIndex)] ?? []);
    const status = owned.has(id)
      ? { line: "Have it" }
      : monsterStatus(id, { progress, have: NO_HAVE });
    const canGrow = large || (slotIndex < 3 && !slots[slotIndex + 1]);
    cells.push(
      <div
        key={`${bank}-${slotIndex}`}
        className={cn(
          "flex items-center gap-2 rounded-2xl border-2 bg-chrome px-2 py-2 text-gold",
          large && "col-span-2",
          focus?.bank === bank && focus.index === slotIndex ? "border-gold" : "border-gold/40",
        )}
      >
        <button type="button" onClick={() => onFocus(slotIndex)} className="shrink-0">
          <Portrait id={m.id} family={m.family} />
        </button>
        <span className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onFocus(slotIndex)}
            className="block w-full truncate text-left font-display text-sm font-extrabold"
          >
            {m.name}
          </button>
          <span className="mt-1 flex flex-wrap items-center gap-1">
            <RankBadge rank={m.rank} />
            <FamilyIcon family={m.family} size="sm" />
            <SizeButton large={large} disabled={!canGrow} onClick={() => onSize(slotIndex, !large)} />
          </span>
          <button
            type="button"
            onClick={() => onFocus(slotIndex)}
            className="mt-1 line-clamp-2 w-full text-left text-[11px] font-bold text-parchment"
          >
            {status.line}
          </button>
        </span>
      </div>,
    );
    index += large ? 2 : 1;
  }

  return (
    <section className="rounded-2xl border-2 border-gold/30 bg-parchment-deep/40 p-3">
      <h2 className="font-display text-xs font-extrabold tracking-widest text-chrome">
        {bank === "main" ? "Main party" : "Reserve"} · 4 slots
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{cells}</div>
    </section>
  );
}

function SizeButton({
  large,
  disabled,
  onClick,
}: {
  large: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={large}
      disabled={disabled}
      title={disabled ? "The next slot is filled" : "A seed changes this size"}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md px-1.5 py-1 font-display text-[10px] font-extrabold",
        large ? "bg-gold text-chrome" : "bg-parchment text-chrome",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {large ? "Large" : "Small"}
    </button>
  );
}

function Picker({
  slots,
  index,
  query,
  onQuery,
  progress,
  onPick,
}: {
  slots: Slots;
  index: number;
  query: string;
  onQuery: (value: string) => void;
  progress: number;
  onPick: (id: string) => void;
}) {
  const roomy = slotFits(slots, index, true);
  const choices = searchSpecies(query)
    .filter(() => slotFits(slots, index, false))
    .slice(0, 40);
  return (
    <section className="rounded-2xl border-2 border-gold bg-chrome p-4 text-gold">
      <label className="block font-display text-sm font-extrabold" htmlFor="team-pick">
        Add to this slot
      </label>
      <input
        id="team-pick"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search monsters"
        className="mt-2 w-full rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50"
      />
      <ul className="gold-scroll mt-3 grid max-h-80 gap-2 overflow-y-auto">
        {choices.map((candidate) => (
          <li key={candidate.id}>
            <button
              type="button"
              onClick={() => onPick(candidate.id)}
              className="flex w-full items-center gap-2 rounded-xl border-2 border-gold/40 px-2 py-2 text-left"
            >
              <Portrait id={candidate.id} family={candidate.family} />
              <span className="min-w-0">
                <span className="block truncate font-display font-extrabold">{candidate.name}</span>
                <span className="text-xs font-bold text-parchment">
                  {monsterStatus(candidate.id, { progress, have: NO_HAVE }).line}
                </span>
              </span>
              {candidate.large && roomy ? (
                <span className="ml-auto rounded bg-gold px-1 py-0.5 font-display text-[10px] font-extrabold text-chrome">
                  Large
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Plan({
  id,
  treeKey,
  progress,
  large,
  canGrow,
  paths,
  picks,
  onPicksChange,
  orient,
  onOrient,
  onHave,
  onSize,
  onHide,
  onRemove,
}: {
  id: string;
  treeKey: string;
  progress: number;
  large: boolean;
  canGrow: boolean;
  paths: ReadonlySet<string>;
  picks: Record<string, string>;
  onPicksChange: (picks: Record<string, string>) => void;
  orient: TreeOrient;
  onOrient: (orient: TreeOrient) => void;
  onHave: (path: string) => void;
  onSize: (large: boolean) => void;
  onHide: () => void;
  onRemove: () => void;
}) {
  const m = monster(id);
  const status = paths.has(id)
    ? { line: "Have it" }
    : monsterStatus(id, { progress, have: NO_HAVE });
  const spot = earliestScout(m);
  const boss = m.habitats.some((habitat) => habitat.boss) && !spot;
  const viewportRef = useRef<TreeViewportHandle>(null);
  const [expandMode, setExpandMode] = useState<"all" | "now" | "scouts">("now");
  const [expandCommand, setExpandCommand] = useState<ExpandCommand>({
    action: "now",
    seq: 1,
    progress,
  });
  const progressWatch = useRef(progress);
  useEffect(() => {
    if (expandMode !== "now" || progressWatch.current === progress) {
      progressWatch.current = progress;
      return;
    }
    progressWatch.current = progress;
    setExpandCommand((current) => ({ action: "now", seq: current.seq + 1, progress }));
  }, [progress, expandMode]);
  const detailFor = (monsterId: string, path: string) => {
    if (paths.has(path)) return "Have it";
    if (!monsterId) return undefined;
    return monsterStatus(monsterId, { progress, have: NO_HAVE }).line;
  };

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-gold bg-chrome text-gold">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Portrait id={m.id} family={m.family} />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold">{m.name}</h2>
          <p className="mt-1 text-sm font-bold text-gold">
            {boss ? "Zone boss. Not a scout target." : spot ? spotLine(spot) : status.line}
          </p>
        </div>
        <SizeButton large={large} disabled={!large && !canGrow} onClick={() => onSize(!large)} />
        <div className="ml-auto flex flex-col gap-2 text-gold">
          <HaveFlag checked={paths.has(id)} onChange={() => onHave(id)} label="Have it" />
          <HaveFlag checked={treeObtainable(id, id, paths, progress)} label="Can get it now" />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border-2 border-gold px-3 py-1 font-display text-sm font-extrabold text-gold"
        >
          Remove from party
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-gold px-4 py-2">
        <button
          type="button"
          onClick={onHide}
          className="rounded-lg border-2 border-gold px-3 py-1 font-display text-sm font-extrabold text-gold"
        >
          Hide
        </button>
        <div role="group" aria-label="Expand tree" className="flex flex-wrap rounded-lg border-2 border-gold p-0.5">
          {(
            [
              ["all", "Expand all", "Open every synthesis"],
              ["now", "Scoutable now", "Stop at monsters you can scout in the areas you have reached"],
              ["scouts", "Scoutable all", "Stop at every scout, including zones you have not reached"],
            ] as const
          ).map(([mode, label, hint]) => (
            <button
              key={mode}
              type="button"
              title={hint}
              aria-pressed={expandMode === mode}
              onClick={() => {
                setExpandMode(mode);
                setExpandCommand((current) => ({ action: mode, seq: current.seq + 1, progress }));
              }}
              className={cn(
                "rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide",
                expandMode === mode ? "bg-gold text-chrome" : "text-gold hover:bg-chrome-hi",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Tree layout" className="ml-auto flex rounded-lg border-2 border-gold p-0.5">
          {(["horizontal", "vertical"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={orient === mode}
              onClick={() => onOrient(mode)}
              className={cn(
                "rounded-md px-2.5 py-1 font-display text-xs font-extrabold tracking-wide",
                orient === mode ? "bg-gold text-chrome" : "text-gold hover:bg-chrome-hi",
              )}
            >
              {mode === "horizontal" ? "Horizontal" : "Vertical"}
            </button>
          ))}
        </div>
      </div>
      <div className="stage-field relative h-[28rem]">
        <TreeViewport ref={viewportRef} key={treeKey}>
          <FamilyTree
            key={treeKey}
            rootId={id}
            orient={orient}
            startExpanded
            gateRoot
            expandCommand={expandCommand}
            owned={paths}
            picks={picks}
            onPicksChange={onPicksChange}
            onHave={onHave}
            detailFor={detailFor}
            onStructureChange={() => viewportRef.current?.frame()}
          />
        </TreeViewport>
      </div>
    </section>
  );
}

function AreaRoute({
  progress,
  active,
}: {
  progress: number;
  active: ReadonlySet<string>;
}) {
  return (
    <ol className="mt-4 grid gap-2 sm:grid-cols-5" aria-label="Areas in the order you reach them">
      {CAMPAIGN_AREAS.map((area, index) => {
        const reached = index <= progress;
        const hasScouts = active.has(area);
        return (
          <li key={area}>
            <button
              type="button"
              disabled={!hasScouts}
              onClick={() =>
                document.getElementById(`timeline-zone-${area}`)?.scrollIntoView({ block: "nearest" })
              }
              className={cn(
                "flex h-full w-full flex-col rounded-xl border-2 px-2 py-2 text-left",
                reached ? "border-gold bg-chrome text-gold" : "border-gold/40 bg-chrome text-parchment",
                !hasScouts && "opacity-80",
              )}
            >
              <span className="font-display text-[10px] font-extrabold tracking-widest">{index + 1}</span>
              <span className="font-display text-xs font-extrabold leading-tight">{area}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ScoutTimelinePanel({
  members,
  progress,
}: {
  members: { id: string; owned: string[]; picks?: Record<string, string> }[];
  progress: number;
}) {
  const timeline = useMemo(() => scoutTimeline(members), [members]);
  return (
    <section className="rounded-2xl border-2 border-gold bg-chrome p-4 text-gold">
      <h2 className="font-display text-lg font-extrabold">Scout timeline</h2>
      <p className="mt-1 text-sm font-bold text-parchment">
        Earliest area first.
      </p>
      {members.length === 0 ? (
        <p className="mt-4 text-sm font-bold">Add monsters to the party to build the timeline.</p>
      ) : timeline.zones.length === 0 && timeline.blocked.length === 0 ? (
        <p className="mt-4 text-sm font-bold">Nothing left to scout. The party is already marked Have it.</p>
      ) : (
        <>
        <AreaRoute progress={progress} active={new Set(timeline.zones.map((zone) => zone.area))} />
        <ol className="relative mt-4 grid gap-6 border-l-4 border-gold/40 pl-5">
          {timeline.zones.map((zone, zoneIndex) => {
            const open = areaIndex(zone.area);
            const reached = open < CAMPAIGN_AREAS.length && open <= progress;
            const mapId = mapForArea(zone.area);
            return (
              <li
                key={zone.area}
                id={`timeline-zone-${zone.area}`}
                className="relative"
              >
                <span
                  className={cn(
                    "absolute -left-[27px] top-1 size-3 rounded-full ring-2 ring-chrome",
                    reached ? "bg-gold" : "bg-chrome-hi",
                  )}
                  aria-hidden
                />
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-display text-base font-extrabold">
                    {zoneIndex + 1}. {zone.area}
                  </h3>
                  {mapId ? (
                    <Link
                      to="/maps"
                      search={{ map: mapId }}
                      className="rounded-md border-2 border-gold px-2 py-0.5 font-display text-xs font-extrabold text-gold"
                    >
                      Map
                    </Link>
                  ) : null}
                  <span className="text-xs font-bold text-parchment">
                    {reached ? "Open" : "Later"}
                  </span>
                </div>
                <ul className="mt-2 grid gap-2">
                  {zone.scouts.map((scout) => {
                    const row = monster(scout.id);
                    return (
                      <li key={scout.id}>
                        <div className="flex items-center gap-2 rounded-xl border-2 border-gold/40 bg-chrome-hi/40 px-2 py-2">
                          <Portrait id={row.id} family={row.family} />
                          <span className="min-w-0">
                            <span className="block truncate font-display font-extrabold">{row.name}</span>
                            <span className="mt-1 flex items-center gap-1">
                              <RankBadge rank={row.rank} />
                              <FamilyIcon family={row.family} size="sm" />
                            </span>
                            {scout.lines.map((line) => (
                              <span key={line} className="mt-1 block text-xs font-bold text-parchment">
                                {line}
                              </span>
                            ))}
                            {scout.targets.length ? (
                              <span className="mt-1 block text-xs font-bold text-gold">
                                For {scout.targets.join(", ")}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
        </>
      )}
      {timeline.blocked.length ? (
        <div className="mt-4 border-t-2 border-gold/30 pt-3">
          <h3 className="font-display text-sm font-extrabold">No scout</h3>
          <ul className="mt-2 grid gap-1">
            {timeline.blocked.map((block) => (
              <li key={block.id} className="text-sm font-bold text-parchment">
                {monster(block.id).name}. {block.line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Portrait({ id, family, size = 56 }: { id: string; family: Monster["family"]; size?: number }) {
  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-parchment ring-[3px] ring-white shadow-[0_0_0_2px_var(--color-gold-ring)]">
      <MonsterSprite id={id} family={family} size={size} alt="" />
    </span>
  );
}
