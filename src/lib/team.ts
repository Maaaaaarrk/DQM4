import { familyLabel } from "@/components/family-icon";
import {
  familyMembers,
  monster,
  parentKey,
  type Monster,
  type ParentRef,
  type ScoutSpot,
} from "@/lib/monsters";

export const CAMPAIGN_AREAS = [
  "The Parchland",
  "Witherwood Plains",
  "The Sogswamp",
  "The Spelunk",
  "Shrine of Serenity, Interior",
] as const;

export type Bank = "main" | "reserve";
export type Slots = (string | null)[];

/** Second cell of a large placement. The lineup writes this as "*" so the URL keeps it. */
export const SLOT_CONTINUE = "*";

const EMPTY: Slots = [null, null, null, null];

export function slotKey(bank: Bank, index: number): string {
  return `${bank}:${index}`;
}

export function slotMonsterId(slots: Slots, index: number): string | null {
  const id = slots[index];
  if (!id || id === SLOT_CONTINUE) return null;
  return id;
}

export function slotIsLarge(slots: Slots, index: number): boolean {
  return Boolean(slotMonsterId(slots, index) && slots[index + 1] === SLOT_CONTINUE);
}

export function emptySlots(): Slots {
  return [...EMPTY];
}

const AREA_ORDER = CAMPAIGN_AREAS as readonly string[];

export function areaIndex(area: string): number {
  const index = AREA_ORDER.indexOf(area);
  return index === -1 ? AREA_ORDER.length : index;
}

export function scoutSpots(m: Monster): ScoutSpot[] {
  return m.habitats.filter((spot) => !spot.boss);
}

export function earliestScout(m: Monster): ScoutSpot | null {
  const spots = scoutSpots(m);
  if (!spots.length) return null;
  return spots.slice().sort((a, b) => areaIndex(a.area) - areaIndex(b.area))[0];
}

export function canScoutNow(m: Monster, progress: number): boolean {
  return scoutSpots(m).some((spot) => areaIndex(spot.area) <= progress);
}

export function spotLine(spot: ScoutSpot): string {
  const when = spot.time ?? "Day and night";
  return spot.where ? `${spot.area} · ${when} · ${spot.where}` : `${spot.area} · ${when}`;
}

function knownMonster(id: string): Monster | null {
  try {
    return monster(id);
  } catch {
    return null;
  }
}

function decodeToken(token: string): { id: string; size: "large" | "small" | "default" } {
  if (token.endsWith("*")) return { id: token.slice(0, -1), size: "large" };
  if (token.endsWith("~")) return { id: token.slice(0, -1), size: "small" };
  return { id: token, size: "default" };
}

export function parseLineup(value: string): Slots {
  const parts = value.split(",").slice(0, 4);
  while (parts.length < 4) parts.push("");
  const raw = parts.map((part) => part.trim());
  const out = emptySlots();
  let index = 0;
  while (index < 4) {
    const token = raw[index];
    if (!token || token === SLOT_CONTINUE) {
      index += 1;
      continue;
    }
    const decoded = decodeToken(token);
    const m = knownMonster(decoded.id);
    if (!m) {
      index += 1;
      continue;
    }
    const next = raw[index + 1];
    const legacyLarge = decoded.size === "default" && next === m.id && m.large;
    const markedLarge =
      decoded.size === "large" &&
      index < 3 &&
      (next === SLOT_CONTINUE || next === m.id || next === `${m.id}*`);
    if ((markedLarge || legacyLarge) && index < 3) {
      out[index] = m.id;
      out[index + 1] = SLOT_CONTINUE;
      index += 2;
    } else {
      out[index] = m.id;
      index += 1;
    }
  }
  return out;
}

export function encodeLineup(slots: Slots): string {
  return slots
    .map((id, index) => {
      if (id === SLOT_CONTINUE) return SLOT_CONTINUE;
      if (!id) return "";
      if (slots[index + 1] === SLOT_CONTINUE) return `${id}*`;
      const m = knownMonster(id);
      return m?.large ? `${id}~` : id;
    })
    .join(",");
}

export function placeMonster(slots: Slots, index: number, id: string): Slots | null {
  const m = knownMonster(id);
  if (!m || slots[index]) return null;
  const next = [...slots];
  next[index] = m.id;
  if (m.large && index < 3 && !next[index + 1]) next[index + 1] = SLOT_CONTINUE;
  return next;
}

export function setSlotSize(slots: Slots, index: number, large: boolean): Slots | null {
  if (!slotMonsterId(slots, index) || slotIsLarge(slots, index) === large) return slots;
  if (large && (index > 2 || slots[index + 1])) return null;
  const next = [...slots];
  next[index + 1] = large ? SLOT_CONTINUE : null;
  return next;
}

