import { Minus, Plus } from "lucide-react";
import { FamilyIcon } from "@/components/family-icon";
import { RankBadge } from "@/components/rank-badge";
import { MonsterSprite } from "@/components/monster-sprite";
import { StatsLink } from "@/components/stats-link";
import { ScoutIcon } from "@/components/scout-icon";
import { HaveFlag } from "@/components/have-flag";
import { SynthIcon } from "@/components/synth-icon";
import type { Monster } from "@/lib/monsters";
import { cn } from "@/lib/utils";

type Variant = "focus" | "parent";

export function MonsterCard({
  monster,
  variant = "parent",
  expandable = false,
  expanded = false,
  onToggle,
  owned = false,
  onHave,
  detail,
}: {
  monster: Monster;
  variant?: Variant;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  owned?: boolean;
  onHave?: () => void;
  detail?: string;
}) {
  const interactive = expandable && variant === "parent";

  return (
    <div
      className={cn(
        "flex w-max items-center gap-2 px-2.5 py-2 pr-3",
        "rounded-[18px] ring-2",
        variant === "focus" &&
          "bg-focus text-focus-fg ring-focus-edge shadow-[0_4px_0_var(--color-focus-edge),inset_0_1px_0_rgb(255_255_255_/0.12)]",
        variant === "parent" &&
          "bg-parent text-parent-fg ring-parent-edge shadow-[0_4px_0_var(--color-parent-edge),inset_0_1px_0_rgb(255_255_255_/0.18)]",
      )}
    >
      <button
        type="button"
        disabled={!interactive}
        onClick={interactive ? onToggle : undefined}
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-parchment ring-[3px] ring-white shadow-[3px_4px_0_rgb(0_0_0_/0.12),0_0_0_2px_var(--color-gold-ring)]"
        aria-expanded={interactive ? expanded : undefined}
        aria-label={interactive ? monster.name : undefined}
        data-anchor
      >
        <MonsterSprite id={monster.id} family={monster.family} size={64} alt="" />
      </button>
      <span className="flex min-w-0 flex-col items-start gap-1">
        <button
          type="button"
          disabled={!interactive}
          onClick={interactive ? onToggle : undefined}
          className="whitespace-nowrap text-left font-display text-xl font-extrabold leading-none tracking-tight drop-shadow-[0_2px_0_rgb(0_0_0_/0.28)]"
        >
          {monster.name}
        </button>
        {detail ? (
          <span className="max-w-52 text-[11px] font-bold leading-tight">{detail}</span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <RankBadge rank={monster.rank} />
          <FamilyIcon family={monster.family} size="sm" />
          {monster.synthOnly ? <SynthIcon size="sm" /> : <ScoutIcon size="sm" />}
          <StatsLink id={monster.id} />
          {onHave ? <HaveFlag checked={owned} onChange={onHave} label="Have it" /> : null}
          {interactive ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={expanded ? "Minimize parents" : "Expand parents"}
              className={cn(
                "grid size-5 place-items-center rounded-md text-parchment ring-2 ring-white",
                expanded ? "bg-focus" : "bg-line",
              )}
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
