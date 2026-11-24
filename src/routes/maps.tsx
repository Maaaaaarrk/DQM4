import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { MapMarkToggle, MapView, type MapFloat, type MapMarks, type MapPin } from "@/components/zone-map";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { GAME_MAPS, mapById } from "@/lib/game-maps";
import { MONSTERS } from "@/lib/monsters";
import { BUSH_LIST, BUSH_SPOTS, bushDetail, grassDetail, grassOdds, grassSide, type BushOdd } from "@/lib/bush-spots";
import { anchorDetail, followerDetail, pointInvolves, SCOUT_POINTS, type ScoutFollower, type ScoutPoint } from "@/lib/scout-points";
import { cn } from "@/lib/utils";

const AREAS = new Set(SCOUT_POINTS.map((point) => point.area));
const MAPS_WITH_SPAWNS = new Set(SCOUT_POINTS.map((point) => point.map));

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => {
    const map = typeof search.map === "string" ? search.map : "";
    const area = typeof search.area === "string" ? search.area : "";
    const monsters = typeof search.monsters === "string" ? search.monsters : "";
    return {
      map: mapById(map) ? map : "",
      area: AREAS.has(area) ? area : "",
      monsters: monsters
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id in MONSTERS)
        .join(","),
    };
  },
  component: MapsPage,
});

function emptySearch() {
  return { map: "", area: "", monsters: "" };
}

type When = "all" | "day" | "night";

type MapSpot = {
  monsterId: number;
  id: string;
  name: string;
  area: string;
  time: ScoutPoint["time"];
  where: string | null;
  boss: boolean;
  bush: boolean;
  map: string;
  x: number;
  y: number;
  odds: BushOdd[] | null;
  followers: ScoutFollower[];
};

/** Day and night include scouts with no time limit. */
function passesWhen(point: MapSpot, when: When): boolean {
  if (when === "all") return true;
  if (when === "day") return point.time !== "Night";
  return point.time !== "Day";
}

function sameSpot(a: MapSpot, b: MapSpot): boolean {
  return a.map === b.map && a.x === b.x && a.y === b.y;
}

function spotsOn(mapId: string): MapSpot[] {
  const scouts: MapSpot[] = SCOUT_POINTS.filter((point) => point.map === mapId).map((point) => ({
    ...point,
    bush: false,
    odds: null,
  }));
  const bushes: MapSpot[] = BUSH_SPOTS.filter((spot) => spot.map === mapId).map((spot) => ({
    monsterId: spot.monsterId,
    id: spot.id,
    name: spot.name,
    area: spot.area,
    time: null,
    where: null,
    boss: false,
    bush: true,
    map: spot.map,
    x: spot.x,
    y: spot.y,
    odds: spot.odds,
    followers: [],
  }));
  return [...scouts, ...bushes];
}

