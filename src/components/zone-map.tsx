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

export type MapPartyMember = {
  key: string;
  id: string;
  family: Family;
  name: string;
  detail: string;
  picked: boolean;
  hot: boolean;
};

export type MapFace = {
  key: string;
  id: string;
  family: Family;
  name: string;
  detail: string;
  picked: boolean;
  hot: boolean;
};

export type MapPin = {
  key: string;
  id: string;
  family: Family;
  x: number;
  y: number;
  hot: boolean;
  boss: boolean;
  bush: boolean;
  picked: boolean;
  name: string;
  detail: string;
  /** Followers share this anchor. Drawn beside the leader, not at their own coordinate. */
  party?: readonly MapPartyMember[];
  /** Night leader for this same anchor. Shares the day portrait, on the right of the slash. */
  night?: MapFace;
};

/** Offsets from the leader, in rem. The game stores a distance, not an angle, so these stay on the anchor. */
const FOLLOWER_SEATS: { x: string; y: string }[][] = [
  [{ x: "1.15rem", y: "0.95rem" }],
  [
    { x: "-1.45rem", y: "1rem" },
    { x: "1.45rem", y: "1rem" },
  ],
  [
    { x: "-1.55rem", y: "1.15rem" },
    { x: "0rem", y: "1.45rem" },
    { x: "1.55rem", y: "1.15rem" },
  ],
];

