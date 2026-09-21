import { cn, publicAsset } from "@/lib/utils";

export function SynthlineWordmark({ className }: { className?: string }) {
  return (
    <img
      src={publicAsset("synthline-gold.svg")}
      alt="Synthline"
      className={cn("h-8 w-auto [image-rendering:pixelated]", className)}
    />
  );
}
