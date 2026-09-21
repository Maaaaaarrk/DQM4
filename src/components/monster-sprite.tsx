import spriteMap from "@/data/dqm4/sprite-map.json";
import { FamilyIcon } from "@/components/family-icon";
import type { Family } from "@/lib/monsters";
import { publicAsset } from "@/lib/utils";

const POS = spriteMap as unknown as Record<string, [number, number]>;
const TILE = 75;
const SHEET = 1800;
const SRC = publicAsset("dqm4/monsters-sprite.jpg");

export function hasSprite(id: string): boolean {
  return Boolean(POS[id]);
}

export function MonsterSprite({
  id,
  family,
  size = 64,
  alt = "",
}: {
  id?: string;
  family: Family;
  size?: number;
  alt?: string;
}) {
  const pos = id ? POS[id] : undefined;
  if (!pos) {
    return <FamilyIcon family={family} size="lg" framed={false} />;
  }
  const scale = size / TILE;
  return (
    <span
      className="block shrink-0"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${SRC})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${SHEET * scale}px ${SHEET * scale}px`,
        backgroundPosition: `${pos[0] * scale}px ${pos[1] * scale}px`,
      }}
      role="img"
      aria-label={alt}
    />
  );
}
