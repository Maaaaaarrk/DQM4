import portraitIds from "@/data/dqm4/portrait-ids.json";
import { FamilyIcon } from "@/components/family-icon";
import type { MapLabel } from "@/lib/game-maps";
import type { MapMarker } from "@/lib/map-markers";
import type { Family } from "@/lib/monsters";
import { cn, publicAsset } from "@/lib/utils";

const HAVE_PORTRAIT = new Set(portraitIds as string[]);

export type MapMarks = "portrait" | "dot";

const SPRITE = {
  flower: "maps/icons/flower.png",
  tree: "maps/icons/tree.png",
  cave: "maps/icons/cave.png",
} as const;

export type MapPin = {
  key: string;
  id: string;
  family: Family;
  x: number;
  y: number;
  hot: boolean;
  boss: boolean;
  picked: boolean;
  name: string;
  detail: string;
};

export function MapMarkToggle({
  value,
  onChange,
  tone = "gold",
}: {
  value: MapMarks;
  onChange: (value: MapMarks) => void;
  tone?: "gold" | "chrome";
}) {
  const onChrome = tone === "gold";
  return (
    <div role="group" aria-label="Location marks" className={cn("inline-flex rounded-md border-2 p-0.5", onChrome ? "border-gold" : "border-chrome")}>
      {(
        [
          ["portrait", "Portraits"],
          ["dot", "Dots"],
        ] as const
      ).map(([mode, label]) => {
        const on = value === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded px-2 py-0.5 font-display text-xs font-extrabold",
              onChrome
                ? on
                  ? "bg-gold text-chrome"
                  : "text-gold"
                : on
                  ? "bg-chrome text-gold"
                  : "text-chrome",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

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

function PinPortrait({ pin, px }: { pin: MapPin; px: number }) {
  if (!HAVE_PORTRAIT.has(pin.id)) {
    return <FamilyIcon family={pin.family} size="sm" framed={false} />;
  }
  return (
    <img
      src={publicAsset(`portraits/${pin.id}.png`)}
      alt=""
      width={px}
      height={px}
      draggable={false}
      className="block object-contain"
      style={{ width: px, height: px }}
    />
  );
}

function SpawnPins({
  pins,
  compact,
  marks,
  onPick,
}: {
  pins: readonly MapPin[];
  compact: boolean;
  marks: MapMarks;
  onPick?: (key: string) => void;
}) {
  const ordered = [...pins].sort((a, b) => Number(a.hot) - Number(b.hot) || Number(a.picked) - Number(b.picked));
  return ordered.map((pin) => {
    const portrait = marks === "portrait";
    if (compact) {
      return portrait ? (
        <span
          key={pin.key}
          className={cn(
            "pointer-events-none absolute z-30 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-sm bg-parchment ring-1 ring-white",
            pin.boss && "ring-rank",
          )}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <PinPortrait pin={pin} px={14} />
        </span>
      ) : (
        <span
          key={pin.key}
          className={cn(
            "pointer-events-none absolute z-30 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-chrome",
            pin.boss ? "bg-rank" : "bg-gold",
          )}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        />
      );
    }
    return (
      <button
        key={pin.key}
        type="button"
        aria-label={`${pin.name}. ${pin.detail}`}
        aria-pressed={pin.picked}
        onClick={() => onPick?.(pin.key)}
        className={cn(
          "absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          portrait
            ? pin.picked
              ? "z-40 size-11"
              : pin.hot
                ? "size-9"
                : "size-7"
            : pin.picked
              ? "z-40 size-8"
              : pin.hot
                ? "size-6"
                : "size-4",
        )}
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      >
        {portrait ? (
          <span
            data-pin=""
            className={cn(
              "grid place-items-center overflow-hidden rounded-md bg-parchment ring-2 ring-white shadow-[0_0_0_1px_var(--color-gold-ring)]",
              pin.boss && "shadow-[0_0_0_2px_var(--color-rank)]",
              pin.picked && "ring-gold",
              !pin.hot && "opacity-70",
            )}
          >
            <PinPortrait pin={pin} px={pin.picked ? 36 : pin.hot ? 28 : 20} />
          </span>
        ) : (
          <span
            data-pin=""
            className={cn(
              "rounded-full border-2 border-chrome",
              pin.hot ? "size-3.5" : "size-2",
              pin.boss ? "bg-rank" : pin.hot ? "bg-gold" : "bg-parchment/80",
              pin.picked && "ring-2 ring-parchment",
            )}
          />
        )}
      </button>
    );
  });
}

export function MapView({
  src,
  markers,
  labels,
  pins = [],
  onPick,
  compact = false,
  fit = false,
  marks = "portrait",
}: {
  src: string;
  markers: readonly MapMarker[];
  labels: readonly MapLabel[];
  pins?: readonly MapPin[];
  onPick?: (key: string) => void;
  compact?: boolean;
  fit?: boolean;
  marks?: MapMarks;
}) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl border-2 border-gold-ring bg-chrome"
      style={fit ? { width: "min(100cqw, 100cqh)", aspectRatio: "1" } : undefined}
    >
      <img src={publicAsset(src)} alt="" className={cn("block", fit ? "h-full w-full" : "w-full")} />
      <MapMarkers markers={markers} compact={compact} />
      <SpawnPins pins={pins} compact={compact} marks={marks} onPick={onPick} />
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
