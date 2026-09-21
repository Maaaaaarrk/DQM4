import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TreeViewport, type TreeViewportHandle } from "@/components/tree-viewport";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { MonsterSprite } from "@/components/monster-sprite";
import { SynthIcon } from "@/components/synth-icon";
import { cn } from "@/lib/utils";
import {
  buildsFrom,
  familyMembers,
  hasParents,
  MONSTERS,
  monster,
  parentKey,
  ROOT_OPTIONS,
  searchSpecies,
  SPECIES,
  type BuildOption,
  type ParentRef,
} from "@/lib/monsters";

export const Route = createFileRoute("/build")({
  validateSearch: (search: Record<string, unknown>) => {
    const monster = typeof search.monster === "string" ? search.monster : "";
    return monster ? { monster } : {};
  },
  component: BuildGuide,
});

function partnerLabel(partner: ParentRef): string {
  if (partner.type === "species") return monster(partner.id).name;
  const rank = partner.rank === "Any" ? "Any rank" : `${partner.rank} rank`;
  return `${rank} ${familyLabel(partner.family)}`;
}

type ClimbStep = {
  id: string;
  partner: ParentRef | null;
  /** Species chosen for family-wildcard partners, keyed by pedigree path. */
  picks: Record<string, string>;
  /** Expanded pedigree paths under the other parent. */
  open: string[];
};

function BuildGuide() {
  const { monster: requested } = Route.useSearch();
  const firstMonster = "slime" in MONSTERS ? "slime" : (ROOT_OPTIONS[0] ?? SPECIES[0].id);
  const initial = requested && requested in MONSTERS ? requested : firstMonster;
  const [lockedId, setLockedId] = useState(initial);
  const [path, setPath] = useState<ClimbStep[]>([
    { id: initial, partner: null, picks: {}, open: [] },
  ]);
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const matches = useMemo(() => {
    return searchSpecies(query)
      .filter((m) => !verifiedOnly || m.verified)
      .slice(0, 80);
  }, [query, verifiedOnly]);
  const options = useMemo(() => {
    const list = query.trim() ? matches : matches;
    const filtered = verifiedOnly ? list.filter((m) => m.verified || m.id === lockedId) : list;
    if (!filtered.some((m) => m.id === lockedId)) return [monster(lockedId), ...filtered];
    return filtered;
  }, [matches, lockedId, verifiedOnly]);

  const tip = path[path.length - 1] ?? { id: lockedId, partner: null };
  const choices = useMemo(() => buildsFrom(tip.id), [tip.id]);
  const used = useMemo(() => new Set(path.map((step) => step.id)), [path]);

  function lockStart(id: string) {
    setLockedId(id);
    setPath([{ id, partner: null, picks: {}, open: [] }]);
  }

  function climb(option: BuildOption) {
    setPath((prev) => [
      ...prev,
      { id: option.resultId, partner: option.partner, picks: {}, open: [] },
    ]);
  }

  function togglePartner(stepIndex: number, key: string) {
    setPath((prev) =>
      prev.map((step, index) => {
        if (index !== stepIndex) return step;
        const open = new Set(step.open);
        if (open.has(key)) {
          for (const item of open) {
            if (item === key || item.startsWith(`${key}/`)) open.delete(item);
          }
        } else {
          open.add(key);
        }
        return { ...step, open: [...open] };
      }),
    );
  }

  function pickPartner(stepIndex: number, key: string, speciesId: string) {
    setPath((prev) =>
      prev.map((step, index) => {
        if (index !== stepIndex) return step;
        const picks = { ...step.picks };
        if (speciesId) picks[key] = speciesId;
        else delete picks[key];
        return {
          ...step,
          picks,
          open: step.open.filter((item) => item !== key && !item.startsWith(`${key}/`)),
        };
      }),
    );
  }

  function unpick() {
    setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  const viewportRef = useRef<TreeViewportHandle>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => viewportRef.current?.frame("tip"));
    return () => cancelAnimationFrame(id);
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <label className="sr-only" htmlFor="build-search">
            Search monsters
          </label>
          <input
            id="build-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lock a monster you have"
            className="w-40 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-64"
          />
          <button
            type="button"
            aria-pressed={verifiedOnly}
            onClick={() => setVerifiedOnly((on) => !on)}
            className={cn(
              "shrink-0 rounded-lg border-2 border-gold px-2 py-1 font-display text-xs font-extrabold",
              verifiedOnly ? "bg-gold text-chrome" : "text-gold hover:bg-chrome-hi",
            )}
          >
            Verified
          </button>
          <label className="sr-only" htmlFor="build-root">
            Locked monster
          </label>
          <select
            id="build-root"
            value={lockedId}
            onChange={(e) => lockStart(e.target.value)}
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
        <TreeViewport ref={viewportRef}>
          <ClimbCanvas
            path={path}
            choices={choices}
            used={used}
            onPick={climb}
            onUnpick={unpick}
            onRewind={(index) => setPath((prev) => prev.slice(0, index + 1))}
            onTogglePartner={togglePartner}
            onPickPartner={pickPartner}
          />
        </TreeViewport>
      </main>
      <footer className="border-t-[3px] border-chrome-hi bg-chrome px-3 py-2">
        <p className="text-center font-display text-xs font-extrabold tracking-[0.18em] text-gold">
          Scout. Synth. Repeat.
        </p>
      </footer>
    </div>
  );
}

