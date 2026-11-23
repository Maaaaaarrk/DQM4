import { Link } from "@tanstack/react-router";
import { mapForArea } from "@/lib/game-maps";
import { pointsFor } from "@/lib/scout-points";

export function SpotMap({ id, area }: { id: string; area?: string }) {
  if (!area) return null;
  const map = mapForArea(area);
  if (!map || pointsFor(id, area).length === 0) return null;
  return (
    <Link
      to="/maps"
      search={{ map, area, monsters: id }}
      className="rounded-md border-2 border-gold px-2 py-0.5 font-display text-xs font-extrabold text-gold"
    >
      Map
    </Link>
  );
}
