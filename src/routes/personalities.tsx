import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import {
  PERSONALITIES,
  PERSONALITY_STATS,
  personalityBias,
  personalityRaises,
  type Personality,
} from "@/lib/personalities";
import { publicAsset } from "@/lib/utils";

export const Route = createFileRoute("/personalities")({
  validateSearch: (search: Record<string, unknown>) => {
    const requested = typeof search.personality === "string" ? search.personality : "";
    return { personality: requested };
  },
  component: PersonalityGuide,
});

const STAT_SHORT: Record<(typeof PERSONALITY_STATS)[number]["key"], string> = {
  hp: "HP",
  mp: "MP",
  attack: "Atk",
  defence: "Def",
  agility: "Agi",
  wisdom: "Wis",
};

/** Each stored step is 100 growth points. */
function growthPoints(value: number) {
  return value * 100;
}

function matches(personality: Personality, query: string) {
  if (personality.name.toLowerCase().includes(query)) return true;
  return PERSONALITY_STATS.some(
    (stat) => personality[stat.key] > 0 && stat.label.toLowerCase().includes(query),
  );
}

function BiasMark({ value, label }: { value: number; label: string }) {
  if (value === 0) {
    return <span aria-label={`${label} unchanged`} />;
  }
  const points = growthPoints(value);
  const raised = value > 0;
  const strong = Math.abs(value) >= 2;
  const Icon = raised ? (strong ? ChevronsUp : ChevronUp) : strong ? ChevronsDown : ChevronDown;
  return (
    <span
      aria-label={`${label} ${points}`}
      className={`inline-flex items-center justify-center gap-px rounded-md px-0.5 py-0.5 font-display text-[11px] font-extrabold leading-none sm:gap-0.5 sm:px-1 sm:text-sm ${
        raised ? "bg-focus text-focus-fg" : "bg-red-800 text-parchment"
      }`}
    >
      <Icon className="size-3 shrink-0 sm:size-4" strokeWidth={3} aria-hidden />
      {Math.abs(points)}
    </span>
  );
}

function PersonalityTable({
  personalities,
  requested,
}: {
  personalities: Personality[];
  requested: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-gold bg-parchment">
      <table className="w-full border-collapse">
        <thead className="bg-chrome text-gold">
          <tr>
            <th
              scope="col"
              className="px-3 py-2 text-left font-display text-xs font-extrabold tracking-wide"
            >
              Personality
            </th>
            {PERSONALITY_STATS.map((stat) => (
              <th key={stat.key} scope="col" className="px-1 py-2 text-center">
                <span className="flex flex-col items-center gap-0.5">
                  <img
                    src={publicAsset(stat.icon)}
                    alt=""
                    className="size-6 object-contain"
                  />
                  <span className="font-display text-[11px] font-extrabold leading-none sm:hidden">
                    {STAT_SHORT[stat.key]}
                  </span>
                  <span className="hidden font-display text-[11px] font-extrabold leading-none sm:inline">
                    {stat.label}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personalities.map((personality, index) => {
            const focused = personality.slug === requested;
            return (
              <tr
                key={personality.key}
                id={`personality-${personality.slug}`}
                className={
                  focused
                    ? "scroll-mt-4 bg-gold shadow-[inset_0_0_0_3px_var(--color-chrome)]"
                    : index % 2 === 0
                      ? "scroll-mt-4 bg-parchment"
                      : "scroll-mt-4 bg-gold/35"
                }
              >
                <th scope="row" className="px-2 py-2 text-left align-middle sm:px-3">
                  <span className="block font-display text-sm font-extrabold leading-tight text-chrome">
                    {personality.name}
                  </span>
                  <span className="block text-xs font-bold leading-snug text-muted">
                    {personalityRaises(personality)}
                  </span>
                </th>
                {PERSONALITY_STATS.map((stat) => (
                  <td key={stat.key} className="px-0 py-2 text-center align-middle sm:px-0.5">
                    <BiasMark value={personalityBias(personality, stat.key)} label={stat.label} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PersonalityGuide() {
  const { personality: requested } = Route.useSearch();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PERSONALITIES;
    return PERSONALITIES.filter((personality) => matches(personality, q));
  }, [query]);

  useEffect(() => {
    if (!requested || query) return;
    const node = document.getElementById(`personality-${requested}`);
    if (!node) return;
    const scroll = () => node.scrollIntoView({ block: "start" });
    const frame = requestAnimationFrame(scroll);
    const timer = window.setTimeout(scroll, 50);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [requested, query, shown]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <label className="sr-only" htmlFor="personality-search">
          Search personalities
        </label>
        <input
          id="personality-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or stat"
          className="ml-auto w-40 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-64"
        />
      </header>
      <main className="stage-field min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <p className="font-display text-sm font-extrabold text-chrome">
            {shown.length} {shown.length === 1 ? "personality" : "personalities"}
          </p>
          <p className="text-sm font-bold leading-relaxed text-chrome">
            One tick is 100 growth points. Two ticks is 200.
          </p>
          {shown.length === 0 ? (
            <p className="rounded-xl border-2 border-gold/60 bg-chrome/80 px-4 py-3 text-center font-display font-bold text-gold">
              No personalities match this search.
            </p>
          ) : (
            <PersonalityTable
              personalities={shown}
              requested={query ? "" : requested}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