export function clearSlot(slots: Slots, index: number): Slots {
  if (!slotMonsterId(slots, index)) return slots;
  const next = [...slots];
  next[index] = null;
  if (next[index + 1] === SLOT_CONTINUE) next[index + 1] = null;
  return next;
}

export function removeMonster(slots: Slots, id: string): Slots {
  const next = [...slots];
  for (let index = 0; index < next.length; index += 1) {
    if (next[index] === id) {
      next[index] = null;
      if (next[index + 1] === SLOT_CONTINUE) next[index + 1] = null;
    }
  }
  return next;
}

export function slotFits(slots: Slots, index: number, large: boolean): boolean {
  if (slots[index]) return false;
  if (!large) return true;
  return index < 3 && !slots[index + 1];
}

type ObtainOpts = {
  progress: number;
  have: Set<string>;
};

export function canObtain(id: string, opts: ObtainOpts, seen = new Set<string>()): boolean {
  if (opts.have.has(id)) return true;
  if (seen.has(id)) return false;
  seen.add(id);
  const m = knownMonster(id);
  if (!m) return false;
  if (canScoutNow(m, opts.progress)) return true;
  if (m.parents.length !== 2) return false;
  return m.parents.every((parent) => parentObtainable(parent, opts, new Set(seen)));
}

function parentObtainable(parent: ParentRef, opts: ObtainOpts, seen: Set<string>): boolean {
  if (parent.type === "species") return canObtain(parent.id, opts, seen);
  return familyMembers(parent.family, parent.rank).some((member) =>
    canObtain(member.id, opts, new Set(seen)),
  );
}

function pedigreePath(parentPath: string, slot: "0" | "1" | "up" | "dn", key: string) {
  return `${parentPath}/${slot}:${key}`;
}

/** True when this pedigree node is already marked, scoutable now, or both parents are. */
export function treeObtainable(
  id: string,
  path: string,
  owned: ReadonlySet<string>,
  progress: number,
  seen = new Set<string>(),
): boolean {
  if (owned.has(path)) return true;
  if (seen.has(id)) return false;
  seen.add(id);
  const m = knownMonster(id);
  if (!m) return false;
  if (canScoutNow(m, progress)) return true;
  if (m.parents.length !== 2) return false;
  const root = !path.includes("/");
  return m.parents.every((parent, index) => {
    const slot = root ? (index === 0 ? "up" : "dn") : index === 0 ? "0" : "1";
    const child = pedigreePath(path, slot, parentKey(parent));
    if (owned.has(child)) return true;
    if (parent.type === "species") {
      return treeObtainable(parent.id, child, owned, progress, new Set(seen));
    }
    return familyMembers(parent.family, parent.rank).some((member) =>
      canObtain(member.id, { progress, have: new Set() }, new Set(seen)),
    );
  });
}

export type PlanStep = {
  title: string;
  line: string;
  ready: boolean;
  monsterId: string | null;
};

export function parentPlan(parent: ParentRef, opts: ObtainOpts): PlanStep {
  if (parent.type === "species") {
    const m = monster(parent.id);
    return { title: m.name, ...statusLine(m, opts), monsterId: m.id };
  }
  const rank = parent.rank === "Any" ? "Any rank" : `${parent.rank} rank`;
  const title = `${rank} ${familyLabel(parent.family)}`;
  const members = familyMembers(parent.family, parent.rank);
  const owned = members.find((member) => opts.have.has(member.id));
  if (owned) {
    return { title, line: `Have ${owned.name}`, ready: true, monsterId: owned.id };
  }
  const now = members
    .filter((member) => canScoutNow(member, opts.progress))
    .sort((a, b) => areaIndex(earliestScout(a)?.area ?? "") - areaIndex(earliestScout(b)?.area ?? ""));
  if (now[0]) {
    const spot = earliestScout(now[0]);
    return {
      title,
      line: spot ? `Scout ${now[0].name} now · ${spotLine(spot)}` : `Scout ${now[0].name} now`,
      ready: true,
      monsterId: now[0].id,
    };
  }
  const later = members
    .map((member) => ({ member, spot: earliestScout(member) }))
    .filter((item): item is { member: Monster; spot: ScoutSpot } => item.spot != null)
    .sort((a, b) => areaIndex(a.spot.area) - areaIndex(b.spot.area));
  if (later[0]) {
    return {
      title,
      line: `After ${later[0].spot.area} · ${later[0].member.name}`,
      ready: false,
      monsterId: later[0].member.id,
    };
  }
  return { title, line: "No scout for this family in the open areas", ready: false, monsterId: null };
}

