import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const MIN_Z = 0.15;
const MAX_Z = 3;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function isFormField(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("select, input, textarea"));
}

function offsetBox(ancestor: HTMLElement, el: HTMLElement) {
  if (el === ancestor) {
    return { x: 0, y: 0, w: ancestor.offsetWidth, h: ancestor.offsetHeight };
  }
  let x = 0;
  let y = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== ancestor) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    const parent: Element | null = cur.offsetParent;
    if (!(parent instanceof HTMLElement)) break;
    cur = parent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

export type TreeViewportHandle = {
  /**
   * Bring `path` and its direct parents into view, or the whole tree when
   * `path` is omitted. Zooms out only when that group does not fit.
   */
  frame: (path?: string) => void;
};

export const TreeViewport = forwardRef<TreeViewportHandle, { children: ReactNode }>(
  function TreeViewport({ children }, ref) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
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

    const frame = useCallback((path?: string) => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;
      const tree = content.firstElementChild;
      if (!(tree instanceof HTMLElement)) return;

      const nodes: HTMLElement[] = [];
      if (path) {
        tree.querySelectorAll<HTMLElement>("[data-path]").forEach((el) => {
          const cardPath = el.dataset.path ?? "";
          const rest = cardPath.startsWith(`${path}/`) ? cardPath.slice(path.length + 1) : null;
          if (cardPath === path || (rest !== null && !rest.includes("/"))) nodes.push(el);
        });
      }

      const boxes = (nodes.length > 0 ? nodes : [tree]).map((el) => offsetBox(content, el));
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const box of boxes) {
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.w);
        maxY = Math.max(maxY, box.y + box.h);
      }
      const bounds = {
        x: minX,
        y: minY,
        w: Math.max(1, maxX - minX),
        h: Math.max(1, maxY - minY),
      };
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const margin = 28;
      const availW = Math.max(40, vw - margin * 2);
      const availH = Math.max(40, vh - margin * 2);
      const current = viewRef.current;
      const fits = bounds.w * current.z <= availW && bounds.h * current.z <= availH;
      if (fits) {
        const left = current.x + bounds.x * current.z;
        const top = current.y + bounds.y * current.z;
        const right = left + bounds.w * current.z;
        const bottom = top + bounds.h * current.z;
        if (left >= margin && top >= margin && right <= vw - margin && bottom <= vh - margin) {
          return;
        }
      }
      const z = clamp(Math.min(current.z, availW / bounds.w, availH / bounds.h), MIN_Z, MAX_Z);
      const next = {
        z,
        x: vw / 2 - (bounds.x + bounds.w / 2) * z,
        y: vh / 2 - (bounds.y + bounds.h / 2) * z,
      };
      viewRef.current = next;
      setView(next);
    }, []);

    useImperativeHandle(ref, () => ({ frame }), [frame]);

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
          ref={contentRef}
          className="absolute top-0 left-0 w-max origin-top-left select-none"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
          }}
        >
          {children}
        </div>
      </div>
    );
  },
);