const CARD_W = 260;
const CARD_H = 112;
const H_GAP = 36;
const V_GAP = 64;
const PAD = 36;

type Box = { x: number; y: number };

type PedNode = {
  key: string;
  x: number;
  y: number;
  ref: ParentRef;
  speciesId: string | null;
  expandable: boolean;
  expanded: boolean;
};

type Pedigree = {
  nodes: PedNode[];
  wires: string[];
  h: number;
  maxX: number;
  maxY: number;
};

function layoutPedigree(
  ref: ParentRef,
  picks: Record<string, string>,
  open: Set<string>,
  key: string,
  x: number,
  y: number,
  ancestors: Set<string>,
): Pedigree {
  const speciesId = ref.type === "species" ? ref.id : picks[key] || null;
  const looping = speciesId !== null && ancestors.has(speciesId);
  const expandable = speciesId !== null && !looping && hasParents(speciesId);
  const expanded = expandable && open.has(key);
  const node: PedNode = { key, x, y, ref, speciesId, expandable, expanded };
  const nodes = [node];
  const wires: string[] = [];
  let h = CARD_H;
  let maxX = x + CARD_W;
  let maxY = y + CARD_H;
  const parents = speciesId ? monster(speciesId).parents : [];
  if (expanded && speciesId && parents.length === 2) {
    const [left, right] = parents;
    const next = new Set(ancestors);
    next.add(speciesId);
    const childX = x + CARD_W + H_GAP;
    const above = layoutPedigree(left, picks, open, `${key}/0`, childX, y, next);
    const below = layoutPedigree(
      right,
      picks,
      open,
      `${key}/1`,
      childX,
      y + above.h + 20,
      next,
    );
    nodes.push(...above.nodes, ...below.nodes);
    wires.push(...above.wires, ...below.wires);
    const y0 = y + CARD_H / 2;
    const y1 = above.nodes[0]!.y + CARD_H / 2;
    const y2 = below.nodes[0]!.y + CARD_H / 2;
    const rail = x + CARD_W + 18;
    wires.push(
      `M ${x + CARD_W} ${y0} H ${rail} M ${rail} ${Math.min(y1, y2)} V ${Math.max(y1, y2)} M ${rail} ${y1} H ${above.nodes[0]!.x} M ${rail} ${y2} H ${below.nodes[0]!.x}`,
    );
    h = Math.max(CARD_H, below.nodes[0]!.y + below.h - y);
    maxX = Math.max(maxX, above.maxX, below.maxX);
    maxY = Math.max(maxY, above.maxY, below.maxY);
  }
  return { nodes, wires, h, maxX, maxY };
}

function layoutClimb(path: ClimbStep[], choiceCount: number) {
  const rowW = choiceCount > 0 ? choiceCount * CARD_W + (choiceCount - 1) * H_GAP : CARD_W;
  const tipX = PAD + Math.max(0, (rowW - CARD_W) / 2);
  const choiceY = PAD;
  let y = choiceCount > 0 ? choiceY + CARD_H + V_GAP : PAD;
  const steps: Box[] = new Array(path.length);
  const partners: (Pedigree | null)[] = new Array(path.length);
  for (let index = path.length - 1; index >= 0; index--) {
    const step = path[index]!;
    const box = { x: tipX, y };
    steps[index] = box;
    const ped = step.partner
      ? layoutPedigree(
          step.partner,
          step.picks,
          new Set(step.open),
          "p",
          box.x + CARD_W + H_GAP,
          box.y,
          new Set(step.id ? [step.id] : []),
        )
      : null;
    partners[index] = ped;
    y += Math.max(CARD_H, ped?.h ?? 0) + V_GAP;
  }
  const choices: Box[] = Array.from({ length: choiceCount }, (_, i) => ({
    x: PAD + i * (CARD_W + H_GAP),
    y: choiceY,
  }));
  let width = PAD + rowW + PAD;
  let height = y - V_GAP + PAD;
  for (const ped of partners) {
    if (!ped) continue;
    width = Math.max(width, ped.maxX + PAD);
    height = Math.max(height, ped.maxY + PAD);
  }
  return { choices, steps, partners, width, height, choiceY };
}

