import { createFileRoute, Link } from "@tanstack/react-router";
import { SynthlineWordmark } from "@/components/synthline-wordmark";

export const Route = createFileRoute("/")({ component: Landing });

const GUIDES = [
  {
    to: "/get",
    kicker: "Pedigree",
    title: "How do I get this monster",
    body: "Pick the monster you want. Walk back through its parents, and stop when you reach one you can scout.",
  },
  {
    to: "/build",
    kicker: "Climb",
    title: "What can I build from this monster",
    body: "Lock a monster you already have. Each step shows the syntheses it can lead to — you choose which one to climb.",
  },
  {
    to: "/monsters",
    kicker: "Index",
    title: "Monster list",
    body: "Browse every monster and narrow the list by rank and family.",
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
        <ul className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
          {GUIDES.map((guide) => (
            <li key={guide.to}>
              <Link
                to={guide.to}
                className="flex h-full flex-col rounded-2xl border-2 border-gold bg-chrome px-5 py-5 text-left shadow-[0_6px_0_rgb(0_0_0_/0.25)] transition hover:-translate-y-0.5 hover:bg-chrome-hi"
              >
                <span className="font-display text-xs font-extrabold tracking-widest text-gold/70">
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
    </div>
  );
}
