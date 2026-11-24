import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapMarkToggle, MapView, type MapFloat, type MapMarks, type MapPin } from "@/components/zone-map";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { GAME_MAPS, mapById } from "@/lib/game-maps";
import { MONSTERS } from "@/lib/monsters";
import { BUSH_LIST, BUSH_SPOTS, bushDetail, grassDetail, grassSide, grassSummary, type BushOdd } from "@/lib/bush-spots";
import { pointLine, SCOUT_POINTS, type ScoutPoint } from "@/lib/scout-points";
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

type When = "all" | "day" | "night" | "weather";

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
};

/** Day and night include scouts with no time limit. No spot is tied to weather. */
function passesWhen(point: MapSpot, when: When): boolean {
  if (when === "all") return true;
  if (when === "day") return point.time !== "Night";
  if (when === "night") return point.time !== "Day";
  return false;
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

function toPin(row: { spot: MapSpot; key: string }, hot: boolean, selectedId: string | null): MapPin {
  const { spot, key } = row;
  return {
    key,
    id: spot.id,
    family: MONSTERS[spot.id].family,
    x: spot.x,
    y: spot.y,
    hot,
    boss: spot.boss,
    bush: spot.bush,
    picked: spot.id === selectedId && hot,
    name: spot.name,
    detail: spot.bush && spot.odds ? bushDetail(spot.area, spot.odds) : pointLine(spot),
  };
}

function MapsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
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
      if (event.key === "Escape") void navigate({ search: emptySearch(), replace: true });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, navigate]);

  const keyed = useMemo(() => (open ? withKeys(spotsOn(open.id)) : []), [open]);
  const mapPoints = useMemo(() => keyed.map((row) => row.spot), [keyed]);

  const grassRows = BUSH_LIST.filter(
    (row) => open && row.map === open.id && (!search.area || row.area === search.area),
  );
  const chips = [
    ...new Map(
      [...mapPoints.map((point) => point.id), ...grassRows.map((row) => row.id)].map((id) => [id, MONSTERS[id]]),
    ).values(),
  ]
    .filter((monster) => monster)
    .sort((a, b) => a.name.localeCompare(b.name));
  const chipIds = chips.map((monster) => monster.id);
  const defaultIds = requested.length ? requested.filter((id) => chipIds.includes(id)) : chipIds;
  const active = shown ?? new Set(defaultIds);

  function spotCount(id: string): number {
    return mapPoints.filter(
      (point) => point.id === id && (!search.area || point.area === search.area) && passesWhen(point, when),
    ).length;
  }

  const allOn = chipIds.length > 0 && chipIds.every((id) => active.has(id));
  const noneOn = chipIds.length > 0 && chipIds.every((id) => !active.has(id));
  const visibleRows = keyed.filter(
    (row) =>
      (!search.area || row.spot.area === search.area) && passesWhen(row.spot, when) && active.has(row.spot.id),
  );
  const pins = open ? visibleRows.map((row) => toPin(row, true, selectedId)) : [];
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
    (id) => !mapPoints.some((point) => point.id === id) && !grassRows.some((row) => row.id === id),
  );
  const pickedGrass = selectedId ? grassRows.filter((row) => row.id === selectedId) : [];
  const explainGrass = Boolean(
    selectedId &&
      selectedName &&
      pickedGrass.length &&
      active.has(selectedId) &&
      (hotCount === 0 || grassPick) &&
      when !== "weather" &&
      !noneOn,
  );
  const grassFloats: MapFloat[] =
    when === "weather" || noneOn
      ? []
      : grassRows.flatMap((row) => {
          if (!active.has(row.id)) return [];
          const anchored = mapPoints.some(
            (point) => point.id === row.id && point.area === row.area && passesWhen(point, when),
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
    if (when === "weather") return "No scout on this map is tied to the weather.";
    if (explainGrass && selectedName) {
      const places = pickedGrass.map((row) => grassDetail(row.area, row.weights)).join(" ");
      return `${selectedName}. ${places} The gold names on the map are where you shake.`;
    }
    if (selectedId && selectedName && hotCount > 0 && active.has(selectedId)) {
      if (oddsRow) return `${selectedName} · ${oddsRow.area} · Bush`;
      return chosen
        ? `${selectedName} · ${pointLine(chosen)}`
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
          {GAME_MAPS.filter((map) => !scoutsOnly || MAPS_WITH_SPAWNS.has(map.id)).map((map) => {
            const spots = withKeys(spotsOn(map.id));
            return (
              <li key={map.id}>
                <button
                  type="button"
                  onClick={() =>
                    void navigate({ search: { map: map.id, area: "", monsters: "" }, replace: true })
                  }
                  className="flex h-full w-full flex-col text-left"
                >
                  <span className="mb-2 font-display text-sm font-extrabold leading-tight text-chrome">
                    {map.title}
                  </span>
                  <MapView
                    src={map.src}
                    markers={map.markers}
                    labels={map.labels}
                    pins={spots.map((row) => toPin(row, true, null))}
                    marks={marks}
                    compact
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={search.area || open.title}
          className="fixed inset-0 z-50 bg-chrome p-3"
          onClick={() => void navigate({ search: emptySearch(), replace: true })}
        >
          <div
            className="mx-auto grid h-full min-h-0 w-full max-w-5xl grid-rows-[auto_auto_minmax(0,1fr)] gap-2 rounded-2xl bg-chrome p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 font-display text-base font-extrabold text-gold">{search.area || open.title}</h2>
              <div className="flex shrink-0 items-center gap-2">
                <MapMarkToggle value={marks} onChange={setMarks} />
                <button
                  type="button"
                  autoFocus
                  onClick={() => void navigate({ search: emptySearch(), replace: true })}
                  className="shrink-0 rounded-lg border-2 border-gold bg-gold px-3 py-1 font-display text-sm font-extrabold text-chrome"
                >
                  Close
                </button>
              </div>
            </div>
            <div>
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
                      ["weather", "Weather"],
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
              {when !== "weather" && !noneOn && grassRows.some((row) => active.has(row.id)) ? (
                <div className="mt-2">
                  <p className="text-xs font-bold text-parchment">
                    The Grass group under a zone name is the monsters with no marked spot in that part. Shake the grass
                    there. No single clump is marked. Heavy is 100. Light is 20. One heavy entry equals five light
                    entries.
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
                                  {grassSummary(row.weights)}
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
                    const listed = when !== "weather" && grassRows.some((row) => row.id === monster.id);
                    const inSet = active.has(monster.id);
                    const focused = selectedId === monster.id && inSet && (count > 0 || listed);
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
                          focused ? "border-gold bg-gold text-chrome" : "border-gold text-gold",
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
                  if (!row) return;
                  setGrassPick(false);
                  setSelectedKey(key);
                  setSelectedId(row.spot.id);
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
