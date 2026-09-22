import { Binoculars } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const SIZE: Record<Size, { wrap: string; icon: string }> = {
  sm: { wrap: "size-5", icon: "size-3" },
  md: { wrap: "size-6", icon: "size-3.5" },
};

export function ScoutIcon({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  const dim = SIZE[size];
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-md bg-focus text-focus-fg shadow-[0_1px_0_rgb(0_0_0_/0.25)] ring-2 ring-white",
        dim.wrap,
        className,
      )}
      title="Scoutable"
      aria-label="Scoutable"
    >
      <Binoculars className={dim.icon} strokeWidth={2.4} />
    </span>
  );
}
