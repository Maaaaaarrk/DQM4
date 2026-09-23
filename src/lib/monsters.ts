import familyRows from "@/data/dqm4/Family.json";
import monsterRows from "@/data/dqm4/Monster.json";
import rankRows from "@/data/dqm4/Rank.json";
import scoutRows from "@/data/dqm4/ScoutSpot.json";
import skillRows from "@/data/dqm4/Skill.json";
import synthesisRows from "@/data/dqm4/MonsterSynthesis.json";
import traitRows from "@/data/dqm4/Trait.json";

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

export type GrowthCurves = {
  exp: number;
  hp: number;
  mp: number;
  attack: number;
  defence: number;
  agility: number;
  wisdom: number;
};

export type Resistances = {
  fire: number;
  water: number;
  wind: number;
  earth: number;
  explosion: number;
  freeze: number;
  thunder: number;
  light: number;
  darkness: number;
  weakness: number;
  hit: number;
  seal: number;
  drainMp: number;
  confusion: number;
  sleep: number;
  paralysis: number;
  rest: number;
  poison: number;
  suddenDeath: number;
};

export type MonsterTrait = {
  key: string;
  /** Null when the trait is available from the start. */
  level: number | null;
  largeOnly: boolean;
  boss: boolean;
};

export type MonsterDrop = {
  name: string | null;
  nameJa: string | null;
  description: string | null;
  rate: number;
};

export type TraitInfo = {
  key: string;
  name: string | null;
  nameJa: string | null;
  description: string | null;
  descriptionJa: string | null;
};

export type SkillLearn = {
  points: number;
  key: string;
  kind: "action" | "trait";
  name: string;
  nameJa: string | null;
  description: string | null;
};

export type SkillInfo = {
  key: string;
  name: string | null;
  nameJa: string | null;
  description: string | null;
  descriptionJa: string | null;
  /** Official category when the game has an English label. */
  category: string | null;
  /** Key of the skill this one grows into. */
  evolution: string | null;
  learns: SkillLearn[];
};

export type ScoutSpot = {
  area: string;
  areaJa: string;
  /** Day or Night when the spawn is limited. Null when it is out at both. */
  time: "Day" | "Night" | null;
  /** Null on the ground. Low air, in water, or underground otherwise. */
  where: string | null;
  /** A one-off zone boss. Not a reasonable scout. */
  boss: boolean;
};

export type Monster = {
  id: string;
  monsterId: number;
  name: string;
  family: Family;
  rank: Rank;
  /** Japanese name, when the row has one. */
  japanese?: string;
  synthOnly: boolean;
  /** Field places. Empty when the monster is synthesis only. */
  habitats: ScoutSpot[];
  /** Large monsters take two party slots. */
  large: boolean;
  /** False when the source row has not been checked. */
  verified: boolean;
  parents: [ParentRef, ParentRef] | [];
  /** Max caps. Order is HP, MP, attack, defence, agility, wisdom. */
  maxHp: number | null;
  maxMp: number | null;
  maxAtt: number | null;
  maxDef: number | null;
  maxAgi: number | null;
  maxWis: number | null;
  /** Characteristic slots. Trait text is in TRAITS. */
  traits: MonsterTrait[];
  /** Innate skill key. Skill text is in SKILLS. */
  skill: string | null;
  /** Growth-table ids. */
  growthCurves: GrowthCurves | null;
  /** Named resistance values. */
  resistances: Resistances | null;
  drops: MonsterDrop[];
};

type RawDrop = {
  Name: string | null;
  NameJa?: string | null;
  Description?: string | null;
  Rate: number;
};

type RawMonster = {
  MonsterId: number;
  FamilyId: number;
  RankId: number;
  Number: number | null;
  Name: string;
  JapaneseName?: string | null;
  Identifier: string;
  IsVerified: boolean;
  Large?: boolean;
  MaxHP?: number | null;
  MaxMP?: number | null;
  MaxAtt?: number | null;
  MaxDef?: number | null;
  MaxAgi?: number | null;
  MaxWis?: number | null;
  Traits?: { Key: string; Level: number | null; LargeOnly: boolean; Boss?: boolean }[];
  Skill?: string | null;
  GrowthCurves?: {
    Exp: number;
    HP: number;
    MP: number;
    Attack: number;
    Defence: number;
    Agility: number;
    Wisdom: number;
  } | null;
  Resistances?: {
    Fire: number;
    Water: number;
    Wind: number;
    Earth: number;
    Explosion: number;
    Freeze: number;
    Thunder: number;
    Light: number;
    Darkness: number;
    Weakness: number;
    Hit: number;
    Seal: number;
    DrainMp: number;
    Confusion: number;
    Sleep: number;
    Paralysis: number;
    Rest: number;
    Poison: number;
    SuddenDeath: number;
  } | null;
  Drops?: RawDrop[];
};

type RawTrait = {
  Key: string;
  Name: string | null;
  NameJa: string | null;
  Description: string | null;
  DescriptionJa: string | null;
};

