import { Minus, Plus } from "lucide-react";
import { FamilyIcon, familyLabel } from "@/components/family-icon";
import { RankBadge } from "@/components/rank-badge";
import { MonsterSprite } from "@/components/monster-sprite";
import { ScoutIcon } from "@/components/scout-icon";
import { StatsLink } from "@/components/stats-link";
import { SynthIcon } from "@/components/synth-icon";
import type { Family, Monster, Rank } from "@/lib/monsters";
import { cn } from "@/lib/utils";

export function WildcardCard({
  family,
  rank,
  members,
  value,
  onChange,
  expandable = false,
  expanded = false,
  onToggle,
}: {
  family: Family;
  rank: Rank;
  members: Monster[];
  value: string;
  onChange: (id: string) => void;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const title =
    rank === "Any"
      ? `${familyLabel(family)} - Any Rank`
      : `${familyLabel(family)} - ${rank} Rank`;

  const picked = members.find((m) => m.id === value);

  return (
    <div className="flex w-max items-center gap-2.5 rounded-[18px] bg-parent px-2.5 py-2 pr-3 text-parent-fg ring-2 ring-parent-edge shadow-[0_4px_0_var(--color-parent-edge),inset_0_1px_0_rgb(255_255_255_/0.18)]">
      <span
        data-anchor
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-parchment ring-[3px] ring-white shadow-[3px_4px_0_rgb(0_0_0_/0.12),0_0_0_2px_var(--color-gold-ring)]"
        aria-hidden
      >
        {picked ? (
          <MonsterSprite id={picked.id} family={picked.family} size={64} alt="" />
        ) : (
          <FamilyIcon family={family} size="lg" framed={false} />
        )}
      </span>

      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="whitespace-nowrap font-display text-xl font-extrabold leading-none tracking-tight drop-shadow-[0_2px_0_rgb(0_0_0_/0.28)]">
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          <RankBadge rank={rank === "Any" ? "*" : rank} />
          <FamilyIcon family={family} size="sm" />
          {picked ? (
            picked.synthOnly ? <SynthIcon size="sm" /> : <ScoutIcon size="sm" />
          ) : null}
          {picked ? <StatsLink id={picked.id} /> : null}
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="max-w-44 rounded-md border-2 border-white bg-parchment px-1.5 py-0.5 font-display text-xs font-bold text-ink"
            aria-label={`Choose a ${title} monster`}
          >
            <option value="">Pick one…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.synthOnly ? "Synthesis only" : "Scoutable"}
              </option>
            ))}
          </select>
          {expandable ? (
            <button
              type="button"
              onClick={onToggle}
              className={cn(
                "grid size-5 place-items-center rounded-md text-parchment ring-2 ring-white",
                expanded ? "bg-focus" : "bg-line",
              )}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse parents" : "Expand parents"}
            >
              {expanded ? (
                <Minus className="size-2.5" strokeWidth={3} />
              ) : (
                <Plus className="size-2.5" strokeWidth={3} />
              )}
            </button>
          ) : null}
        </span>
      </span>
    </div>
  );
}
