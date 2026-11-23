import pointRows from "@/data/dqm4/ScoutPoint.json";
import { SPECIES } from "@/lib/monsters";

export type ScoutPoint = {
  monsterId: number;
  id: string;
  name: string;
  area: string;
  time: "Day" | "Night" | null;
  where: string | null;
  boss: boolean;
  map: string;
  x: number;
  y: number;
};

type RawPoint = {
  MonsterId: number;
  Area: string;
  Time: "Day" | "Night" | null;
  Where: string | null;
  Boss?: boolean;
  Map: string;
  X: number;
  Y: number;
};

const byNumber = new Map(SPECIES.map((monster) => [monster.monsterId, monster]));

export const SCOUT_POINTS: ScoutPoint[] = (pointRows as RawPoint[]).flatMap((row) => {
  const monster = byNumber.get(row.MonsterId);
  if (!monster) return [];
  return [
    {
      monsterId: row.MonsterId,
      id: monster.id,
      name: monster.name,
      area: row.Area,
      time: row.Time,
      where: row.Where,
      boss: row.Boss === true,
      map: row.Map,
      x: row.X,
      y: row.Y,
    },
  ];
});

export function pointsFor(id: string, area?: string): ScoutPoint[] {
  return SCOUT_POINTS.filter((point) => point.id === id && (!area || point.area === area));
}

export function pointLine(point: ScoutPoint): string {
  const when = point.time ?? "Day and night";
  const line = point.where ? `${point.area} · ${when} · ${point.where}` : `${point.area} · ${when}`;
  return point.boss ? `${line} · Zone boss` : line;
}
