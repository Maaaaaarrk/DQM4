import { ChartColumn } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SynthlineWordmark } from "@/components/synthline-wordmark";

export const Route = createFileRoute("/")({ component: Landing });

const GUIDES = [
  {
    to: "/get",
    search: {},
    kicker: "Pedigree",
    title: "How do I get this monster",
    body: "Pick the monster you want. Walk back through its parents, and stop when you reach one you can scout.",
    icon: false,
  },
  {
    to: "/build",
    search: {},
    kicker: "Climb",
    title: "What can I build from this monster",
    body: "Lock a monster you already have. Each step shows the syntheses it can lead to — you choose which one to climb.",
    icon: false,
  },
  {
    to: "/monsters",
    search: {},
    kicker: "Index",
    title: "Monster list",
    body: "Browse every monster and narrow the list by rank and family.",
    icon: false,
  },
  {
    to: "/monster",
    search: { monster: "slime" },
    kicker: "Details",
    title: "Monster details",
    body: "Caps, traits, skill, and drops for one monster, then open How to get.",
    icon: true,
  },
  {
    to: "/skills",
    search: { skill: "" },
    kicker: "Talents",
    title: "Skills",
    body: "Every skill, the talent points it costs, and the traits and abilities it teaches.",
    icon: false,
  },
  {
    to: "/personalities",
    search: { personality: "" },
    kicker: "Growth",
    title: "Personalities",
    body: "Every personality, and how it raises or lowers growth in HP, MP, attack, defence, agility, and wisdom.",
    icon: false,
  },
  {
    to: "/team",
    search: {},
    kicker: "Party",
    title: "Team planner",
    body: "Fill four main slots and four reserve slots. Large monsters take two. Your lineup stays on this device, and the link shares only the party.",
    icon: false,
  },
  {
    to: "/maps",
    search: { map: "" },
    kicker: "Places",
    title: "Maps",
    body: "Every field, dungeon, and town map. Open one to see it larger.",
    icon: false,
  },
] as const;

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-chrome text-ink">
      <header className="chrome-bar px-4 py-6 text-center">
        <p className="font-display text-sm font-extrabold tracking-[0.2em] text-gold/80">
          Scout. Synth. Repeat.
        </p>
        <h1 className="mt-3 flex justify-center">
          <SynthlineWordmark className="h-14 md:h-16" />
        </h1>
      </header>
      <main className="stage-field flex flex-1 items-center px-4 py-8">
        <ul className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <li key={guide.to}>
              <Link
                to={guide.to}
                search={guide.search}
                className="flex h-full flex-col rounded-2xl border-2 border-gold bg-chrome px-5 py-5 text-left shadow-[0_6px_0_rgb(0_0_0_/0.25)] transition hover:-translate-y-0.5 hover:bg-chrome-hi"
              >
                <span className="flex items-center gap-2 font-display text-xs font-extrabold tracking-widest text-gold/70">
                  {guide.icon ? (
                    <ChartColumn className="size-4 text-gold" strokeWidth={2.6} aria-hidden />
                  ) : null}
                  {guide.kicker}
                </span>
                <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight text-gold">
                  {guide.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-parchment">{guide.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
