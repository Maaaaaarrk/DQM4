import type { Family } from "@/lib/monsters";
import { cn, publicAsset } from "@/lib/utils";

export const FAMILY_META: Record<Family, { label: string; src: string }> = {
  slime: { label: "Slime", src: publicAsset("families/slime.png") },
  dragon: { label: "Dragon", src: publicAsset("families/dragon.png") },
  nature: { label: "Nature", src: publicAsset("families/nature.png") },
  beast: { label: "Beast", src: publicAsset("families/beast.png") },
  material: { label: "Material", src: publicAsset("families/material.png") },
  demon: { label: "Demon", src: publicAsset("families/demon.png") },
  undead: { label: "Undead", src: publicAsset("families/undead.png") },
  boss: { label: "???", src: publicAsset("families/boss.png") },
};

type Size = "sm" | "md" | "lg";

const SIZE: Record<Size, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
};

export function FamilyIcon({
  family,
  size = "md",
  framed = true,
  className,
}: {
  family: Family;
  size?: Size;
  framed?: boolean;
  className?: string;
}) {
  const meta = FAMILY_META[family];
  const img = (
    <img
      src={meta.src}
      alt={`${meta.label} family`}
      title={meta.label}
      width={24}
      height={24}
      className="size-full object-contain [image-rendering:pixelated]"
    />
  );

  if (!framed) {
    return <span className={cn("inline-block", SIZE[size], className)}>{img}</span>;
  }

  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden rounded-md bg-parchment p-0 ring-2 ring-white",
        "shadow-[0_1px_0_rgb(0_0_0_/0.25)]",
        SIZE[size],
        className,
      )}
      title={meta.label}
      aria-label={`${meta.label} family`}
    >
      {img}
    </span>
  );
}

export function familyLabel(family: Family): string {
  return FAMILY_META[family].label;
}
