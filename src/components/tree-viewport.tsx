import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MIN_Z = 0.15;
const MAX_Z = 3;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isFormField(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("select, input, textarea"));
}

export function TreeViewport({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 32, y: 32, z: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef<{
    pointerId: number;
    sx: number;
    sy: number;
    vx: number;
    vy: number;
    moved: boolean;
  } | null>(null);
  const skipClick = useRef(false);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = viewRef.current;
      const nextZ = clamp(v.z * Math.exp(-e.deltaY * 0.002), MIN_Z, MAX_Z);
      if (nextZ === v.z) return;
      const wx = (mx - v.x) / v.z;
      const wy = (my - v.y) / v.z;
      const next = { z: nextZ, x: mx - wx * nextZ, y: my - wy * nextZ };
      viewRef.current = next;
      setView(next);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    const onSelectStart = (e: Event) => e.preventDefault();
    el.addEventListener("selectstart", onSelectStart);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("selectstart", onSelectStart);
    };
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if (isFormField(e.target)) return;
    dragRef.current = {
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      vx: viewRef.current.x,
      vy: viewRef.current.y,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && dx * dx + dy * dy < 36) return;
    if (!drag.moved) {
      drag.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      window.getSelection()?.removeAllRanges();
      setPanning(true);
    }
    const next = { ...viewRef.current, x: drag.vx + dx, y: drag.vy + dy };
    viewRef.current = next;
    setView(next);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    skipClick.current = drag.moved;
    dragRef.current = null;
    setPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (!skipClick.current) return;
    skipClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        "absolute inset-0 overflow-hidden select-none",
        panning ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className="absolute top-0 left-0 w-max origin-top-left select-none"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
