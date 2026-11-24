import spotRows from "@/data/dqm4/BushSpot.json";
import { SPECIES } from "@/lib/monsters";

export type BushOdd = {
  kind: "monster" | "item";
  name: string;
  nameJa: string;
  weight: number;
};

export type BushMember = {
  monsterId: number;
  id: string;
  name: string;
  /** This monster's share of the whole bush, items included. */
  share: string;
};

export type BushFind = {
  items: { name: string; share: string }[];
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
  find: BushFind;
  members: BushMember[];
};

type RawOdd = {
  Kind: "monster" | "item";
  Name: string;
  NameJa: string;
  Weight: number;
};

type RawMember = {
  MonsterId: number;
  Weight: number;
};

type RawSpot = {
  MonsterId: number;
  Area: string;
  Map: string;
  X: number;
  Y: number;
  Odds: RawOdd[];
  Members: RawMember[];
};

const byNumber = new Map(SPECIES.map((monster) => [monster.monsterId, monster]));

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a;
}

/** Reduced share of one part of a total. */
function shareOf(part: number, total: number): string {
  if (part <= 0 || total <= 0) return "";
  const unit = gcd(part, total);
  const mine = part / unit;
  const all = total / unit;
  return mine === 1 ? `1 in ${all}` : `${mine} in ${all}`;
}

/**
 * Items and monsters on one scale. An item keeps its own weight.
 * A monster's weight is scaled by the monster outcome, so the row sums to one.
 */
function wholeBush(odds: readonly BushOdd[], memberWeights: readonly number[]) {
  const oddsTotal = odds.reduce((sum, odd) => sum + odd.weight, 0);
  const memberTotal = memberWeights.reduce((sum, weight) => sum + weight, 0);
  const monsterWeight = odds.reduce((sum, odd) => sum + (odd.kind === "monster" ? odd.weight : 0), 0);
  const total = oddsTotal * memberTotal;
  return {
    item: (weight: number) => shareOf(weight * memberTotal, total),
    monster: (weight: number) => shareOf(monsterWeight * weight, total),
  };
}

export const BUSH_SPOTS: BushSpot[] = (spotRows as RawSpot[]).flatMap((row) => {
  const monster = byNumber.get(row.MonsterId);
  if (!monster) return [];
  const memberWeights = row.Members.map((member) => member.Weight);
  const odds = row.Odds.map((odd) => ({
    kind: odd.Kind,
    name: odd.Kind === "monster" ? monster.name : odd.Name,
    nameJa: odd.NameJa,
    weight: odd.Weight,
  }));
  const whole = wholeBush(odds, memberWeights);
  return [
    {
      monsterId: row.MonsterId,
      id: monster.id,
      name: monster.name,
      area: row.Area,
      map: row.Map,
      x: row.X,
      y: row.Y,
      odds,
      find: {
        items: odds.flatMap((odd) => (odd.kind === "item" ? [{ name: odd.name, share: whole.item(odd.weight) }] : [])),
      },
      members: row.Members.flatMap((member) => {
        const species = byNumber.get(member.MonsterId);
        if (!species) return [];
        return [
          {
            monsterId: member.MonsterId,
            id: species.id,
            name: species.name,
            share: whole.monster(member.Weight),
          },
        ];
      }),
    },
  ];
});

/** One line for the monsters drawn on a bush. */
export function bushGroupLine(area: string, members: readonly { name: string; share?: string }[]): string {
  const rolls = members.flatMap((member) => (member.share ? [`${member.name} ${member.share}`] : [])).join(", ");
  return `${area} · Bush. ${rolls}.`;
}

/** One line for every bush a monster belongs to in a single area. */
export function bushAreaLine(shares: readonly string[]): string {
  if (shares.length === 0) return "";
  if (shares.length === 1) return `Bush. ${shares[0]}.`;
  const counts = new Map<string, number>();
  for (const share of shares) counts.set(share, (counts.get(share) ?? 0) + 1);
  const only = [...counts.keys()];
  if (only.length === 1) return `${shares.length} bushes. ${only[0]} on each.`;
  const parts = [...counts].map(([share, count]) =>
    count === 1 ? `${share} on one bush` : `${share} on ${count} bushes`,
  );
  return `${shares.length} bushes. ${parts.join(", ")}.`;
}

export function bushShares(id: string): { area: string; map: string; shares: string[] }[] {
  const groups = new Map<string, { area: string; map: string; shares: string[] }>();
  for (const spot of BUSH_SPOTS) {
    const member = spot.members.find((row) => row.id === id);
    if (!member) continue;
    const group = groups.get(spot.area) ?? { area: spot.area, map: spot.map, shares: [] };
    group.shares.push(member.share);
    groups.set(spot.area, group);
  }
  return [...groups.values()];
}