function statusLine(m: Monster, opts: ObtainOpts): { line: string; ready: boolean } {
  if (opts.have.has(m.id)) return { line: "Have it", ready: true };
  if (canScoutNow(m, opts.progress)) {
    const spot = earliestScout(m);
    return { line: spot ? `Scout now · ${spotLine(spot)}` : "Scout now", ready: true };
  }
  const spot = earliestScout(m);
  if (spot) return { line: `After ${spot.area} · ${spotLine(spot)}`, ready: false };
  if (m.habitats.some((habitat) => habitat.boss)) {
    return { line: "Zone boss. Not a scout target.", ready: false };
  }
  if (m.parents.length === 2) return { line: "Synthesis", ready: canObtain(m.id, opts) };
  return { line: "No way to get this yet", ready: false };
}

export function monsterStatus(id: string, opts: ObtainOpts): { line: string; ready: boolean } {
  const m = knownMonster(id);
  if (!m) return { line: "Unknown monster", ready: false };
  return statusLine(m, opts);
}

export type TimelineMember = {
  id: string;
  /** Pedigree paths already marked Have it in this party slot's tree. */
  owned: readonly string[];
  /** Family wildcard choices in this slot's tree, keyed by pedigree path. */
  picks?: Readonly<Record<string, string>>;
};

export type TimelineScout = {
  id: string;
  lines: string[];
  /** Party monsters this catch is for, when it is not that monster itself. */
  targets: string[];
};

export type TimelineZone = {
  area: string;
  scouts: TimelineScout[];
};

export type TimelineBlock = {
  id: string;
  line: string;
};

export type ScoutTimeline = {
  zones: TimelineZone[];
  blocked: TimelineBlock[];
};

type ScoutNeed = {
  area: number;
  scouts: { id: string; area: number }[];
};

type NeedMemo = Map<string, ScoutNeed | "no">;

const NOTHING: ScoutNeed = { area: -1, scouts: [] };

function spotsInEarliestArea(m: Monster): ScoutSpot[] {
  const spots = scoutSpots(m);
  if (!spots.length) return [];
  const earliest = Math.min(...spots.map((spot) => areaIndex(spot.area)));
  return spots.filter((spot) => areaIndex(spot.area) === earliest);
}

function ownedKey(path: string, owned: ReadonlySet<string>): string {
  const marks: string[] = [];
  for (const flag of owned) {
    if (flag === path || flag.startsWith(`${path}/`)) marks.push(flag);
  }
  marks.sort();
  return marks.join("|");
}

function betterNeed(plan: ScoutNeed, best: ScoutNeed): boolean {
  return plan.area < best.area || (plan.area === best.area && plan.scouts.length < best.scouts.length);
}

function pickKey(path: string, picks: Readonly<Record<string, string>>): string {
  const marks: string[] = [];
  for (const [flag, id] of Object.entries(picks)) {
    if (flag === path || flag.startsWith(`${path}/`)) marks.push(`${flag}=${id}`);
  }
  marks.sort();
  return marks.join("|");
}

function needAt(
  id: string,
  path: string,
  owned: ReadonlySet<string>,
  seen: Set<string>,
  memo: NeedMemo,
  picks: Readonly<Record<string, string>>,
): ScoutNeed | null {
  const key = `${id}\n${ownedKey(path, owned)}\n${pickKey(path, picks)}`;
  const cached = memo.get(key);
  if (cached) return cached === "no" ? null : cached;
  if (owned.has(path)) {
    memo.set(key, NOTHING);
    return NOTHING;
  }
  if (seen.has(id)) return null;
  const m = knownMonster(id);
  if (!m) {
    memo.set(key, "no");
    return null;
  }
  const spots = spotsInEarliestArea(m);
  if (spots.length) {
    const plan = { area: areaIndex(spots[0].area), scouts: [{ id: m.id, area: areaIndex(spots[0].area) }] };
    memo.set(key, plan);
    return plan;
  }
  if (m.parents.length !== 2) {
    memo.set(key, "no");
    return null;
  }
  const next = new Set(seen);
  next.add(id);
  const root = !path.includes("/");
  const parts: ScoutNeed[] = [];
  for (let index = 0; index < 2; index += 1) {
    const parent = m.parents[index];
    const slot = root ? (index === 0 ? "up" : "dn") : index === 0 ? "0" : "1";
    const child = pedigreePath(path, slot, parentKey(parent));
    if (owned.has(child)) {
      parts.push(NOTHING);
      continue;
    }
    const part =
      parent.type === "species"
        ? needAt(parent.id, child, owned, next, memo, picks)
        : needFamily(parent, child, owned, next, memo, picks);
    if (!part) return null;
    parts.push(part);
  }
  const byId = new Map<string, number>();
  for (const part of parts) {
    for (const scout of part.scouts) {
      const prev = byId.get(scout.id);
      if (prev == null || scout.area < prev) byId.set(scout.id, scout.area);
    }
  }
  const scouts = [...byId].map(([scoutId, area]) => ({ id: scoutId, area }));
  const plan = { area: scouts.length ? Math.max(...scouts.map((scout) => scout.area)) : -1, scouts };
  memo.set(key, plan);
  return plan;
}