function ClimbCanvas({
  path,
  choices,
  used,
  onPick,
  onUnpick,
  onRewind,
  onTogglePartner,
  onPickPartner,
}: {
  path: ClimbStep[];
  choices: BuildOption[];
  used: Set<string>;
  onPick: (option: BuildOption) => void;
  onUnpick: () => void;
  onRewind: (index: number) => void;
  onTogglePartner: (stepIndex: number, key: string) => void;
  onPickPartner: (stepIndex: number, key: string, speciesId: string) => void;
}) {
  const layout = layoutClimb(path, choices.length);
  const tip = layout.steps[path.length - 1];
  const railY =
    choices.length > 0 ? layout.choiceY + CARD_H + (tip ? (tip.y - (layout.choiceY + CARD_H)) / 2 : V_GAP / 2) : 0;
  const center = (box: Box) => box.x + CARD_W / 2;

  return (
    <div className="relative" style={{ width: layout.width, height: layout.height }}>
      <svg
        className="pointer-events-none absolute inset-0"
        width={layout.width}
        height={layout.height}
        aria-hidden
      >
        {layout.partners.map((ped, index) => {
          const step = layout.steps[index];
          const root = ped?.nodes[0];
          if (!ped || !step || !root) return null;
          const mid = step.y + CARD_H / 2;
          return (
            <g key={`partner-${index}`} fill="none" stroke="var(--color-line)" strokeWidth="6" strokeLinecap="round">
              <path d={`M ${step.x + CARD_W} ${mid} H ${root.x}`} />
              {ped.wires.map((d, wire) => (
                <path key={wire} d={d} />
              ))}
            </g>
          );
        })}
        {path.slice(0, -1).map((step, index) => {
          const lower = layout.steps[index];
          const upper = layout.steps[index + 1];
          if (!lower || !upper) return null;
          const x = center(lower);
          return (
            <path
              key={`${step.id}-${index}`}
              d={`M ${x} ${upper.y + CARD_H} V ${lower.y}`}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          );
        })}
        {choices.length > 0 && tip ? (
          <g fill="none" stroke="var(--color-line)" strokeWidth="4" strokeLinecap="round">
            <path
              d={`M ${center(tip)} ${tip.y} V ${railY}`}
              strokeDasharray="2 8"
            />
            {choices.length > 1 ? (
              <path
                d={`M ${center(layout.choices[0]!)} ${railY} H ${center(layout.choices[choices.length - 1]!)}`}
                strokeDasharray="2 8"
              />
            ) : null}
            {layout.choices.map((box, index) => (
              <path
                key={index}
                d={`M ${center(box)} ${box.y + CARD_H} V ${railY}`}
                strokeDasharray="2 8"
              />
            ))}
          </g>
        ) : null}
      </svg>

      {choices.map((option, index) => {
        const box = layout.choices[index];
        if (!box) return null;
        return (
          <ChoiceCard
            key={`${option.resultId}:${parentKey(option.partner)}`}
            option={option}
            box={box}
            disabled={used.has(option.resultId)}
            onPick={() => onPick(option)}
          />
        );
      })}

      {path.map((step, index) => {
        const box = layout.steps[index];
        if (!box) return null;
        return (
          <ClimbTile
            key={`${step.id}-${index}`}
            step={step}
            box={box}
            isStart={index === 0}
            isTip={index === path.length - 1}
            onUnpick={onUnpick}
            onRewind={() => onRewind(index)}
          />
        );
      })}

      {layout.partners.map((ped, stepIndex) =>
        ped?.nodes.map((node) => (
          <PartnerCard
            key={`${stepIndex}-${node.key}`}
            node={node}
            onToggle={() => onTogglePartner(stepIndex, node.key)}
            onPick={(speciesId) => onPickPartner(stepIndex, node.key, speciesId)}
          />
        )),
      )}
    </div>
  );
}

