import familyRows from "@/data/dqm4/Family.json";
import locationRows from "@/data/dqm4/MonsterLocation.json";
import monsterRows from "@/data/dqm4/Monster.json";
import synthesisRows from "@/data/dqm4/MonsterSynthesis.json";
import rankRows from "@/data/dqm4/Rank.json";

export type Family =
  | "slime"
  | "dragon"
  | "nature"
  | "beast"
  | "material"
  | "demon"
  | "undead"
  | "boss";

export type Rank = "G" | "F" | "E" | "D" | "C" | "B" | "A" | "S" | "X" | "Any";

export type ParentRef =
  | { type: "species"; id: string }
  | { type: "family"; tokenId: string; family: Family; rank: Rank };

export type Monster = {
  id: string;
  monsterId: number;
  name: string;
  family: Family;
  rank: Rank;
  synthOnly: boolean;
  /** False when the source row has not been checked. */
  verified: boolean;
  parents: [ParentRef, ParentRef] | [];
};

type RawMonster = {
  MonsterId: number;
  FamilyId: number;
  RankId: number;
  Number: number | null;
  Name: string;
  Identifier: string;
  IsVerified: boolean;
};

type RawFamily = { FamilyId: number; Identifier: string; Name: string };
type RawRank = { RankId: number; Name: string };
type RawSynth = {
  MonsterResultId: number;
  MonsterParent1Id: number;
  MonsterParent2Id: number;
};
type RawLoc = { MonsterId: number };

const FAMILIES_BY_ID = new Map<number, Family>(
  (familyRows as RawFamily[]).map((f) => [f.FamilyId, f.Identifier as Family]),
);
const RANKS_BY_ID = new Map<number, string>(
  (rankRows as RawRank[]).map((r) => [r.RankId, r.Name]),
);

function isFamilyToken(m: RawMonster): boolean {
  return m.Name.includes("Family (");
}

function asFamily(id: number): Family {
  return FAMILIES_BY_ID.get(id) ?? "material";
}

function asRank(id: number): Rank {
  const n = RANKS_BY_ID.get(id) ?? "G";
  return n as Rank;
}

const rawById = new Map<number, RawMonster>(
  (monsterRows as RawMonster[]).map((m) => [m.MonsterId, m]),
);
const scouted = new Set((locationRows as RawLoc[]).map((r) => r.MonsterId));

const SPECIES_RAW = (monsterRows as RawMonster[]).filter((m) => !isFamilyToken(m));

const recipesByResult = new Map<number, RawSynth[]>();
for (const s of synthesisRows as RawSynth[]) {
  const list = recipesByResult.get(s.MonsterResultId);
  if (list) list.push(s);
  else recipesByResult.set(s.MonsterResultId, [s]);
}

function toRef(raw: RawMonster): ParentRef {
  if (isFamilyToken(raw)) {
    return {
      type: "family",
      tokenId: raw.Identifier,
      family: asFamily(raw.FamilyId),
      rank: asRank(raw.RankId),
    };
  }
  return { type: "species", id: raw.Identifier };
}

function pickParents(resultId: number): [ParentRef, ParentRef] | [] {
  const recs = recipesByResult.get(resultId);
  if (!recs?.length) return [];
  const catchable = scouted.has(resultId);

  let specific: [ParentRef, ParentRef] | null = null;
  let wildcard: [ParentRef, ParentRef] | null = null;
  for (const s of recs) {
    const a = rawById.get(s.MonsterParent1Id);
    const b = rawById.get(s.MonsterParent2Id);
    if (!a || !b) continue;
    const pair: [ParentRef, ParentRef] = [toRef(a), toRef(b)];
    const familyPair = pair[0].type === "family" || pair[1].type === "family";
    if (!familyPair && !specific) specific = pair;
    if (familyPair && !wildcard) wildcard = pair;
  }

  if (specific) return specific;
  if (catchable) return [];
  return wildcard ?? [];
}

function toMonster(raw: RawMonster): Monster {
  return {
    id: raw.Identifier,
    monsterId: raw.MonsterId,
    name: raw.Name,
    family: asFamily(raw.FamilyId),
    rank: asRank(raw.RankId),
    synthOnly: !scouted.has(raw.MonsterId),
    verified: raw.IsVerified === true,
    parents: pickParents(raw.MonsterId),
  };
}

export const SPECIES: Monster[] = SPECIES_RAW.map(toMonster).sort((a, b) =>
  a.name.localeCompare(b.name),
);

