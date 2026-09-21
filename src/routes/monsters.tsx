import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { MonsterSprite } from "@/components/monster-sprite";
import { SynthIcon } from "@/components/synth-icon";
import { cn } from "@/lib/utils";
import {
  FAMILY_ORDER,
  RANK_ORDER,
  searchSpecies,
  SPECIES,
  type Family,
  type Rank,
} from "@/lib/monsters";

export const Route = createFileRoute("/monsters")({ component: MonsterList });

function MonsterList() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<Family | "all">("all");
  const [rank, setRank] = useState<Rank | "all">("all");
  const [obtain, setObtain] = useState<"both" | "scoutable" | "synth">("both");
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const shown = useMemo(() => {
    return searchSpecies(query).filter((m) => {
      if (verifiedOnly && !m.verified) return false;
      if (family !== "all" && m.family !== family) return false;
      if (rank !== "all" && m.rank !== rank) return false;
      if (obtain === "scoutable" && m.synthOnly) return false;
      if (obtain === "synth" && !m.synthOnly) return false;
      return true;
    });
  }, [query, family, rank, obtain, verifiedOnly]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <label className="sr-only" htmlFor="monster-search">
          Search monsters
        </label>
        <input
          id="monster-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${SPECIES.length} monsters`}
          className="ml-auto w-40 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-64"
        />
      </header>

      <main className="stage-field min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <FilterRow label="Show">
            <FilterChip pressed={obtain === "both"} onClick={() => setObtain("both")}>
              Both
            </FilterChip>
            <FilterChip pressed={obtain === "scoutable"} onClick={() => setObtain("scoutable")}>
              Scoutable
            </FilterChip>
            <FilterChip pressed={obtain === "synth"} onClick={() => setObtain("synth")}>
              Synthesis only
            </FilterChip>
            <FilterChip pressed={verifiedOnly} onClick={() => setVerifiedOnly((on) => !on)}>
              Verified
            </FilterChip>
          </FilterRow>
          <FilterRow label="Rank">
            <FilterChip pressed={rank === "all"} onClick={() => setRank("all")}>
              All
            </FilterChip>
            {RANK_ORDER.map((item) => (
              <FilterChip
                key={item}
                pressed={rank === item}
                onClick={() => setRank(item)}
              >
                {item}
              </FilterChip>
            ))}
          </FilterRow>
          <FilterRow label="Family">
            <FilterChip pressed={family === "all"} onClick={() => setFamily("all")}>
              All
            </FilterChip>
            {FAMILY_ORDER.map((item) => (
              <FilterChip
                key={item}
                pressed={family === item}
                onClick={() => setFamily(item)}
              >
                <span aria-hidden>
                  <FamilyIcon family={item} size="sm" />
                </span>
                {familyLabel(item)}
              </FilterChip>
            ))}
          </FilterRow>

          <p className="font-display text-sm font-extrabold text-chrome">
            {shown.length} {shown.length === 1 ? "monster" : "monsters"}
          </p>

          {shown.length === 0 ? (
            <p className="rounded-xl border-2 border-gold/60 bg-chrome/80 px-4 py-3 text-center font-display font-bold text-gold">
              No monsters match these filters.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {shown.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 px-3 py-2",
                    m.verified
                      ? "border-gold/70 bg-chrome text-gold"
                      : "border-zinc-600/40 bg-zinc-900/70 text-zinc-500 grayscale",
                  )}
                >
                  <MonsterSprite id={m.id} family={m.family} size={48} alt="" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-extrabold leading-tight">
                      {m.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <span className="rounded bg-rank px-1 text-[10px] font-black text-white">
                        {m.rank}
                      </span>
                      <FamilyIcon family={m.family} size="sm" />
                      {m.synthOnly ? <SynthIcon size="sm" /> : null}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col gap-1 text-right font-display text-xs font-extrabold">
                    <Link
                      to="/get"
                      search={{ monster: m.id }}
                      className={m.verified ? "hover:text-parchment" : "hover:text-zinc-300"}
                    >
                      How to get
                    </Link>
                    <Link
                      to="/build"
                      search={{ monster: m.id }}
                      className={m.verified ? "hover:text-parchment" : "hover:text-zinc-300"}
                    >
                      What it builds
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <footer className="border-t-[3px] border-chrome-hi bg-chrome px-3 py-2">
        <p className="text-center font-display text-xs font-extrabold tracking-[0.18em] text-gold">
          Scout. Synth. Repeat.
        </p>
      </footer>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 font-display text-sm font-extrabold text-chrome">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border-2 border-gold px-2 py-1 font-display text-xs font-extrabold",
        pressed ? "bg-gold text-chrome" : "bg-chrome text-gold hover:bg-chrome-hi",
      )}
    >
      {children}
    </button>
  );
}