function ChoiceCard({
  option,
  box,
  disabled,
  onPick,
}: {
  option: BuildOption;
  box: Box;
  disabled: boolean;
  onPick: () => void;
}) {
  const result = monster(option.resultId);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className="absolute flex items-center gap-2 overflow-hidden rounded-2xl border-2 border-gold bg-chrome px-2.5 py-2 text-left text-gold enabled:hover:bg-chrome-hi disabled:opacity-50"
      style={{ left: box.x, top: box.y, width: CARD_W, height: CARD_H }}
    >
      <MonsterSprite id={result.id} family={result.family} size={44} alt="" />
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-extrabold leading-tight">
          {result.name}
        </span>
        <span className="mt-1 flex items-center gap-1">
          <span className="rounded bg-rank px-1 text-[10px] font-black text-white">{result.rank}</span>
          <FamilyIcon family={result.family} size="sm" />
          {result.synthOnly ? <SynthIcon size="sm" /> : null}
        </span>
        <span className="mt-1 block truncate text-xs font-bold text-parchment">
          {disabled ? "Already in this line" : `Needs ${partnerLabel(option.partner)}`}
        </span>
      </span>
    </button>
  );
}

function ClimbTile({
  step,
  box,
  isStart,
  isTip,
  onUnpick,
  onRewind,
}: {
  step: ClimbStep;
  box: Box;
  isStart: boolean;
  isTip: boolean;
  onUnpick: () => void;
  onRewind: () => void;
}) {
  const current = monster(step.id);
  return (
    <div
      data-path={isTip ? "tip" : undefined}
      className={cn(
        "absolute flex items-center gap-2 overflow-hidden rounded-[18px] px-2.5 py-2 ring-2",
        isStart
          ? "bg-gold text-chrome ring-gold-ring"
          : isTip
            ? "bg-focus text-focus-fg ring-focus-edge"
            : "bg-parent text-parent-fg ring-parent-edge",
      )}
      style={{ left: box.x, top: box.y, width: CARD_W, height: CARD_H }}
    >
      <MonsterSprite id={current.id} family={current.family} size={52} alt="" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg font-extrabold leading-none">
          {current.name}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-xs font-bold">
          <span className="rounded bg-rank px-1 text-white">{current.rank}</span>
          <FamilyIcon family={current.family} size="sm" />
          {current.synthOnly ? <SynthIcon size="sm" /> : null}
        </span>
      </span>
      {isTip && !isStart ? (
        <button
          type="button"
          onClick={onUnpick}
          className="shrink-0 rounded-lg bg-chrome px-2 py-1 font-display text-xs font-extrabold text-gold hover:bg-chrome-hi"
        >
          Unpick
        </button>
      ) : null}
      {!isTip && !isStart ? (
        <button
          type="button"
          onClick={onRewind}
          className="shrink-0 rounded-lg bg-chrome/80 px-2 py-1 font-display text-xs font-extrabold text-chrome hover:bg-parchment"
        >
          Back
        </button>
      ) : null}
    </div>
  );
}

function PartnerCard({
  node,
  onToggle,
  onPick,
}: {
  node: PedNode;
  onToggle: () => void;
  onPick: (speciesId: string) => void;
}) {
  const species = node.speciesId ? monster(node.speciesId) : null;
  const members = node.ref.type === "family" ? familyMembers(node.ref.family, node.ref.rank) : [];
  return (
    <div
      className="absolute flex items-center gap-2 overflow-hidden rounded-[18px] bg-parent px-2.5 py-2 text-parent-fg ring-2 ring-parent-edge"
      style={{ left: node.x, top: node.y, width: CARD_W, height: CARD_H }}
    >
      {species ? (
        <MonsterSprite id={species.id} family={species.family} size={48} alt="" />
      ) : node.ref.type === "family" ? (
        <FamilyIcon family={node.ref.family} size="lg" />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-extrabold leading-none">
          {species ? species.name : node.ref.type === "family" ? partnerLabel(node.ref) : "Parent"}
        </span>
        <span className="mt-1 flex items-center gap-1">
          {species ? (
            <span className="rounded bg-rank px-1 text-[10px] font-black text-white">{species.rank}</span>
          ) : null}
          {species ? <FamilyIcon family={species.family} size="sm" /> : null}
          {species?.synthOnly ? <SynthIcon size="sm" /> : null}
        </span>
        {node.ref.type === "family" ? (
          <select
            aria-label={`Choose a ${partnerLabel(node.ref)} monster`}
            value={node.speciesId ?? ""}
            onChange={(e) => onPick(e.target.value)}
            className="mt-1 w-full truncate rounded border border-white/40 bg-chrome px-1 text-[11px] font-bold text-gold"
          >
            <option value="">Pick one...</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        ) : null}
      </span>
      {node.expandable ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={node.expanded}
          aria-label={node.expanded ? "Minimize parents" : "Expand parents"}
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md text-parchment ring-2 ring-white",
            node.expanded ? "bg-focus" : "bg-line",
          )}
        >
          {node.expanded ? "−" : "+"}
        </button>
      ) : null}
    </div>
  );
}
