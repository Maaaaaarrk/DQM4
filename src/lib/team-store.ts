import { encodeLineup, emptySlots, parseLineup, type Slots } from "@/lib/team";

export type TeamSave = {
  progress: number;
  /** @deprecated Species ids from older saves. Ignored so one flag does not mark every copy. */
  have: string[];
  /** Have-it paths keyed by party slot (`main:0`). Each tree keeps its own flags. */
  trees: Record<string, string[]>;
  /** Family-slot picks keyed by party slot, then pedigree path. */
  picks: Record<string, Record<string, string>>;
  main: string;
  reserve: string;
};

function readTrees(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue;
    const paths = list.filter((item): item is string => typeof item === "string");
    if (paths.length) out[key] = paths;
  }
  return out;
}

function readPicks(value: unknown): Record<string, Record<string, string>> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, Record<string, string>> = {};
  for (const [slot, map] of Object.entries(value as Record<string, unknown>)) {
    if (!map || typeof map !== "object" || Array.isArray(map)) continue;
    const paths: Record<string, string> = {};
    for (const [path, id] of Object.entries(map)) {
      if (typeof id === "string" && id) paths[path] = id;
    }
    if (Object.keys(paths).length) out[slot] = paths;
  }
  return out;
}

const DB_NAME = "synthline";
const STORE = "team";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadTeam(): Promise<TeamSave | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get("planner");
    request.onsuccess = () => {
      const raw = request.result as Partial<TeamSave> | undefined;
      if (!raw) {
        resolve(null);
        return;
      }
      resolve({
        progress: typeof raw.progress === "number" ? raw.progress : 0,
        have: [],
        trees: readTrees(raw.trees),
        picks: readPicks(raw.picks),
        main: typeof raw.main === "string" ? raw.main : "",
        reserve: typeof raw.reserve === "string" ? raw.reserve : "",
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveTeam(save: TeamSave): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(save, "planner");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function slotsFromSave(value: string | undefined): Slots {
  if (!value) return emptySlots();
  return parseLineup(value);
}

export function saveFromSlots(slots: Slots): string {
  return encodeLineup(slots);
}
