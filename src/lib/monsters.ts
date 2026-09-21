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
  parents: [ParentRef, ParentRef] | [];
};

type RawMonster = {
  MonsterId: number;
  FamilyId: number;
  RankId: number;
  Number: number | null;
  Name: string;
  Identifier: string;
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
