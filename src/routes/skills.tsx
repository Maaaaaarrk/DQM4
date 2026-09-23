import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SkillUnlocks } from "@/components/skill-unlocks";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";
import { SKILL_LIST, SKILLS, SPECIES, type SkillInfo } from "@/lib/monsters";

export const Route = createFileRoute("/skills")({
  validateSearch: (search: Record<string, unknown>) => {
    const requested = typeof search.skill === "string" ? search.skill : "";
    return { skill: requested };
  },
  component: SkillGuide,
});

function holdersOf(key: string) {
  return SPECIES.filter((monster) => monster.skill === key).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function SkillCard({ skill, focused }: { skill: SkillInfo; focused: boolean }) {
  const next = skill.evolution ? SKILLS[skill.evolution] : null;
  const holders = holdersOf(skill.key);

  return (
    <article
      id={`skill-${skill.key}`}
      className={
        focused
          ? "scroll-mt-4 rounded-2xl border-2 border-gold bg-parchment-deep/40 p-4"
          : "rounded-2xl border-2 border-gold/30 bg-parchment-deep/40 p-4"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-extrabold text-chrome">{skill.name}</h2>
        {skill.category ? (
          <span className="rounded bg-chrome px-1.5 py-0.5 font-display text-[11px] font-extrabold text-parchment">
            {skill.category}
          </span>
        ) : null}
      </div>
      {next?.name ? (
        <p className="mt-2 text-sm font-bold text-chrome">
          Next{" "}
          <Link
            to="/skills"
            search={{ skill: next.key }}
            className="underline decoration-chrome/40 underline-offset-2 hover:text-gold"
          >
            {next.name}
          </Link>
        </p>
      ) : null}
      <div className="mt-3">
        <SkillUnlocks learns={skill.learns} />
      </div>
      {holders.length ? (
        <p className="mt-3 text-sm font-bold leading-relaxed text-chrome">
          Innate on{" "}
          {holders.map((monster, index) => (
            <span key={monster.id}>
              {index > 0 ? ", " : null}
              <Link
                to="/monster"
                search={{ monster: monster.id }}
                className="underline decoration-chrome/40 underline-offset-2 hover:text-gold"
              >
                {monster.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}

function SkillGuide() {
  const { skill: requested } = Route.useSearch();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SKILL_LIST;
    return SKILL_LIST.filter(
      (skill) =>
        skill.name?.toLowerCase().includes(q) ||
        skill.learns.some((item) => item.name.toLowerCase().includes(q)),
    );
  }, [query]);

  useEffect(() => {
    if (!requested || query) return;
    const node = document.getElementById(`skill-${requested}`);
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
        <label className="sr-only" htmlFor="skill-search">
          Search skills
        </label>
        <input
          id="skill-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${SKILL_LIST.length} skills`}
          className="ml-auto w-40 rounded-lg border-2 border-gold bg-chrome px-2 py-1 font-display text-sm font-bold text-gold placeholder:text-gold/50 md:w-64"
        />
      </header>
      <main className="stage-field min-h-0 flex-1 overflow-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <p className="font-display text-sm font-extrabold text-chrome">
            {shown.length} {shown.length === 1 ? "skill" : "skills"}
          </p>
          {shown.length === 0 ? (
            <p className="rounded-xl border-2 border-gold/60 bg-chrome/80 px-4 py-3 text-center font-display font-bold text-gold">
              No skills match this search.
            </p>
          ) : (
            shown.map((skill) => (
              <SkillCard key={skill.key} skill={skill} focused={skill.key === requested && !query} />
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
