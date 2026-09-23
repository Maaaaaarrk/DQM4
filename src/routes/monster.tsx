import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { RankBadge } from "@/components/rank-badge";
import { MonsterSprite } from "@/components/monster-sprite";
import { StatsLink } from "@/components/stats-link";
import { ScoutIcon } from "@/components/scout-icon";
import { SkillUnlocks } from "@/components/skill-unlocks";
import { SynthIcon } from "@/components/synth-icon";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import growthCurveRows from "@/data/dqm4/GrowthCurve.json";
import { cn, publicAsset } from "@/lib/utils";
import {
  SKILLS,
  SPECIES,
  TRAITS,
  buildsFrom,
  monster,
  searchSpecies,
  type ParentRef,
  type Resistances,
} from "@/lib/monsters";

export const Route = createFileRoute("/monster")({
  validateSearch: (search: Record<string, unknown>) => {
    const requested = typeof search.monster === "string" ? search.monster : "slime";
    return { monster: requested };
  },
  component: MonsterDetails,
});

const GROWTH_TABLE = growthCurveRows as Record<string, number[]>;

const GROWTH_FIELDS = [
  ["HP", "hp", "icons/status/hp.png"],
  ["MP", "mp", "icons/status/mp.png"],
  ["Attack", "attack", "icons/status/attack.png"],
  ["Defence", "defence", "icons/status/defence.png"],
  ["Agility", "agility", "icons/status/agility.png"],
  ["Wisdom", "wisdom", "icons/status/wisdom.png"],
  ["Experience", "exp", ""],
] as const;

const RESISTANCE_FIELDS: [keyof Resistances, string, string][] = [
  ["fire", "Fire", "icons/attribute/fire.png"],
  ["water", "Water", "icons/attribute/water.png"],
  ["wind", "Wind", "icons/attribute/wind.png"],
  ["earth", "Earth", "icons/attribute/earth.png"],
  ["explosion", "Explosions", "icons/attribute/explosion.png"],
  ["freeze", "Ice", "icons/attribute/freeze.png"],
  ["thunder", "Electricity", "icons/attribute/thunder.png"],
  ["light", "Light", "icons/attribute/light.png"],
  ["darkness", "Dark", "icons/attribute/darkness.png"],
  ["weakness", "Debilitation", "icons/attribute/weakness.png"],
  ["hit", "Bedazzlement", "icons/attribute/hit.png"],
  ["seal", "Antimagic", "icons/attribute/seal.png"],
  ["drainMp", "MP Absorption", "icons/attribute/drain-mp.png"],
  ["confusion", "Confused", "icons/attribute/confusion.png"],
  ["sleep", "Asleep", "icons/attribute/sleep.png"],
  ["paralysis", "Paralysed", "icons/attribute/paralysis.png"],
  ["rest", "Rest", "icons/attribute/rest.png"],
  ["poison", "Poisoned", "icons/attribute/poison.png"],
  ["suddenDeath", "Instant Death", "icons/attribute/sudden-death.png"],
];

function resistanceRank(value: number) {
  if (value < 0) return "Low";
  if (value === 0) return "Reg.";
  if (value < 50) return "Med.";
  if (value < 100) return "High";
  if (value === 100) return "Null";
  if (value < 255) return "Heal";
  return "";
}

const CAPS = [
  ["Max. HP", "maxHp"],
  ["Max. MP", "maxMp"],
  ["Attack", "maxAtt"],
  ["Defence", "maxDef"],
  ["Agility", "maxAgi"],
  ["Wisdom", "maxWis"],
] as const;

function MonsterDetails() {
  const { monster: requested } = Route.useSearch();
  const navigate = Route.useNavigate();
  const current = SPECIES_IDS.has(requested) ? monster(requested) : null;
  const [query, setQuery] = useState("");
  const options = useMemo(() => {
    const list = searchSpecies(query);
    if (current && !list.some((m) => m.id === current.id)) return [current, ...list];
    return list;
  }, [query, current]);

  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar flex min-h-14 flex-wrap items-center gap-2 px-3 py-2">
        <Link to="/" className="shrink-0 hover:brightness-110" aria-label="Synthline home">
          <SynthlineWordmark className="h-7" />
        </Link>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <label className="sr-only" htmlFor="detail-search">
            Search monsters
          </label>
          <input
            id="detail-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${SPECIES.length} monsters`}
            className="w-36 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-56"
          />
          <label className="sr-only" htmlFor="detail-monster">
            Monster
          </label>
          <select
            id="detail-monster"
            value={current?.id ?? ""}
            onChange={(e) => {
              void navigate({ search: { monster: e.target.value } });
            }}
            className="max-w-48 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold"
          >
            {options.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.synthOnly ? "Synthesis only" : "Scoutable"}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="stage-field flex-1 px-4 py-6">
        {current ? <DetailSheet id={current.id} /> : <MissingMonster />}
      </main>
      <SiteFooter />
    </div>
  );
}

const SPECIES_IDS = new Set(SPECIES.map((m) => m.id));