function needFamily(
  parent: ParentRef & { type: "family" },
  path: string,
  owned: ReadonlySet<string>,
  seen: Set<string>,
  memo: NeedMemo,
  picks: Readonly<Record<string, string>>,
): ScoutNeed | null {
  if (owned.has(path)) return NOTHING;
  const chosen = picks[path];
  if (chosen && familyMembers(parent.family, parent.rank).some((member) => member.id === chosen)) {
    return needAt(chosen, path, owned, seen, memo, picks);
  }
  const members = familyMembers(parent.family, parent.rank);
  let best: ScoutNeed | null = null;
  const synth: Monster[] = [];
  for (const member of members) {
    if (!earliestScout(member)) {
      synth.push(member);
      continue;
    }
    const plan = needAt(member.id, path, owned, new Set(seen), memo, picks);
    if (!plan) continue;
    if (!best || betterNeed(plan, best)) best = plan;
    if (plan.scouts.length === 0 || (plan.area === 0 && plan.scouts.length === 1)) return plan;
  }
  if (best?.area === 0) return best;
  for (const member of synth) {
    const plan = needAt(member.id, path, owned, new Set(seen), memo, picks);
    if (!plan) continue;
    if (!best || betterNeed(plan, best)) best = plan;
  }
  return best;
}

function blockLine(id: string): string {
  const m = knownMonster(id);
  if (!m) return "Unknown monster";
  if (m.habitats.some((habitat) => habitat.boss)) return "Zone boss. Not a scout target.";
  return "No scout leads to this monster.";
}

/** Scouts that build the party, grouped by the earliest zone each catch appears. */
export function scoutTimeline(members: readonly TimelineMember[]): ScoutTimeline {
  const scouts = new Map<string, { area: number; targets: Set<string> }>();
  const blocked: TimelineBlock[] = [];
  const seenBlocked = new Set<string>();
  const memo: NeedMemo = new Map();

  for (const member of members) {
    const monsterRow = knownMonster(member.id);
    if (!monsterRow) continue;
    const owned = new Set(member.owned);
    const plan = needAt(member.id, member.id, owned, new Set(), memo, member.picks ?? {});
    if (!plan) {
      if (!seenBlocked.has(member.id)) {
        seenBlocked.add(member.id);
        blocked.push({ id: member.id, line: blockLine(member.id) });
      }
      continue;
    }
    for (const scout of plan.scouts) {
      const row = scouts.get(scout.id);
      if (row) {
        if (scout.id !== member.id) row.targets.add(monsterRow.name);
        continue;
      }
      const targets = new Set<string>();
      if (scout.id !== member.id) targets.add(monsterRow.name);
      scouts.set(scout.id, { area: scout.area, targets });
    }
  }

  const zones: TimelineZone[] = [];
  for (let area = 0; area < CAMPAIGN_AREAS.length; area += 1) {
    const rows = [...scouts]
      .filter(([, scout]) => scout.area === area)
      .map(([id, scout]) => {
        const m = monster(id);
        return {
          id,
          lines: spotsInEarliestArea(m).map(spotLine),
          targets: [...scout.targets].sort((a, b) => a.localeCompare(b)),
        };
      })
      .sort((a, b) => monster(a.id).name.localeCompare(monster(b.id).name));
    if (rows.length) zones.push({ area: CAMPAIGN_AREAS[area], scouts: rows });
  }

  const later = [...scouts].filter(([, scout]) => scout.area >= CAMPAIGN_AREAS.length);
  if (later.length) {
    zones.push({
      area: "Somewhere else",
      scouts: later.map(([id, scout]) => ({
        id,
        lines: spotsInEarliestArea(monster(id)).map(spotLine),
        targets: [...scout.targets].sort((a, b) => a.localeCompare(b)),
      })),
    });
  }

  return { zones, blocked };
}


