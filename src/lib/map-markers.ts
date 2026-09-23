export type MapMarker = {
  kind: "flower" | "tree" | "cave";
  x: number;
  y: number;
  area?: string;
  short?: string;
  side?: "left" | "right";
};

export const FIELD_MARKERS: MapMarker[] = [
  { kind: "cave", x: 89.71, y: 9.26, area: "Shrine of Serenity, Interior", short: "Shrine", side: "left" },
  { kind: "cave", x: 3.57, y: 75.83, area: "The Spelunk", short: "Spelunk", side: "right" },
  { kind: "tree", x: 81.61, y: 7.02 },
  { kind: "tree", x: 18.84, y: 10.03 },
  { kind: "tree", x: 90.98, y: 27.75 },
  { kind: "tree", x: 6.73, y: 78.05 },
  { kind: "tree", x: 45.14, y: 25.52 },
  { kind: "tree", x: 52.98, y: 55.48 },
  { kind: "tree", x: 91.69, y: 93.18 },
  { kind: "tree", x: 12.99, y: 45.23 },
  { kind: "flower", x: 78.52, y: 24.17 },
  { kind: "flower", x: 65.36, y: 40.69 },
  { kind: "flower", x: 59.8, y: 28.39 },
  { kind: "flower", x: 87.24, y: 92.33 },
  { kind: "flower", x: 75.48, y: 72.31 },
  { kind: "flower", x: 8.07, y: 25.71 },
  { kind: "flower", x: 36.98, y: 57.86 },
  { kind: "flower", x: 90.6, y: 52.31 },
  { kind: "flower", x: 38.48, y: 91.5 },
  { kind: "flower", x: 20.07, y: 88.81 },
  { kind: "flower", x: 13.93, y: 6.38 },
  { kind: "flower", x: 51.67, y: 9.52 },
  { kind: "flower", x: 13.36, y: 70.45 },
  { kind: "flower", x: 69.05, y: 10.57 },
  { kind: "flower", x: 37.07, y: 21.52 },
];

export const SPELUNK_MARKERS: MapMarker[] = [{ kind: "tree", x: 29.97, y: 55.17 }];

export const SHRINE_MARKERS: MapMarker[] = [{ kind: "tree", x: 77.96, y: 50.04 }];
