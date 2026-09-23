import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function HaveFlag({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange?: () => void;
  label: string;
}) {
  return (
    <label
      className="inline-flex items-center gap-1.5 font-display text-xs font-extrabold leading-none"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => onChange?.()}
      />
      <span
        className={cn(
          "pointer-events-none grid size-5 shrink-0 place-items-center rounded-[4px] border-2 border-current",
          checked ? "bg-current" : "bg-transparent",
        )}
        aria-hidden
      >
        {checked ? <Check className="size-3 text-chrome" strokeWidth={3} /> : null}
      </span>
      {label}
    </label>
  );
}
