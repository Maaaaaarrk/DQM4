import listRows from "@/data/dqm4/BushList.json";
import spotRows from "@/data/dqm4/BushSpot.json";
import { SPECIES } from "@/lib/monsters";

export type BushOdd = {
  kind: "monster" | "item";
  name: string;
  nameJa: string;
  weight: number;
};

export type BushSpot = {
  monsterId: number;
  id: string;
  name: string;
  area: string;
  map: string;
  x: number;
  y: number;
  odds: BushOdd[];
};

type RawOdd = {
  Kind: "monster" | "item";
  Name: string;
  NameJa: string;
  Weight: number;
};

type RawSpot = {
  MonsterId: number;
  Area: string;
  Map: string;
  X: number;
  Y: number;
  Odds: RawOdd[];
};

export type BushListEntry = {
  monsterId: number;
  id: string;
  name: string;
  area: string;
  map: string;
  /** Stored shaking-grass rows for this species in this zone. No coordinate. */
  weights: number[];
};

type RawList = {
  MonsterId: number;
  Area: string;
  Map: string;
  Weights: number[];
};

const byNumber = new Map(SPECIES.map((monster) => [monster.monsterId, monster]));

export const BUSH_SPOTS: BushSpot[] = (spotRows as RawSpot[]).flatMap((row) => {
  const monster = byNumber.get(row.MonsterId);
  if (!monster) return [];
  return [
    {
      monsterId: row.MonsterId,
      id: monster.id,
      name: monster.name,
      area: row.Area,
      map: row.Map,
      x: row.X,
      y: row.Y,
      odds: row.Odds.map((odd) => ({
        kind: odd.Kind,
        name: odd.Kind === "monster" ? monster.name : odd.Name,
        nameJa: odd.NameJa,
        weight: odd.Weight,
      })),
    },
  ];
});

/** Shaking grass in a zone. Each weight is one stored row. These rows have no map coordinate. */
export const BUSH_LIST: BushListEntry[] = (listRows as RawList[]).flatMap((row) => {
  const monster = byNumber.get(row.MonsterId);
  if (!monster || row.Weights.length === 0) return [];
  return [
    {
      monsterId: row.MonsterId,
      id: monster.id,
      name: monster.name,
      area: row.Area,
      map: row.Map,
      weights: row.Weights,
    },
  ];
});

const GRASS_SIDE: Record<string, string> = {
  "The Sogswamp": "north",
  "Witherwood Plains": "middle",
  "The Parchland": "south",
};

export function grassSide(area: string): string {
  return GRASS_SIDE[area] ?? "";
}

/** Where to walk. The side matches the area name already drawn on the field map. */
export function grassPlace(area: string, where = "this map"): string {
  const side = GRASS_SIDE[area];
  return side ? `${area}, the ${side} part of ${where}` : area;
}

/** 100 is one heavy entry. 20 is one light entry. */
export function grassSummary(weights: readonly number[]): string {
  let heavy = 0;
  let light = 0;
  const other: number[] = [];
  for (const weight of weights) {
    if (weight === 100) heavy += 1;
    else if (weight === 20) light += 1;
    else other.push(weight);
  }
  const parts: string[] = [];
  if (heavy) parts.push(`${heavy} heavy`);
  if (light) parts.push(`${light} light`);
  if (other.length) parts.push(other.join(", "));
  if (parts.length < 2) return parts[0] ?? weights.join(", ");
  if (other.length) return parts.join(", ");
  return `${parts[0]} and ${parts[1]}`;
}

export function grassDetail(area: string, weights: readonly number[], where = "this map"): string {
  return `Shake the grass in ${grassPlace(area, where)}. ${grassSummary(weights)}.`;
}

export function bushDetail(area: string, odds: readonly { name: string; weight: number }[]): string {
  const rolls = odds.map((odd) => `${odd.name} ${odd.weight}`).join(", ");
  return `${area} · Bush. ${rolls}`;
}
