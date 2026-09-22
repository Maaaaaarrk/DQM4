import portraitIds from "@/data/dqm4/portrait-ids.json";
import { FamilyIcon } from "@/components/family-icon";
import type { Family } from "@/lib/monsters";
import { publicAsset } from "@/lib/utils";

const HAVE_PORTRAIT = new Set(portraitIds as string[]);

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
  if (!id || !HAVE_PORTRAIT.has(id)) {
    return <FamilyIcon family={family} size="lg" framed={false} />;
  }
  return (
    <img
      src={publicAsset(`portraits/${id}.png`)}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className="block shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
