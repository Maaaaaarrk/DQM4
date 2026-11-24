import pointRows from "@/data/dqm4/ScoutPoint.json";
import { SPECIES } from "@/lib/monsters";

export type ScoutFollower = {
  monsterId: number;
  id: string;
  name: string;
};

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
  /** Extra bodies on this anchor, in slot order. They share the leader's coordinate. */
  followers: ScoutFollower[];
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
  Followers?: number[];
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
      followers: (row.Followers ?? []).flatMap((monsterId) => {
        const follower = byNumber.get(monsterId);
        if (!follower) return [];
        return [{ monsterId, id: follower.id, name: follower.name }];
      }),
    },
  ];
});

export function pointInvolves(point: { id: string; followers: readonly { id: string }[] }, id: string): boolean {
  return point.id === id || point.followers.some((follower) => follower.id === id);
}

function sameAnchor(a: { map: string; x: number; y: number }, b: { map: string; x: number; y: number }): boolean {
  return a.map === b.map && a.x === b.x && a.y === b.y;
}

export function pointsFor(id: string, area?: string): ScoutPoint[] {
  return SCOUT_POINTS.filter((point) => pointInvolves(point, id) && (!area || point.area === area));
}

function nameList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

const COUNT_WORD = ["", "one", "two", "three"];

/** The monsters that spawn with this leader. Empty when the anchor is one body. */
export function followedLine(point: ScoutPoint): string {
  if (!point.followers.length) return "";
  const counts = new Map<string, number>();
  for (const follower of point.followers) counts.set(follower.name, (counts.get(follower.name) ?? 0) + 1);
  const labels = [...counts].map(([name, count]) => {
    if (name === point.name) return count === 1 ? `another ${name}` : `${COUNT_WORD[count] ?? count} more ${name}`;
    return count === 1 ? name : `${COUNT_WORD[count] ?? count} ${name}`;
  });
  return `Followed by ${nameList(labels)}.`;
}

export function leaderDetail(point: ScoutPoint): string {
  const place = pointLine(point);
  const extra = followedLine(point);
  return extra ? `${place}. ${extra}` : place;
}

function nightPlace(where: string | null): string {
  if (where === "Low air") return " in low air";
  if (where === "Underground") return " underground";
  if (where === "In water") return " in the water";
  return "";
}

function nightSwapLine(night: ScoutPoint): string {
  const place = nightPlace(night.where);
  const followed = followedLine(night).replace(/\.$/, "");
  if (!followed) return `At night, ${night.name} leads${place}.`;
  const bodies = followed.replace(/^Followed by /, "");
  return `At night, ${night.name} leads${place}, followed by ${bodies}.`;
}

/** Day copy names the night group that uses this same anchor. */
export function anchorDetail(point: ScoutPoint): string {
  const line = leaderDetail(point);
  if (point.time !== "Day") return line;
  const night = SCOUT_POINTS.find((other) => other.time === "Night" && sameAnchor(other, point));
  if (!night) return line;
  const sentence = line.endsWith(".") ? line : `${line}.`;
  return `${sentence} ${nightSwapLine(night)}`;
}

export function followerDetail(point: ScoutPoint, follower: ScoutFollower): string {
  const place = point.where ? `${point.area} · ${point.time ?? "Day and night"} · ${point.where}` : `${point.area} · ${point.time ?? "Day and night"}`;
  if (follower.name === point.name) return `Another ${follower.name} follows the leader here. ${place}.`;
  return `Follows ${point.name}. ${place}.`;
}

export function pointLine(point: ScoutPoint): string {
  const when = point.time ?? "Day and night";
  const line = point.where ? `${point.area} · ${when} · ${point.where}` : `${point.area} · ${when}`;
  return point.boss ? `${line} · Zone boss` : line;
}
