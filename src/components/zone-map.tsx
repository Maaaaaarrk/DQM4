import type { MapLabel } from "@/lib/game-maps";
import type { MapMarker } from "@/lib/map-markers";
import { cn, publicAsset } from "@/lib/utils";

const SPRITE = {
  flower: "maps/icons/flower.png",
  tree: "maps/icons/tree.png",
  cave: "maps/icons/cave.png",
} as const;

function MapMarkers({ markers, compact }: { markers: readonly MapMarker[]; compact: boolean }) {
  return markers.map((marker) => (
    <span
      key={`${marker.kind}-${marker.x}-${marker.y}`}
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${marker.x}%`, top: `${marker.y}%`, width: "6%" }}
    >
      <img
        src={publicAsset(SPRITE[marker.kind])}
        alt=""
        className="w-full [image-rendering:pixelated]"
      />
      {marker.short && !compact ? (
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-chrome px-1.5 py-0.5 font-display text-xs font-extrabold text-gold",
            marker.side === "right" ? "left-full ml-1" : "right-full mr-1",
          )}
        >
          {marker.short}
        </span>
      ) : null}
    </span>
  ));
}

export function MapView({
  src,
  markers,
  labels,
  compact = false,
}: {
  src: string;
  markers: readonly MapMarker[];
  labels: readonly MapLabel[];
  compact?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-gold-ring bg-chrome">
      <img src={publicAsset(src)} alt="" className="block w-full" />
      <MapMarkers markers={markers} compact={compact} />
      {compact
        ? null
        : labels.map((label) => (
        <span
          key={label.name}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-md bg-chrome px-1.5 py-0.5 font-display text-xs font-extrabold text-gold"
          style={{ left: `${label.x}%`, top: `${label.y}%` }}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}
