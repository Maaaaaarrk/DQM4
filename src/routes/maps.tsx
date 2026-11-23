import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapView, type MapPin } from "@/components/zone-map";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { GAME_MAPS, mapById } from "@/lib/game-maps";
import { MONSTERS } from "@/lib/monsters";
import { pointLine, SCOUT_POINTS, type ScoutPoint } from "@/lib/scout-points";
import { cn } from "@/lib/utils";

const AREAS = new Set(SCOUT_POINTS.map((point) => point.area));

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

function pinKey(point: ScoutPoint, index: number): string {
  return `${point.monsterId}-${point.x}-${point.y}-${index}`;
}

function toPins(points: ScoutPoint[], hot: (point: ScoutPoint) => boolean, selectedId: string | null): MapPin[] {
  return points.map((point, index) => ({
    key: pinKey(point, index),
    x: point.x,
    y: point.y,
    hot: hot(point),
    boss: point.boss,
    picked: point.id === selectedId && hot(point),
    name: point.name,
    detail: pointLine(point),
  }));
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

  useEffect(() => {
    setSelectedId(requested.length === 1 ? requested[0] : null);
    setSelectedKey(null);
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

  const mapPoints = useMemo(
    () => (open ? SCOUT_POINTS.filter((point) => point.map === open.id) : []),
    [open],
  );
  const keyed = useMemo(
    () => mapPoints.map((point, index) => ({ point, key: pinKey(point, index) })),
    [mapPoints],
  );

  function isHot(point: ScoutPoint): boolean {
    if (search.area && point.area !== search.area) return false;
    if (requested.length) return requested.includes(point.id);
    if (selectedId) return point.id === selectedId;
    return true;
  }

  const pins = open ? toPins(mapPoints, isHot, selectedId) : [];
  const filtered = requested.length > 0 || search.area !== "" || selectedId != null;
  const visiblePins = filtered ? pins.filter((pin) => pin.hot) : pins;
  const chosen = keyed.find((row) => row.key === selectedKey)?.point ?? null;
  const hotCount = mapPoints.filter(
    (point) => point.id === selectedId && (!search.area || point.area === search.area),
  ).length;
  const selectedName = selectedId ? MONSTERS[selectedId]?.name : "";
  const missing = requested.filter((id) => !mapPoints.some((point) => point.id === id));
  const chips = (
    requested.length ? requested.map((id) => MONSTERS[id]) : [...new Map(mapPoints.map((point) => [point.id, MONSTERS[point.id]])).values()]
  )
    .filter((monster) => monster)
    .sort((a, b) => a.name.localeCompare(b.name));

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
        <ul className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {GAME_MAPS.map((map) => {
            const spots = SCOUT_POINTS.filter((point) => point.map === map.id);
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
                    pins={toPins(spots, () => true, null)}
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
              <h2 className="font-display text-base font-extrabold text-gold">{search.area || open.title}</h2>
              <button
                type="button"
                autoFocus
                onClick={() => void navigate({ search: emptySearch(), replace: true })}
                className="shrink-0 rounded-lg border-2 border-gold bg-gold px-3 py-1 font-display text-sm font-extrabold text-chrome"
              >
                Close
              </button>
            </div>
            <div>
              <p className="text-sm font-bold text-parchment">
                {selectedId && selectedName && hotCount > 0
                  ? chosen
                    ? `${selectedName} · ${pointLine(chosen)}`
                    : `${selectedName} · ${hotCount} ${hotCount === 1 ? "spot" : "spots"}`
                  : requested.length || search.area
                    ? "Gold marks are the scouts for this stop."
                    : "Every scout spot on this map."}
              </p>
              {missing.length ? (
                <p className="mt-1 text-xs font-bold text-parchment">
                  {missing.map((id) => MONSTERS[id].name).join(", ")} {missing.length === 1 ? "has" : "have"} no
                  marked spot.
                </p>
              ) : null}
              {chips.length ? (
                <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-auto">
                  {chips.map((monster) => {
                    const count = mapPoints.filter((point) => point.id === monster.id).length;
                    const on = selectedId === monster.id;
                    return (
                      <button
                        key={monster.id}
                        type="button"
                        disabled={count === 0}
                        aria-pressed={on}
                        onClick={() => {
                          setSelectedKey(null);
                          setSelectedId((current) => (current === monster.id ? null : monster.id));
                        }}
                        className={cn(
                          "rounded-md border-2 px-2 py-0.5 font-display text-xs font-extrabold",
                          on ? "border-gold bg-gold text-chrome" : "border-gold text-gold",
                          count === 0 && "opacity-50",
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
                pins={visiblePins}
                fit
                onPick={(key) => {
                  const row = keyed.find((item) => item.key === key);
                  if (!row) return;
                  setSelectedKey(key);
                  setSelectedId(row.point.id);
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
