export function RankBadge({ rank }: { rank: string }) {
  return (
    <span
      className="min-w-6 rounded bg-rank px-1 text-center font-display text-[11px] font-black leading-5 text-white ring-2 ring-white"
      title={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}
