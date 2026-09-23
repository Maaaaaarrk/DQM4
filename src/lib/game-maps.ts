import { FIELD_MARKERS, SHRINE_MARKERS, SPELUNK_MARKERS, type MapMarker } from "@/lib/map-markers";

export type MapLabel = { name: string; x: number; y: number };

export type GameMap = {
  id: string;
  title: string;
  src: string;
  markers: readonly MapMarker[];
  labels: readonly MapLabel[];
};

const FIELD_LABELS: MapLabel[] = [
  { name: "The Sogswamp", x: 51.41, y: 17.17 },
  { name: "Witherwood Plains", x: 47.11, y: 43.82 },
  { name: "The Parchland", x: 47.31, y: 73.54 },
];

const FIELD_TITLE = "The Parchland, Witherwood Plains, The Sogswamp";
const SHRINE = "Shrine of Serenity, Interior";

export const GAME_MAPS: GameMap[] = [
  { id: "field", title: FIELD_TITLE, src: "maps/field.png", markers: FIELD_MARKERS, labels: FIELD_LABELS },
  { id: "spelunk", title: "The Spelunk", src: "maps/spelunk.png", markers: SPELUNK_MARKERS, labels: [] },
  { id: "shrine-1", title: SHRINE, src: "maps/shrine-1.png", markers: SHRINE_MARKERS, labels: [] },
  { id: "shrine-2", title: SHRINE, src: "maps/shrine-2.png", markers: [], labels: [] },
  { id: "shrine-3", title: SHRINE, src: "maps/shrine-3.png", markers: [], labels: [] },
  { id: "town", title: "Town", src: "maps/town.png", markers: [], labels: [] },
  { id: "castle-00", title: "Castle", src: "maps/castle-00.png", markers: [], labels: [] },
  { id: "castle-01", title: "Castle", src: "maps/castle-01.png", markers: [], labels: [] },
  { id: "castle-02", title: "Castle", src: "maps/castle-02.png", markers: [], labels: [] },
  { id: "castle-03", title: "Castle", src: "maps/castle-03.png", markers: [], labels: [] },
  { id: "house-00", title: "House", src: "maps/house-00.png", markers: [], labels: [] },
  { id: "house-01", title: "House", src: "maps/house-01.png", markers: [], labels: [] },
  { id: "house-02", title: "House", src: "maps/house-02.png", markers: [], labels: [] },
  { id: "house-03", title: "House", src: "maps/house-03.png", markers: [], labels: [] },
  { id: "bar", title: "Bar", src: "maps/bar.png", markers: [], labels: [] },
  { id: "shop", title: "Shop", src: "maps/shop.png", markers: [], labels: [] },
  { id: "medal", title: "Mini Medal Swap Shop", src: "maps/medal.png", markers: [], labels: [] },
  { id: "arena", title: "Arena", src: "maps/arena.png", markers: [], labels: [] },
  { id: "farm", title: "Farm", src: "maps/farm.png", markers: [], labels: [] },
  { id: "safari", title: "Safari", src: "maps/safari.png", markers: [], labels: [] },
];

/** Campaign area name to the map that opens from the timeline. Add new zones here. */
const AREA_MAP: Record<string, string> = {
  "The Parchland": "field",
  "Witherwood Plains": "field",
  "The Sogswamp": "field",
  "The Spelunk": "spelunk",
  "Shrine of Serenity, Interior": "shrine-1",
};

export function mapForArea(area: string): string | null {
  return AREA_MAP[area] ?? null;
}

export function mapById(id: string): GameMap | null {
  return GAME_MAPS.find((map) => map.id === id) ?? null;
}