function withKeys(spots: readonly MapSpot[]): { spot: MapSpot; key: string }[] {
  const seen = new Map<string, number>();
  return spots.map((spot) => {
    const base = `${spot.bush ? "bush" : "scout"}-${spot.monsterId}-${spot.x}-${spot.y}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return { spot, key: count === 0 ? base : `${base}-${count}` };
  });
}

function toPin(
  row: { spot: MapSpot; key: string },
  active: ReadonlySet<string>,
  selectedId: string | null,
  nightRow?: { spot: MapSpot; key: string },
): MapPin {
  const { spot, key } = row;
  const party = spot.followers.map((follower, index) => ({
    key: `${follower.id}@${key}-f${index}`,
    id: follower.id,
    family: MONSTERS[follower.id].family,
    name: follower.name,
    detail: followerDetail(spot, follower),
    picked: follower.id === selectedId && active.has(follower.id),
    hot: active.has(follower.id),
  }));
  const night = nightRow?.spot;
  return {
    key,
    id: spot.id,
    family: MONSTERS[spot.id].family,
    x: spot.x,
    y: spot.y,
    hot: active.has(spot.id),
    boss: spot.boss,
    bush: spot.bush,
    picked: spot.id === selectedId && active.has(spot.id),
    name: spot.name,
    detail: spot.bush && spot.odds ? bushDetail(spot.area, spot.odds) : anchorDetail(spot),
    party: party.length ? party : undefined,
    night: night
      ? {
          key: nightRow.key,
          id: night.id,
          family: MONSTERS[night.id].family,
          name: night.name,
          detail: anchorDetail(night),
          picked: night.id === selectedId && active.has(night.id),
          hot: active.has(night.id),
        }
      : undefined,
  };
}

function pinsFor(
  rows: readonly { spot: MapSpot; key: string }[],
  active: ReadonlySet<string>,
  selectedId: string | null,
  when: When,
): MapPin[] {
  if (when !== "all") return rows.map((row) => toPin(row, active, selectedId));
  return rows.flatMap((row) => {
    if (row.spot.time === "Night" && rows.some((day) => day.spot.time === "Day" && sameSpot(day.spot, row.spot))) return [];
    const night =
      row.spot.time === "Day"
        ? rows.find((other) => other.spot.time === "Night" && sameSpot(other.spot, row.spot))
        : undefined;
    return [toPin(row, active, selectedId, night)];
  });
}

function MapsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();

  function goBack() {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    void navigate({ search: emptySearch(), replace: true });
  }
  const open = mapById(search.map);
  const requested = useMemo(
    () => search.monsters.split(",").filter((id) => id in MONSTERS),
    [search.monsters],
  );
  const [selectedId, setSelectedId] = useState<string | null>(requested.length === 1 ? requested[0] : null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [marks, setMarks] = useState<MapMarks>("portrait");
  const [shown, setShown] = useState<Set<string> | null>(null);
  const [when, setWhen] = useState<When>("all");
  const [scoutsOnly, setScoutsOnly] = useState(true);
  const [grassPick, setGrassPick] = useState(false);

  useEffect(() => {
    setSelectedId(requested.length === 1 ? requested[0] : null);
    setSelectedKey(null);
    setShown(null);
    setWhen("all");
    setGrassPick(false);
  }, [search.map, search.area, search.monsters, requested]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, navigate, router]);

  const keyed = useMemo(() => (open ? withKeys(spotsOn(open.id)) : []), [open]);
  const mapPoints = useMemo(() => keyed.map((row) => row.spot), [keyed]);

  const grassRows = BUSH_LIST.filter(
    (row) => open && row.map === open.id && (!search.area || row.area === search.area),
  );
  const chips = [
    ...new Map(
      [
        ...mapPoints.flatMap((point) => [point.id, ...point.followers.map((follower) => follower.id)]),
        ...grassRows.map((row) => row.id),
      ].map((id) => [id, MONSTERS[id]]),
    ).values(),
  ]
    .filter((monster) => monster)
    .sort((a, b) => a.name.localeCompare(b.name));
  const chipIds = chips.map((monster) => monster.id);
  /** Bush or elite border only when that is the monster's only mark on this view. */
  function chipKind(id: string): "bush" | "elite" | null {
    const points = mapPoints.filter(
      (point) => (!search.area || point.area === search.area) && pointInvolves(point, id),
    );
    const bush = points.some((point) => point.bush && point.id === id);
    const elite = points.some((point) => point.boss && point.id === id);
    const other = points.some((point) => !(point.bush && point.id === id) && !(point.boss && point.id === id));
    if (other || (bush && elite)) return null;
    if (bush) return "bush";
    if (elite) return "elite";
    return null;
  }
  const defaultIds = requested.length ? requested.filter((id) => chipIds.includes(id)) : chipIds;
  const active = shown ?? new Set(defaultIds);

  function spotCount(id: string): number {
    return mapPoints.filter(
      (point) => pointInvolves(point, id) && (!search.area || point.area === search.area) && passesWhen(point, when),
    ).length;
  }

  const allOn = chipIds.length > 0 && chipIds.every((id) => active.has(id));
  const noneOn = chipIds.length > 0 && chipIds.every((id) => !active.has(id));
  const matchedRows = keyed.filter(
    (row) =>
      (!search.area || row.spot.area === search.area) &&
      passesWhen(row.spot, when) &&
      (active.has(row.spot.id) || row.spot.followers.some((follower) => active.has(follower.id))),
  );
  const visibleRows = matchedRows;
  const pins = open ? pinsFor(visibleRows, active, selectedId, when) : [];
  const chosenRow = visibleRows.find((row) => row.key === selectedKey);
  const chosen = chosenRow?.spot ?? null;
  const selectedBushes = visibleRows.filter((row) => row.spot.bush && row.spot.id === selectedId);
  const oddsRow =
    chosen?.bush && chosen.odds
      ? chosen
      : !chosen && selectedId && selectedBushes.length === 1 && visibleRows.filter((row) => row.spot.id === selectedId).length === 1
        ? selectedBushes[0].spot
        : null;
  const hotCount = selectedId ? spotCount(selectedId) : 0;
  const selectedName = selectedId ? MONSTERS[selectedId]?.name : "";
  const missing = requested.filter(
    (id) => !mapPoints.some((point) => pointInvolves(point, id)) && !grassRows.some((row) => row.id === id),
  );
  const pickedGrass = selectedId ? grassRows.filter((row) => row.id === selectedId) : [];
  const explainGrass = Boolean(
    selectedId &&
      selectedName &&
      pickedGrass.length &&
      active.has(selectedId) &&
      (hotCount === 0 || grassPick) &&
      !noneOn,
  );
  const grassFloats: MapFloat[] = noneOn
    ? []
    : grassRows.flatMap((row) => {
          if (!active.has(row.id)) return [];
          const anchored = mapPoints.some(
            (point) => pointInvolves(point, row.id) && point.area === row.area && passesWhen(point, when),
          );
          if (anchored) return [];
          const species = MONSTERS[row.id];
          if (!species) return [];
          return [
            {
              key: `grass-${row.area}-${row.id}`,
              id: row.id,
              family: species.family,
              name: row.name,
              detail: grassDetail(row.area, row.weights),
              area: row.area,
              picked: selectedId === row.id && active.has(row.id),
            },
          ];
        });
  const caption = (() => {
    if (noneOn) return "No monsters selected.";
    if (explainGrass && selectedName) {
      const places = pickedGrass.map((row) => grassDetail(row.area, row.weights)).join(" ");
      return `${selectedName}. ${places} The gold names on the map are where you shake.`;
    }
    const chosenMember = chosenRow ? undefined : pins.find((pin) => pin.party?.some((member) => member.key === selectedKey))?.party?.find((member) => member.key === selectedKey);
    if (chosenMember) return `${chosenMember.name}. ${chosenMember.detail}`;
    if (selectedId && selectedName && hotCount > 0 && active.has(selectedId)) {
      if (oddsRow) return `${selectedName} · ${oddsRow.area} · Bush`;
      return chosen
        ? `${selectedName}. ${chosen.bush && chosen.odds ? bushDetail(chosen.area, chosen.odds) : anchorDetail(chosen)}`
        : `${selectedName} · ${hotCount} ${hotCount === 1 ? "spot" : "spots"}`;
    }
    if (when === "day") return "Scouts you can find in the day.";
    if (when === "night") return "Scouts you can find at night.";
    if (requested.length || search.area) {
      return marks === "portrait" ? "Portraits are the scouts for this stop." : "Gold marks are the scouts for this stop.";
    }
    if (!allOn) return marks === "portrait" ? "Portraits are the monsters you picked." : "Gold marks are the monsters you picked.";
    return "Every scout spot on this map.";
  })();

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <Link
          to="/team"
          search={{ main: "", reserve: "" }}
          className="ml-auto rounded-lg border-2 border-gold px-3 py-1 font-display text-sm font-extrabold text-gold"
        >
          Team planner
        </Link>
      </header>
      <main className="stage-field min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto mb-3 flex w-full max-w-5xl flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Maps" className="inline-flex rounded-md border-2 border-chrome p-0.5">
            <button
              type="button"
              aria-pressed={scoutsOnly}
              onClick={() => setScoutsOnly(true)}
              className={cn(
                "rounded px-2 py-0.5 font-display text-xs font-extrabold",
                scoutsOnly ? "bg-chrome text-gold" : "text-chrome",
              )}
            >
              With scouts
            </button>
            <button
              type="button"
              aria-pressed={!scoutsOnly}
              onClick={() => setScoutsOnly(false)}
              className={cn(
                "rounded px-2 py-0.5 font-display text-xs font-extrabold",
                scoutsOnly ? "text-chrome" : "bg-chrome text-gold",
              )}
            >
              All maps
            </button>
          </div>
          <MapMarkToggle value={marks} onChange={setMarks} tone="chrome" />
        </div>
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {GAME_MAPS.filter((map) => !scoutsOnly || MAPS_WITH_SPAWNS.has(map.id)).map((map) => (
            <li key={map.id}>
              <button
                type="button"
                onClick={() => void navigate({ search: { map: map.id, area: "", monsters: "" } })}
                className="flex h-full w-full flex-col text-left"
              >
                <span className="mb-2 font-display text-sm font-extrabold leading-tight text-chrome">
                  {map.title}
                </span>
                <MapView src={map.src} markers={map.markers} labels={map.labels} compact />
              </button>
            </li>
          ))}
        </ul>
      </main>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={search.area || open.title}
          className="fixed inset-0 z-50 bg-chrome p-3"
        >
          <div className="mx-auto grid h-full min-h-0 w-full max-w-5xl grid-rows-[auto_auto_minmax(0,1fr)] gap-2 rounded-2xl bg-chrome p-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 font-display text-base font-extrabold text-gold">{search.area || open.title}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <MapMarkToggle value={marks} onChange={setMarks} />
                <button
                  type="button"
                  autoFocus
                  onClick={goBack}
                  className="shrink-0 rounded-lg border-2 border-gold bg-gold px-3 py-1 font-display text-sm font-extrabold text-chrome"
                >
                  Close
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-parchment">
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded-sm border-2 border-grass bg-parchment" />
                  Green border: shake the grass in that part of the map. No single clump is marked.
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded-sm border-2 border-bush bg-bush" />
                  Dark green: a bush.
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-flex items-end gap-0.5">
                    <span className="size-3.5 rounded-sm border-2 border-gold-ring bg-parchment" />
                    <span className="size-2 rounded-sm border-2 border-gold-ring bg-parchment" />
                  </span>
                  The larger mark leads. Smaller marks beside it follow that leader.
                </span>
                <span>One portrait holds both: day on the left of the yellow slash, night on the right.</span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-3 rounded-sm border-2 border-elite bg-parchment" />
                  Red border and a large portrait: an elite.
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Monsters" className="inline-flex rounded-md border-2 border-gold p-0.5">
                  <button
                    type="button"
                    aria-pressed={allOn}
                    onClick={() => setShown(new Set(chipIds))}
                    className={cn(
                      "rounded px-2 py-0.5 font-display text-xs font-extrabold",
                      allOn ? "bg-gold text-chrome" : "text-gold",
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    aria-pressed={noneOn}
                    onClick={() => {
                      setShown(new Set());
                      setSelectedId(null);
                      setSelectedKey(null);
                      setGrassPick(false);
                    }}
                    className={cn(
                      "rounded px-2 py-0.5 font-display text-xs font-extrabold",
                      noneOn ? "bg-gold text-chrome" : "text-gold",
                    )}
                  >
                    None
                  </button>
                </div>
                <div role="group" aria-label="When they appear" className="inline-flex flex-wrap rounded-md border-2 border-gold p-0.5">
                  {(
                    [
                      ["all", "All"],
                      ["day", "Day"],
                      ["night", "Night"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={when === id}
                      onClick={() => {
                        setWhen(id);
                        setSelectedKey(null);
                      }}
                      className={cn(
                        "rounded px-2 py-0.5 font-display text-xs font-extrabold",
                        when === id ? "bg-gold text-chrome" : "text-gold",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-parchment">{caption}</p>
              {!noneOn && grassRows.some((row) => active.has(row.id)) ? (
                <div className="mt-2">
                  <p className="text-xs font-bold text-parchment">
                    A green border under a zone name is a monster with no marked spot in that part. Odds are that
                    monster's share of the grass there.
                  </p>
                  <ul aria-label="Shaking grass" className="mt-1 flex max-h-40 flex-col gap-1 overflow-auto">
                    {["The Parchland", "Witherwood Plains", "The Sogswamp"].map((area) => {
                      const rows = grassRows
                        .filter((row) => row.area === area && active.has(row.id))
                        .sort((a, b) => a.name.localeCompare(b.name));
                      if (!rows.length) return null;
                      return (
                        <li key={area} className="flex flex-wrap items-center gap-1.5">
                          <span className="font-display text-xs font-extrabold text-gold">
                            {grassSide(area) ? `${area}, ${grassSide(area)}` : area}
                          </span>
                          {rows.map((row) => {
                            const picked = selectedId === row.id;
                            return (
                              <button
                                key={`${area}-${row.id}`}
                                type="button"
                                aria-label={`${row.name}. ${grassDetail(row.area, row.weights)}`}
                                onClick={() => {
                                  setSelectedKey(null);
                                  setGrassPick(true);
                                  setSelectedId(row.id);
                                  setShown(new Set(active).add(row.id));
                                }}
                                className={cn(
                                  "rounded-md border-2 border-gold px-2 py-0.5 font-display text-xs font-extrabold",
                                  picked ? "bg-gold text-chrome" : "text-gold",
                                )}
                              >
                                {row.name}
                                <span className={cn("ml-1", picked ? "text-chrome" : "text-parchment")}>
                                  {grassOdds(row.area, row.weights)}
                                </span>
                              </button>
                            );
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {oddsRow?.odds && !grassPick ? (
                <ul aria-label="Spawn odds" className="mt-1 flex flex-wrap gap-1.5">
                  {oddsRow.odds.map((odd) => (
                    <li
                      key={`${odd.kind}-${odd.nameJa}`}
                      className={cn(
                        "rounded-md border-2 border-gold px-2 py-0.5 font-display text-xs font-extrabold",
                        odd.kind === "monster" ? "bg-gold text-chrome" : "text-gold",
                      )}
                    >
                      {odd.name}
                      <span className={cn("ml-1", odd.kind === "monster" ? "text-chrome" : "text-parchment")}>{odd.weight}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {missing.length ? (
                <p className="mt-1 text-xs font-bold text-parchment">
                  {missing.map((id) => MONSTERS[id].name).join(", ")} {missing.length === 1 ? "has" : "have"} no
                  marked spot.
                </p>
              ) : null}
              {chips.length ? (
                <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-auto">
                  {chips.map((monster) => {
                    const count = spotCount(monster.id);
                    const listed = grassRows.some((row) => row.id === monster.id);
                    const inSet = active.has(monster.id);
                    const focused = selectedId === monster.id && inSet && (count > 0 || listed);
                    const kind = chipKind(monster.id);
                    return (
                      <button
                        key={monster.id}
                        type="button"
                        disabled={count === 0 && !listed}
                        aria-pressed={inSet && (count > 0 || listed)}
                        onClick={() => {
                          setSelectedKey(null);
                          const next = new Set(active);
                          if (next.has(monster.id)) {
                            next.delete(monster.id);
                            if (selectedId === monster.id) setSelectedId(null);
                            setGrassPick(false);
                          } else {
                            next.add(monster.id);
                            setSelectedId(monster.id);
                            setGrassPick(false);
                          }
                          setShown(next);
                        }}
                        className={cn(
                          "rounded-md border-2 px-2 py-0.5 font-display text-xs font-extrabold",
                          kind === "bush" ? "border-bush" : kind === "elite" ? "border-elite" : "border-gold",
                          focused ? "bg-gold text-chrome" : "text-gold",
                          !inSet && "opacity-50",
                        )}
                      >
                        {monster.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="flex h-full min-h-0 items-start justify-center" style={{ containerType: "size" }}>
              <MapView
                src={open.src}
                markers={open.markers}
                labels={open.labels}
                pins={pins}
                marks={marks}
                hotLabels={explainGrass ? pickedGrass.map((row) => row.area) : []}
                floats={grassFloats}
                onFloat={(id) => {
                  setSelectedKey(null);
                  setGrassPick(true);
                  setSelectedId(id);
                  setShown(new Set(active).add(id));
                }}
                fit
                onPick={(key) => {
                  const row = keyed.find((item) => item.key === key);
                  const member = pins.flatMap((pin) => pin.party ?? []).find((item) => item.key === key);
                  const id = row?.spot.id ?? member?.id;
                  if (!id) return;
                  setGrassPick(false);
                  setSelectedKey(key);
                  setSelectedId(id);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  );
}