export const MONSTERS: Record<string, Monster> = Object.fromEntries(
  SPECIES.map((m) => [m.id, m]),
);

const FEATURED_NAMES = [
  "Hunter Mech",
  "Warhog",
  "Gold Golem",
  "Beshemoth Slime",
  "Dessert Demon",
  "Slime Knight",
  "Jargon",
  "Avian Android",
];

export const ROOT_OPTIONS = FEATURED_NAMES.map(
  (name) => SPECIES.find((m) => m.name === name)?.id,
).filter((id): id is string => Boolean(id));

export const FAMILY_ORDER: Family[] = [
  "slime",
  "dragon",
  "nature",
  "beast",
  "material",
  "demon",
  "undead",
  "boss",
];

/** Scout ranks, low to high. "Any" is only a synthesis wildcard. */
export const RANK_ORDER: Rank[] = ["G", "F", "E", "D", "C", "B", "A", "S", "X"];

export type BuildOption = {
  resultId: string;
  partner: ParentRef;
};

const buildsBySpecies = new Map<string, BuildOption[]>();
const buildsByFamilyRank = new Map<string, BuildOption[]>();

function pushBuild(map: Map<string, BuildOption[]>, key: string, option: BuildOption) {
  const list = map.get(key);
  if (list) list.push(option);
  else map.set(key, [option]);
}

for (const row of synthesisRows as RawSynth[]) {
  const result = rawById.get(row.MonsterResultId);
  const parent1 = rawById.get(row.MonsterParent1Id);
  const parent2 = rawById.get(row.MonsterParent2Id);
  if (!result || !parent1 || !parent2 || isFamilyToken(result)) continue;
  const resultId = result.Identifier;
  const left: BuildOption = { resultId, partner: toRef(parent2) };
  const right: BuildOption = { resultId, partner: toRef(parent1) };
  if (isFamilyToken(parent1)) {
    pushBuild(buildsByFamilyRank, `${asFamily(parent1.FamilyId)}:${asRank(parent1.RankId)}`, left);
  } else {
    pushBuild(buildsBySpecies, parent1.Identifier, left);
  }
  if (isFamilyToken(parent2)) {
    pushBuild(buildsByFamilyRank, `${asFamily(parent2.FamilyId)}:${asRank(parent2.RankId)}`, right);
  } else {
    pushBuild(buildsBySpecies, parent2.Identifier, right);
  }
}

function rankIndex(rank: Rank): number {
  const i = RANK_ORDER.indexOf(rank);
  return i === -1 ? RANK_ORDER.length : i;
}

/** Syntheses that use this monster as one parent. The partner is the other parent. */
export function buildsFrom(id: string): BuildOption[] {
  const self = monster(id);
  const hits = [
    ...(buildsBySpecies.get(id) ?? []),
    ...(buildsByFamilyRank.get(`${self.family}:${self.rank}`) ?? []),
    ...(buildsByFamilyRank.get(`${self.family}:Any`) ?? []),
  ];
  const seen = new Set<string>();
  const options: BuildOption[] = [];
  for (const hit of hits) {
    const key = `${hit.resultId}:${parentKey(hit.partner)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(hit);
  }
  return options.sort((a, b) => {
    const resultA = monster(a.resultId);
    const resultB = monster(b.resultId);
    const byRank = rankIndex(resultA.rank) - rankIndex(resultB.rank);
    if (byRank !== 0) return byRank;
    const byName = resultA.name.localeCompare(resultB.name);
    if (byName !== 0) return byName;
    return parentKey(a.partner).localeCompare(parentKey(b.partner));
  });
}

export function monster(id: string): Monster {
  const m = MONSTERS[id];
  if (!m) throw new Error(`Unknown monster: ${id}`);
  return m;
}

export function hasParents(id: string): boolean {
  return monster(id).parents.length === 2;
}

export function parentKey(ref: ParentRef): string {
  return ref.type === "species" ? ref.id : ref.tokenId;
}

export function familyMembers(family: Family, rank: Rank): Monster[] {
  return SPECIES.filter((m) => {
    if (m.family !== family) return false;
    if (rank !== "Any" && m.rank !== rank) return false;
    return true;
  }).sort((a, b) => {
    if (a.synthOnly !== b.synthOnly) return a.synthOnly ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

export function searchSpecies(query: string): Monster[] {
  const q = query.trim().toLowerCase();
  if (!q) return SPECIES;
  return SPECIES.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.includes(q),
  );
}
