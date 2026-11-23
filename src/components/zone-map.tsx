import type { MapLabel } from "@/lib/game-maps";
import type { MapMarker } from "@/lib/map-markers";
import { cn, publicAsset } from "@/lib/utils";

const SPRITE = {
  flower: "maps/icons/flower.png",
  tree: "maps/icons/tree.png",
  cave: "maps/icons/cave.png",
} as const;

export type MapPin = {
  key: string;
  x: number;
  y: number;
  hot: boolean;
  boss: boolean;
  picked: boolean;
  name: string;
  detail: string;
};

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

function SpawnPins({
  pins,
  compact,
  onPick,
}: {
  pins: readonly MapPin[];
  compact: boolean;
  onPick?: (key: string) => void;
}) {
  const ordered = [...pins].sort((a, b) => Number(a.hot) - Number(b.hot) || Number(a.picked) - Number(b.picked));
  return ordered.map((pin) =>
    compact ? (
      <span
        key={pin.key}
        className={cn(
          "pointer-events-none absolute z-30 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-chrome",
          pin.boss ? "bg-rank" : "bg-gold",
        )}
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      />
    ) : (
      <button
        key={pin.key}
        type="button"
        aria-label={`${pin.name}. ${pin.detail}`}
        aria-pressed={pin.picked}
        onClick={() => onPick?.(pin.key)}
        className={cn(
          "absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          pin.picked ? "z-40 size-8" : pin.hot ? "size-6" : "size-4",
        )}
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      >
        <span
          data-pin=""
          className={cn(
            "rounded-full border-2 border-chrome",
            pin.hot ? "size-3.5" : "size-2",
            pin.boss ? "bg-rank" : pin.hot ? "bg-gold" : "bg-parchment/80",
            pin.picked && "ring-2 ring-parchment",
          )}
        />
      </button>
    ),
  );
}

export function MapView({
  src,
  markers,
  labels,
  pins = [],
  onPick,
  compact = false,
  fit = false,
}: {
  src: string;
  markers: readonly MapMarker[];
  labels: readonly MapLabel[];
  pins?: readonly MapPin[];
  onPick?: (key: string) => void;
  compact?: boolean;
  fit?: boolean;
}) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl border-2 border-gold-ring bg-chrome"
      style={fit ? { width: "min(100cqw, 100cqh)", aspectRatio: "1" } : undefined}
    >
      <img src={publicAsset(src)} alt="" className={cn("block", fit ? "h-full w-full" : "w-full")} />
      <MapMarkers markers={markers} compact={compact} />
      <SpawnPins pins={pins} compact={compact} onPick={onPick} />
      {compact
        ? null
        : labels.map((label) => (
            <span
              key={label.name}
              className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 rounded-md bg-chrome px-1.5 py-0.5 font-display text-xs font-extrabold text-gold"
              style={{ left: `${label.x}%`, top: `${label.y}%` }}
            >
              {label.name}
            </span>
          ))}
    </div>
  );
}
