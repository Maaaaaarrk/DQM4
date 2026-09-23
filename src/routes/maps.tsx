import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapView } from "@/components/zone-map";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { GAME_MAPS, mapById } from "@/lib/game-maps";

export const Route = createFileRoute("/maps")({
  validateSearch: (search: Record<string, unknown>) => {
    const map = typeof search.map === "string" ? search.map : "";
    return { map: mapById(map) ? map : "" };
  },
  component: MapsPage,
});

function MapsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const open = mapById(search.map);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") void navigate({ search: { map: "" }, replace: true });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, navigate]);

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
          {GAME_MAPS.map((map) => (
            <li key={map.id}>
              <button
                type="button"
                onClick={() => void navigate({ search: { map: map.id }, replace: true })}
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
          aria-label={open.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-chrome/80 p-3"
          onClick={() => void navigate({ search: { map: "" }, replace: true })}
        >
          <div
            className="flex max-h-full w-full max-w-5xl flex-col gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-extrabold text-gold">{open.title}</h2>
              <button
                type="button"
                autoFocus
                onClick={() => void navigate({ search: { map: "" }, replace: true })}
                className="shrink-0 rounded-lg border-2 border-gold bg-gold px-3 py-1 font-display text-sm font-extrabold text-chrome"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 overflow-auto">
              <MapView src={open.src} markers={open.markers} labels={open.labels} />
            </div>
          </div>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  );
}