/** A chance spawn with no coordinate. Drawn under the zone name, not on a pin. */
export type MapFloat = {
  key: string;
  id: string;
  family: Family;
  name: string;
  detail: string;
  area: string;
  picked: boolean;
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

function PinPortrait({ pin, px }: { pin: { id: string; family: Family }; px: number }) {
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

function GrassTray({
  label,
  floats,
  marks,
  onPick,
}: {
  label: MapLabel;
  floats: readonly MapFloat[];
  marks: MapMarks;
  onPick?: (id: string) => void;
}) {
  if (!floats.length) return null;
  const portrait = marks === "portrait";
  const rows = [...floats].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div
      className="absolute z-50 flex -translate-x-1/2 items-center gap-0.5"
      style={{ left: `${label.x}%`, top: `calc(${label.y}% + 0.85rem)` }}
    >
      {rows.map((float) => (
        <button
          key={float.key}
          type="button"
          aria-label={`${float.name}. ${float.detail}`}
          aria-pressed={float.picked}
          onClick={() => onPick?.(float.id)}
          className={cn(
            "grid size-[clamp(1.15rem,8cqmin,2.25rem)] shrink-0 place-items-center overflow-hidden rounded-sm border-2 border-grass bg-parchment shadow-[0_0_0_2px_var(--color-chrome)]",
            float.picked && "ring-2 ring-gold",
          )}
        >
          {portrait ? (
            HAVE_PORTRAIT.has(float.id) ? (
              <img
                src={publicAsset(`portraits/${float.id}.png`)}
                alt=""
                draggable={false}
                className="size-full object-contain"
              />
            ) : (
              <FamilyIcon family={float.family} size="sm" framed={false} />
            )
          ) : (
            <span className="size-1/2 rounded-sm bg-grass" />
          )}
        </button>
      ))}
    </div>
  );
}

function SplitHalf({
  face,
  portrait,
  onPick,
}: {
  face: MapFace;
  portrait: boolean;
  onPick?: (key: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${face.name}. ${face.detail}`}
      aria-pressed={face.picked}
      onClick={() => onPick?.(face.key)}
      className="min-h-0 min-w-0 overflow-hidden"
    >
      {portrait ? (
        HAVE_PORTRAIT.has(face.id) ? (
          <img
            src={publicAsset(`portraits/${face.id}.png`)}
            alt=""
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <FamilyIcon family={face.family} size="sm" framed={false} />
          </span>
        )
      ) : (
        <span className="grid size-full place-items-center">
          <span className={cn("size-1.5 rounded-full", face.hot ? "bg-gold" : "bg-parchment/80")} />
        </span>
      )}
    </button>
  );
}

/** Gold slash from the top edge to the bottom edge, with a dark edge so it reads on both portraits. */
function FrameSlash() {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 z-10 size-full">
      <line x1="75" y1="-20" x2="25" y2="120" className="stroke-chrome" strokeWidth="12" />
      <line x1="75" y1="-20" x2="25" y2="120" className="stroke-gold" strokeWidth="6" />
    </svg>
  );
}

/** One portrait square. Day fills the left half, night the right, and the slash crosses the frame. */
function SplitPin({ pin, portrait, onPick }: { pin: MapPin; portrait: boolean; onPick?: (key: string) => void }) {
  const night = pin.night;
  if (!night) return null;
  const day: MapFace = {
    key: pin.key,
    id: pin.id,
    family: pin.family,
    name: pin.name,
    detail: pin.detail,
    picked: pin.picked,
    hot: pin.hot,
  };
  const picked = pin.picked || night.picked;
  const hot = pin.hot || night.hot;
  return (
    <div
      data-pin=""
      className={cn(
        "relative z-10 overflow-hidden",
        leaderSize({ ...pin, picked, hot }, portrait),
        portrait
          ? cn(
              "rounded-md bg-parchment ring-2 ring-white shadow-[0_0_0_1px_var(--color-gold-ring)]",
              picked && "ring-2 ring-gold",
              !hot && "opacity-70",
            )
          : cn(
              "rounded-full border-2 border-chrome bg-chrome",
              picked && "ring-2 ring-parchment",
              !hot && "opacity-70",
            ),
      )}
    >
      <div className="absolute inset-0 grid grid-cols-2">
        <SplitHalf face={day} portrait={portrait} onPick={onPick} />
        <SplitHalf face={night} portrait={portrait} onPick={onPick} />
      </div>
      <FrameSlash />
    </div>
  );
}

function leaderSize(pin: MapPin, portrait: boolean): string {
  const grouped = (pin.party?.length ?? 0) > 0;
  const shown = pin.hot || grouped;
  if (portrait) {
    if (pin.boss) return "size-14";
    if (pin.picked) return "size-11";
    if (shown) return "size-9";
    return "size-7";
  }
  if (pin.boss) return "size-10";
  if (pin.picked) return "size-8";
  if (shown) return "size-6";
  return "size-4";
}

function leaderPx(pin: MapPin): number {
  const grouped = (pin.party?.length ?? 0) > 0;
  if (pin.boss) return 48;
  if (pin.picked) return 36;
  if (pin.hot || grouped) return 28;
  return 20;
}

function FollowerMark({
  member,
  seat,
  anchor,
  portrait,
  onPick,
}: {
  member: MapPartyMember;
  seat: { x: string; y: string };
  anchor: { x: number; y: number };
  portrait: boolean;
  onPick?: (key: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`${member.name}. ${member.detail}`}
      aria-pressed={member.picked}
      onClick={() => onPick?.(member.key)}
      className={cn(
        "absolute z-40 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
        portrait ? (member.picked ? "size-7" : member.hot ? "size-6" : "size-5") : member.picked ? "size-5" : "size-4",
      )}
      style={{ left: `calc(${anchor.x}% + ${seat.x})`, top: `calc(${anchor.y}% + ${seat.y})` }}
    >
      {portrait ? (
        <span
          data-pin=""
          className={cn(
            "grid place-items-center overflow-hidden rounded-md bg-parchment ring-2 ring-white shadow-[0_0_0_1px_var(--color-gold-ring)]",
            member.picked && "ring-2 ring-gold",
            !member.hot && "opacity-70",
          )}
        >
          <PinPortrait pin={member} px={member.picked ? 22 : member.hot ? 18 : 14} />
        </span>
      ) : (
        <span
          data-pin=""
          className={cn(
            "rounded-full border-2 border-chrome",
            member.hot ? "size-2 bg-gold" : "size-1.5 bg-parchment/80",
            member.picked && "ring-2 ring-parchment",
          )}
        />
      )}
    </button>
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
  const ordered = [...pins].sort(
    (a, b) =>
      Number(a.bush) - Number(b.bush) ||
      Number(a.hot) - Number(b.hot) ||
      Number(a.picked) - Number(b.picked) ||
      a.y - b.y,
  );
  return ordered.map((pin) => {
    const portrait = marks === "portrait";
    const party = pin.party ?? [];
    const raised = pin.boss || pin.picked || pin.night?.picked || party.some((member) => member.picked);
    if (compact) {
      return portrait ? (
        <span
          key={pin.key}
          className={cn(
            "pointer-events-none absolute z-30 grid -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-sm bg-parchment",
            pin.boss ? "z-40 size-6 border-2 border-elite" : pin.bush ? "z-30 size-4 border-2 border-bush" : "size-4 ring-1 ring-white",
          )}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <PinPortrait pin={pin} px={pin.bush ? 18 : 14} />
        </span>
      ) : (
        <span
          key={pin.key}
          className={cn(
            "pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 border border-chrome",
            pin.boss
              ? "z-40 size-3 rounded-full border-2 border-elite bg-gold"
              : pin.bush
                ? "size-1.5 rounded-full border border-bush bg-bush"
                : "size-1.5 rounded-full bg-gold",
          )}
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        />
      );
    }
    const leader = pin.night ? (
      <SplitPin pin={pin} portrait={portrait} onPick={onPick} />
    ) : (
      <button
        type="button"
        aria-label={`${pin.name}. ${pin.detail}`}
        aria-pressed={pin.picked}
        onClick={() => onPick?.(pin.key)}
        className={cn("relative z-10 flex items-center justify-center", leaderSize(pin, portrait))}
      >
        {portrait ? (
          <span
            data-pin=""
            className={cn(
              "grid place-items-center overflow-hidden rounded-md bg-parchment",
              pin.boss
                ? "border-4 border-elite shadow-[0_0_0_3px_var(--color-chrome)]"
                : pin.bush
                  ? "border-2 border-bush"
                  : "ring-2 ring-white shadow-[0_0_0_1px_var(--color-gold-ring)]",
              pin.picked && "ring-2 ring-gold",
              !pin.hot && "opacity-70",
            )}
          >
            <PinPortrait pin={pin} px={leaderPx(pin)} />
          </span>
        ) : (
          <span
            data-pin=""
            className={cn(
              "rounded-full",
              pin.boss
                ? "size-8 border-4 border-elite bg-gold"
                : pin.bush
                  ? "size-3.5 border-2 border-bush bg-bush"
                  : pin.hot || party.length
                    ? "size-3.5 border-2 border-chrome bg-gold"
                    : "size-2 border-2 border-chrome bg-parchment/80",
              pin.picked && "ring-2 ring-parchment",
              !pin.hot && party.length > 0 && "opacity-70",
            )}
          />
        )}
      </button>
    );
    return (
      <div
        key={pin.key}
        className={cn("absolute -translate-x-1/2 -translate-y-1/2", raised ? "z-40" : "z-30")}
        style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      >
        {leader}
      </div>
    );
  });
}

function FollowerPins({
  pins,
  marks,
  onPick,
}: {
  pins: readonly MapPin[];
  marks: MapMarks;
  onPick?: (key: string) => void;
}) {
  const portrait = marks === "portrait";
  return pins.flatMap((pin) => {
    const party = pin.party ?? [];
    const seats = FOLLOWER_SEATS[party.length - 1] ?? [];
    return party.map((member, index) => {
      const seat = seats[index] ?? { x: "1.15rem", y: "0.95rem" };
      return (
      <FollowerMark
        key={member.key}
        member={member}
        seat={seat}
        anchor={pin}
        portrait={portrait}
        onPick={onPick}
      />
      );
    });
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
  hotLabels = [],
  floats = [],
  onFloat,
}: {
  src: string;
  markers: readonly MapMarker[];
  labels: readonly MapLabel[];
  pins?: readonly MapPin[];
  onPick?: (key: string) => void;
  compact?: boolean;
  fit?: boolean;
  marks?: MapMarks;
  /** Area names to mark as the place to shake grass. */
  hotLabels?: readonly string[];
  /** Chance spawns with no coordinate, grouped under the zone name. */
  floats?: readonly MapFloat[];
  onFloat?: (id: string) => void;
}) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl border-2 border-gold-ring bg-chrome"
      style={fit ? { width: "min(100cqw, 100cqh)", aspectRatio: "1" } : undefined}
    >
      <img src={publicAsset(src)} alt="" className={cn("block", fit ? "h-full w-full" : "w-full")} />
      {/* The picture sets the frame size. A size container on this frame collapses that picture. */}
      <div className="@container absolute inset-0">
        <MapMarkers markers={markers} compact={compact} />
        <SpawnPins pins={pins.filter((pin) => !pin.bush && !pin.boss)} compact={compact} marks={marks} onPick={onPick} />
        {compact ? null : <FollowerPins pins={pins.filter((pin) => !pin.bush)} marks={marks} onPick={onPick} />}
        <SpawnPins pins={pins.filter((pin) => pin.boss)} compact={compact} marks={marks} onPick={onPick} />
        {compact
          ? null
          : labels
              .filter((label) => !hotLabels.includes(label.name))
              .map((label) => (
                <span
                  key={label.name}
                  className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 rounded-md bg-chrome px-1.5 py-0.5 font-display text-xs font-extrabold text-gold"
                  style={{ left: `${label.x}%`, top: `${label.y}%` }}
                >
                  {label.name}
                </span>
              ))}
        <SpawnPins pins={pins.filter((pin) => pin.bush)} compact={compact} marks={marks} onPick={onPick} />
        {compact
          ? null
          : labels
              .filter((label) => hotLabels.includes(label.name))
              .map((label) => (
                <span
                  key={label.name}
                  className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-chrome bg-gold px-1.5 py-0.5 font-display text-xs font-extrabold text-chrome"
                  style={{ left: `${label.x}%`, top: `${label.y}%` }}
                >
                  {label.name}
                </span>
              ))}
        {compact
          ? null
          : labels.map((label) => (
              <GrassTray
                key={`grass-${label.name}`}
                label={label}
                floats={floats.filter((float) => float.area === label.name)}
                marks={marks}
                onPick={onFloat}
              />
            ))}
      </div>
    </div>
  );
}
