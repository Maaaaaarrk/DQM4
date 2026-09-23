import personalityRows from "@/data/dqm4/Personality.json";

export type PersonalityStat = "hp" | "mp" | "attack" | "defence" | "agility" | "wisdom";

export type Personality = {
  key: string;
  slug: string;
  name: string;
  nameJa: string;
  hp: number;
  mp: number;
  attack: number;
  defence: number;
  agility: number;
  wisdom: number;
};

type RawPersonality = {
  Key: string;
  Name: string;
  NameJa: string;
  Hp: number;
  Mp: number;
  Attack: number;
  Defence: number;
  Agility: number;
  Wisdom: number;
};

/** Growth biases, in the same order as the monster page. */
export const PERSONALITY_STATS: {
  key: PersonalityStat;
  label: string;
  phrase: string;
  icon: string;
}[] = [
  { key: "hp", label: "HP", phrase: "HP", icon: "icons/status/hp.png" },
  { key: "mp", label: "MP", phrase: "MP", icon: "icons/status/mp.png" },
  { key: "attack", label: "Attack", phrase: "attack", icon: "icons/status/attack.png" },
  { key: "defence", label: "Defence", phrase: "defence", icon: "icons/status/defence.png" },
  { key: "agility", label: "Agility", phrase: "agility", icon: "icons/status/agility.png" },
  { key: "wisdom", label: "Wisdom", phrase: "wisdom", icon: "icons/status/wisdom.png" },
];

function slugFor(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const PERSONALITIES: Personality[] = (personalityRows as RawPersonality[]).map((row) => ({
  key: row.Key,
  slug: slugFor(row.Name),
  name: row.Name,
  nameJa: row.NameJa,
  hp: row.Hp,
  mp: row.Mp,
  attack: row.Attack,
  defence: row.Defence,
  agility: row.Agility,
  wisdom: row.Wisdom,
}));

export function personalityBias(personality: Personality, stat: PersonalityStat) {
  return personality[stat];
}

/** Stats this personality raises, as a short sentence. */
export function personalityRaises(personality: Personality) {
  const raised = PERSONALITY_STATS.filter((stat) => personality[stat.key] > 0).map(
    (stat) => stat.phrase,
  );
  if (raised.length === 0) return "Leaves every stat even.";
  if (raised.length === 1) return `Raises ${raised[0]}.`;
  if (raised.length === 2) return `Raises ${raised[0]} and ${raised[1]}.`;
  return `Raises ${raised.slice(0, -1).join(", ")}, and ${raised[raised.length - 1]}.`;
}
