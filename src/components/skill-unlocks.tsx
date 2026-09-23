import type { SkillLearn } from "@/lib/monsters";

export function SkillUnlocks({ learns }: { learns: SkillLearn[] }) {
  if (!learns.length) return null;
  return (
    <ul className="grid gap-2">
      {learns.map((item, index) => (
        <li
          key={`${item.points}-${item.key}-${index}`}
          className="rounded-xl border-2 border-gold/40 bg-chrome px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded bg-chrome-hi px-1.5 py-0.5 font-display text-[11px] font-extrabold text-parchment"
              title={`${item.points} talent points`}
            >
              {item.points}
            </span>
            <p className="font-display text-base font-extrabold text-gold">{item.name}</p>
          </div>
          {item.description ? (
            <p className="mt-1 text-sm leading-snug text-parchment">{item.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
