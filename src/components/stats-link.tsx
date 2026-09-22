import { ChartColumn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const SIZE: Record<Size, { wrap: string; icon: string }> = {
  sm: { wrap: "size-5", icon: "size-3" },
  md: { wrap: "size-6", icon: "size-3.5" },
};

export function StatsLink({
  id,
  size = "sm",
  className,
}: {
  id: string;
  size?: Size;
  className?: string;
}) {
  const dim = SIZE[size];
  return (
    <Link
      to="/monster"
      search={{ monster: id }}
      title="Monster details"
      aria-label="Monster details"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-md bg-parchment text-chrome shadow-[0_1px_0_rgb(0_0_0_/0.25)] ring-2 ring-white hover:bg-white",
        dim.wrap,
        className,
      )}
    >
      <ChartColumn className={dim.icon} strokeWidth={2.6} />
    </Link>
  );
}