function MissingMonster() {
  return (
    <p className="mx-auto max-w-lg rounded-xl border-2 border-gold/60 bg-chrome px-4 py-3 text-center font-display font-bold text-gold">
      That monster is not in the list. Pick another from the search.
    </p>
  );
}

function DetailSheet({ id }: { id: string }) {
  const m = monster(id);
  const caps = CAPS.map(([label, key]) => [label, m[key]] as const);
  const hasCaps = caps.some(([, value]) => value != null);
  const skill = m.skill ? SKILLS[m.skill] : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-chrome p-4 text-gold sm:flex-row sm:items-center">
        <span className="grid size-32 shrink-0 place-items-center self-center overflow-hidden rounded-[18px] bg-parchment ring-[3px] ring-white shadow-[3px_4px_0_rgb(0_0_0_/0.12),0_0_0_2px_var(--color-gold-ring)]">
          <MonsterSprite id={m.id} family={m.family} size={128} alt="" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-extrabold leading-none">{m.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <RankBadge rank={m.rank} />
            <FamilyIcon family={m.family} size="sm" />
            <span className="font-display text-xs font-extrabold text-parchment">
              {familyLabel(m.family)}
            </span>
            {m.synthOnly ? <SynthIcon size="sm" /> : <ScoutIcon size="sm" />}
            <span className="font-display text-xs font-extrabold text-parchment">
              {m.synthOnly ? "Synthesis only" : "Scoutable"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/get"
              search={{ monster: m.id }}
              className="rounded-lg border-2 border-gold bg-gold px-3 py-1.5 font-display text-sm font-extrabold text-chrome hover:bg-parchment"
            >
              How to get
            </Link>
            <Link
              to="/build"
              search={{ monster: m.id }}
              className="rounded-lg border-2 border-gold px-3 py-1.5 font-display text-sm font-extrabold text-gold hover:bg-chrome-hi"
            >
              What it builds
            </Link>
          </div>
        </div>
      </section>

      <Section title="Habitat">
        {m.habitats.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {m.habitats.map((spot) => {
              const detail = [spot.time ?? "Day and night", spot.where].filter(Boolean).join(" · ");
              return (
                <li
                  key={`${spot.area}-${spot.time ?? "any"}-${spot.where ?? "ground"}`}
                  className="rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2"
                >
                  <p className="font-display text-base font-extrabold text-gold">{spot.area}</p>
                  <p className="mt-1 text-sm font-bold text-parchment">{detail}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>This monster has no natural habitat.</Empty>
        )}
      </Section>

      <Section key={m.id} title="What it builds" collapsible defaultOpen={false}>
        <Builds id={m.id} />
      </Section>

      <Section title="Max stats">
        {hasCaps ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {caps.map(([label, value]) => (
              <li key={label} className="rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2">
                <p className="font-display text-sm font-extrabold text-gold">{label}</p>
                <p className="mt-1 font-display text-2xl font-extrabold leading-none text-gold">
                  {value ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No stats for this monster.</Empty>
        )}
      </Section>

      <Section title="Traits">
        {m.traits.length ? (
          <ul className="grid gap-2">
            {m.traits.map((trait) => {
              const info = TRAITS[trait.key];
              if (!info?.name && !info?.description) return null;
              return (
                <li key={`${trait.key}-${trait.level}-${trait.largeOnly}`} className="rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {info.name ? (
                      <p className="font-display text-base font-extrabold text-gold">{info.name}</p>
                    ) : null}
                    <span className="rounded bg-chrome-hi px-1.5 py-0.5 font-display text-[11px] font-extrabold text-parchment">
                      {trait.boss ? "Boss" : trait.level == null ? "Start" : `Lv ${trait.level}`}
                    </span>
                    {trait.largeOnly ? (
                      <span className="rounded bg-gold px-1.5 py-0.5 font-display text-[11px] font-extrabold text-chrome">
                        Large only
                      </span>
                    ) : null}
                  </div>
                  {info.description ? (
                    <p className="mt-1 text-sm leading-snug text-parchment">{info.description}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No traits for this monster.</Empty>
        )}
      </Section>

      <Section title="Skill">
        {!m.skill ? (
          <Empty>No innate skill for this monster.</Empty>
        ) : skill?.name ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Link
                to="/skills"
                search={{ skill: skill.key }}
                className="font-display text-lg font-extrabold text-chrome underline decoration-chrome/40 underline-offset-2 hover:text-gold"
              >
                {skill.name}
              </Link>
              {skill.category ? (
                <span className="rounded bg-chrome px-1.5 py-0.5 font-display text-[11px] font-extrabold text-parchment">
                  {skill.category}
                </span>
              ) : null}
            </div>
            <SkillUnlocks learns={skill.learns} />
          </div>
        ) : (
          <Empty>No description for this skill.</Empty>
        )}
      </Section>

      <Section title="Drops">
        {m.drops.some((drop) => drop.description || drop.name) ? (
          <ul className="grid gap-2">
            {m.drops.map((drop) =>
              drop.description || drop.name ? (
                <li
                  key={`${drop.nameJa}-${drop.rate}`}
                  className="rounded-lg border-2 border-gold/40 bg-chrome px-3 py-2"
                >
                  <p className="font-display text-sm font-extrabold text-gold">
                    {drop.name}
                    <span className="ml-2 text-parchment">{drop.rate}</span>
                  </p>
                  {drop.description ? (
                    <p className="mt-1 text-sm leading-snug text-parchment">{drop.description}</p>
                  ) : null}
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <Empty>No drops for this monster.</Empty>
        )}
      </Section>

      {m.growthCurves ? (
        <Section title="Growth curves">
          <ul className="grid gap-2 sm:grid-cols-2">
            {GROWTH_FIELDS.map(([label, key, icon]) => {
              const id = m.growthCurves?.[key];
              const curve = id == null ? undefined : GROWTH_TABLE[String(id)];
              return (
                <li key={key} className="rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2">
                  <span className="flex items-center gap-2">
                    {icon ? <GameIcon src={icon} label={label} /> : null}
                    <span className="min-w-0">
                      <span className="block font-display text-sm font-extrabold text-gold">{label}</span>
                      <span className="text-xs font-bold text-gold/70">Table No{id}</span>
                    </span>
                  </span>
                  {curve ? <GrowthCurve values={curve} /> : null}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {m.resistances ? (
        <Section title="Resistances">
          <ul className="grid gap-2 sm:grid-cols-2">
            {RESISTANCE_FIELDS.map(([key, label, icon]) => {
              const value = m.resistances?.[key] ?? 0;
              const rank = resistanceRank(value);
              return (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GameIcon src={icon} label={label} />
                    <span className="truncate font-display text-sm font-extrabold text-gold">{label}</span>
                  </span>
                  <span className="text-right font-display text-sm font-extrabold text-parchment">
                    {rank ? <span>{rank} · </span> : null}
                    <span className={value < 0 ? "text-red-400" : undefined}>{value}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function GameIcon({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={publicAsset(src)}
      alt=""
      title={label}
      className="size-8 shrink-0 object-contain"
    />
  );
}

function GrowthCurve({ values }: { values: number[] }) {
  const width = 220;
  const height = 48;
  const peak = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const line = values
    .map((value, index) => {
      const x = index * step;
      const y = height - 2 - (value / peak) * (height - 6);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const marks = [1, 25, 50, 75, 100].map((level) => {
    const value = values[Math.min(level, values.length) - 1] ?? 0;
    return { level, value };
  });
  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full text-gold" aria-hidden>
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-bold text-parchment">
        {marks.map((mark) => (
          <span key={mark.level}>
            Lv{mark.level} · {mark.value}
          </span>
        ))}
      </p>
    </div>
  );
}

function partnerLabel(partner: ParentRef): string {
  if (partner.type === "species") return monster(partner.id).name;
  const rank = partner.rank === "Any" ? "Any rank" : `${partner.rank} rank`;
  return `${rank} ${familyLabel(partner.family)}`;
}

function Builds({ id }: { id: string }) {
  const options = buildsFrom(id);
  if (!options.length) {
    return <Empty>Nothing uses this monster as a parent.</Empty>;
  }
  return (
    <ul className="grid gap-2">
      {options.map((option) => {
        const result = monster(option.resultId);
        const partner =
          option.partner.type === "species"
            ? option.partner.id
            : `${option.partner.family}-${option.partner.rank}`;
        return (
          <li
            key={`${option.resultId}:${partner}`}
            className="flex items-center gap-3 rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2"
          >
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-parchment ring-[3px] ring-white shadow-[0_0_0_2px_var(--color-gold-ring)]">
              <MonsterSprite id={result.id} family={result.family} size={56} alt="" />
            </span>
            <span className="min-w-0 flex-1">
              <Link
                to="/monster"
                search={{ monster: result.id }}
                className="block truncate font-display text-lg font-extrabold text-gold hover:text-parchment"
              >
                {result.name}
              </Link>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <RankBadge rank={result.rank} />
                <FamilyIcon family={result.family} size="sm" />
                {result.synthOnly ? <SynthIcon size="sm" /> : <ScoutIcon size="sm" />}
                <StatsLink id={result.id} />
              </span>
              <p className="mt-1 truncate text-xs font-bold text-parchment">
                Needs {partnerLabel(option.partner)}
              </p>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border-2 border-gold/30 bg-parchment-deep/40 p-4">
      <div className={cn("flex items-center justify-between gap-2", (open || !collapsible) && "mb-3")}>
        <h2 className="font-display text-xs font-extrabold tracking-widest text-chrome">{title}</h2>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 rounded-md border-2 border-gold px-2 py-0.5 font-display text-xs font-extrabold text-chrome hover:bg-chrome-hi/20"
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-md text-parchment ring-2 ring-white",
                open ? "bg-focus" : "bg-line",
              )}
              aria-hidden
            >
              {open ? <Minus className="size-2.5" strokeWidth={3} /> : <Plus className="size-2.5" strokeWidth={3} />}
            </span>
            {open ? "Minimize" : "Expand"}
          </button>
        ) : null}
      </div>
      {open || !collapsible ? children : null}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-muted">{children}</p>;
}