type RawSkill = {
  Key: string;
  Name: string | null;
  NameJa: string | null;
  Description: string | null;
  DescriptionJa: string | null;
  Category?: string | null;
  Evolution?: string | null;
  Learns?: {
    Points: number;
    Key: string;
    Kind: "action" | "trait";
    Name: string;
    NameJa: string | null;
    Description: string | null;
  }[];
};

type RawFamily = { FamilyId: number; Identifier: string; Name: string };
type RawRank = { RankId: number; Name: string };
type RawSynth = {
  MonsterResultId: number;
  MonsterParent1Id: number;
  MonsterParent2Id: number;
};
type RawSpot = {
  MonsterId: number;
  Area: string;
  AreaJa: string;
  Time: "Day" | "Night" | null;
  Where: string | null;
  Boss?: boolean;
};

const spotsByMonster = new Map<number, ScoutSpot[]>();
for (const row of scoutRows as RawSpot[]) {
  const spot: ScoutSpot = {
    area: row.Area,
    areaJa: row.AreaJa,
    time: row.Time,
    where: row.Where,
    boss: row.Boss === true,
  };
  const list = spotsByMonster.get(row.MonsterId);
  if (list) list.push(spot);
  else spotsByMonster.set(row.MonsterId, [spot]);
}

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
const scouted = new Set(spotsByMonster.keys());

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
    japanese: raw.JapaneseName || undefined,
    synthOnly: !scouted.has(raw.MonsterId),
    habitats: spotsByMonster.get(raw.MonsterId) ?? [],
    large: raw.Large === true,
    verified: raw.IsVerified === true,
    parents: pickParents(raw.MonsterId),
    maxHp: raw.MaxHP ?? null,
    maxMp: raw.MaxMP ?? null,
    maxAtt: raw.MaxAtt ?? null,
    maxDef: raw.MaxDef ?? null,
    maxAgi: raw.MaxAgi ?? null,
    maxWis: raw.MaxWis ?? null,
    traits: (raw.Traits ?? []).map((trait) => ({
      key: trait.Key,
      level: trait.Level,
      largeOnly: trait.LargeOnly,
      boss: trait.Boss === true,
    })),
    skill: raw.Skill ?? null,
    growthCurves: raw.GrowthCurves
      ? {
          exp: raw.GrowthCurves.Exp,
          hp: raw.GrowthCurves.HP,
          mp: raw.GrowthCurves.MP,
          attack: raw.GrowthCurves.Attack,
          defence: raw.GrowthCurves.Defence,
          agility: raw.GrowthCurves.Agility,
          wisdom: raw.GrowthCurves.Wisdom,
        }
      : null,
    resistances: raw.Resistances
      ? {
          fire: raw.Resistances.Fire,
          water: raw.Resistances.Water,
          wind: raw.Resistances.Wind,
          earth: raw.Resistances.Earth,
          explosion: raw.Resistances.Explosion,
          freeze: raw.Resistances.Freeze,
          thunder: raw.Resistances.Thunder,
          light: raw.Resistances.Light,
          darkness: raw.Resistances.Darkness,
          weakness: raw.Resistances.Weakness,
          hit: raw.Resistances.Hit,
          seal: raw.Resistances.Seal,
          drainMp: raw.Resistances.DrainMp,
          confusion: raw.Resistances.Confusion,
          sleep: raw.Resistances.Sleep,
          paralysis: raw.Resistances.Paralysis,
          rest: raw.Resistances.Rest,
          poison: raw.Resistances.Poison,
          suddenDeath: raw.Resistances.SuddenDeath,
        }
      : null,
    drops: (raw.Drops ?? []).map((drop) => ({
      name: drop.Name,
      nameJa: drop.NameJa ?? null,
      description: drop.Description ?? null,
      rate: drop.Rate,
    })),
  };
}

export const TRAITS: Record<string, TraitInfo> = Object.fromEntries(
  (traitRows as RawTrait[]).map((row) => [
    row.Key,
    {
      key: row.Key,
      name: row.Name,
      nameJa: row.NameJa,
      description: row.Description,
      descriptionJa: row.DescriptionJa,
    },
  ]),
);

export const SKILLS: Record<string, SkillInfo> = Object.fromEntries(
  (skillRows as RawSkill[]).map((row) => [
    row.Key,
    {
      key: row.Key,
      name: row.Name,
      nameJa: row.NameJa,
      description: row.Description,
      descriptionJa: row.DescriptionJa,
      category: row.Category ?? null,
      evolution: row.Evolution ?? null,
      learns: (row.Learns ?? []).map((item) => ({
        points: item.Points,
        key: item.Key,
        kind: item.Kind,
        name: item.Name,
        nameJa: item.NameJa,
        description: item.Description,
      })),
    },
  ]),
);

export const SKILL_LIST: SkillInfo[] = Object.values(SKILLS)
  .filter((skill) => skill.name)
  .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

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
  "Healslime",
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
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.id.includes(q) ||
      (m.japanese?.toLowerCase().includes(q) ?? false),
  );
}
