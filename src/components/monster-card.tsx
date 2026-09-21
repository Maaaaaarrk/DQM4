import { Minus, Plus } from "lucide-react";
import { FamilyIcon } from "@/components/family-icon";
import { MonsterSprite } from "@/components/monster-sprite";
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
}: {
  monster: Monster;
  variant?: Variant;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const interactive = expandable && variant === "parent";

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={interactive ? onToggle : undefined}
      className={cn(
        "flex w-max items-center gap-2.5 px-2.5 py-2 pr-4 text-left",
        "rounded-[18px] ring-2",
        variant === "focus" &&
          "bg-focus text-focus-fg ring-focus-edge shadow-[0_4px_0_var(--color-focus-edge),inset_0_1px_0_rgb(255_255_255_/0.12)]",
        variant === "parent" &&
          "bg-parent text-parent-fg ring-parent-edge shadow-[0_4px_0_var(--color-parent-edge),inset_0_1px_0_rgb(255_255_255_/0.18)]",
        interactive && "cursor-pointer",
        !interactive && "cursor-default",
      )}
      aria-expanded={interactive ? expanded : undefined}
    >
      <span
        data-anchor
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-parchment ring-[3px] ring-white shadow-[3px_4px_0_rgb(0_0_0_/0.12),0_0_0_2px_var(--color-gold-ring)]"
        aria-hidden
      >
        <MonsterSprite id={monster.id} family={monster.family} size={64} alt="" />
      </span>

      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="whitespace-nowrap font-display text-xl font-extrabold leading-none tracking-tight drop-shadow-[0_2px_0_rgb(0_0_0_/0.28)]">
          {monster.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="min-w-6 rounded bg-rank px-1 text-center font-display text-[11px] font-black leading-5 text-white ring-2 ring-white"
            title={`Rank ${monster.rank}`}
          >
            {monster.rank}
          </span>
          <FamilyIcon family={monster.family} size="sm" />
          {monster.synthOnly ? <SynthIcon size="sm" /> : null}
          {interactive ? (
            <span
              className={cn(
                "grid size-5 place-items-center rounded-md text-parchment ring-2 ring-white",
                expanded ? "bg-focus" : "bg-line",
              )}
              aria-hidden
            >
              {expanded ? (
                <Minus className="size-2.5" strokeWidth={3} />
              ) : (
                <Plus className="size-2.5" strokeWidth={3} />
              )}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
