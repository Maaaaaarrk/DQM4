import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MonsterCard } from "@/components/monster-card";
import { WildcardCard } from "@/components/wildcard-card";
import {
  familyMembers,
  hasParents,
  monster,
  parentKey,
  type Family,
  type ParentRef,
  type Rank,
} from "@/lib/monsters";

export type TreeOrient = "horizontal" | "vertical";

type Size = { w: number; h: number; ax: number; ay: number };
type Metrics = Record<string, Size>;
type Picks = Record<string, string>;

type NodeKind =
  { type: "species"; id: string } | { type: "family"; tokenId: string; family: Family; rank: Rank };

type Box = {
  path: string;
  node: NodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  ax: number;
  ay: number;
  focus: boolean;
  expandable: boolean;
};

type Wire =
  | {
      type: "root";
      x0: number;
      y0: number;
      railX: number;
      y1a: number;
      y1b: number;
      ax: number;
      ay: number;
      bx: number;
      by: number;
      jx: number;
      jy: number;
    }
  | {
      type: "tee";
      ax: number;
      ay: number;
      bx: number;
      by: number;
      cx: number;
      cy: number;
      jx: number;
      jy: number;
    };

const FALLBACK: Size = { w: 260, h: 84, ax: 42, ay: 42 };
const MIN_LINE = 24;
const CARD_GAP = 12;
const ROW_GAP = 28;
const SUBTREE_GAP = 32;
const V_STACK = 32;
const H_GAP = 32;
const PAD = 28;
const NODE_R = 6;

function childPath(parentPath: string, slot: "0" | "1" | "up" | "dn", key: string) {
  return `${parentPath}/${slot}:${key}`;
}

function fromRef(ref: ParentRef): NodeKind {
  if (ref.type === "species") return { type: "species", id: ref.id };
  return {
    type: "family",
    tokenId: ref.tokenId,
    family: ref.family,
    rank: ref.rank,
  };
}

function speciesId(node: NodeKind, path: string, picks: Picks): string | null {
  if (node.type === "species") return node.id;
  return picks[path] || null;
}

function sz(path: string, metrics: Metrics): Size {
  return metrics[path] ?? FALLBACK;
}

function canOpen(node: NodeKind, path: string, picks: Picks, ancestors: Set<string>): boolean {
  const id = speciesId(node, path, picks);
  if (!id || !hasParents(id) || ancestors.has(id)) return false;
  return true;
}

function directChildren(path: string, boxes: Box[]): Box[] {
  const prefix = `${path}/`;
  return boxes.filter((b) => {
    if (!b.path.startsWith(prefix)) return false;
    return !b.path.slice(prefix.length).includes("/");
  });
}

function overlaps(a: Box, b: Box, gap: number): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function translate(boxes: Box[], dx: number, dy: number): Box[] {
  return boxes.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy }));
}

function clearFocus(boxes: Box[]) {
  const focus = boxes.find((b) => b.focus);
  if (!focus) return;
  let dx = 0;
  for (const b of boxes) {
    if (b.focus) continue;
    if (!overlaps(b, focus, CARD_GAP)) continue;
    dx = Math.max(dx, focus.x + focus.w + CARD_GAP - b.x);
  }
  if (dx > 0.5) {
    for (const b of boxes) {
      if (!b.focus) b.x += dx;
    }
  }
}

type Packed = {
  boxes: Box[];
  w: number;
  h: number;
  cardX: number;
  cardY: number;
  ax: number;
  ay: number;
};

function layoutSubtree(
  node: NodeKind,
  path: string,
  dir: "up" | "down",
  open: Set<string>,
  metrics: Metrics,
  picks: Picks,
  ancestors: Set<string>,
): Packed {
  const self = sz(path, metrics);
  const id = speciesId(node, path, picks);
  const looping = Boolean(id && ancestors.has(id));
  const expandable = canOpen(node, path, picks, ancestors);
  const card: Box = {
    path,
    node,
    x: 0,
    y: 0,
    w: self.w,
    h: self.h,
    ax: self.ax,
    ay: self.ay,
    focus: false,
    expandable,
  };

  if (looping || !open.has(path) || !expandable || !id) {
    return {
      boxes: [card],
      w: self.w,
      h: self.h,
      cardX: 0,
      cardY: 0,
      ax: self.ax,
      ay: self.ay,
    };
  }

  const next = new Set(ancestors);
  next.add(id);
  const [pa, pb] = monster(id).parents as [ParentRef, ParentRef];
  const L = layoutSubtree(
    fromRef(pa),
    childPath(path, "0", parentKey(pa)),
    dir,
    open,
    metrics,
    picks,
    next,
  );
  const R = layoutSubtree(
    fromRef(pb),
    childPath(path, "1", parentKey(pb)),
    dir,
    open,
    metrics,
    picks,
    next,
  );

  const rX0 = L.w + SUBTREE_GAP;
  const mid0 = (L.cardX + L.ax + rX0 + R.cardX + R.ax) / 2;
  let childX = mid0 - self.ax;
  let shift = 0;
  if (childX < 0) {
    shift = -childX;
    childX = 0;
  }
  const lX = shift;
  const rX = shift + rX0;
  const mid = (lX + L.cardX + L.ax + rX + R.cardX + R.ax) / 2;
  childX = mid - self.ax;
  const totalW = Math.max(childX + self.w, rX + R.w);

  if (dir === "down") {
    card.x = childX;
    card.y = 0;
    const pY = self.h + ROW_GAP;
    return {
      boxes: [card, ...translate(L.boxes, lX, pY), ...translate(R.boxes, rX, pY)],
      w: totalW,
      h: self.h + ROW_GAP + Math.max(L.h, R.h),
      cardX: childX,
      cardY: 0,
      ax: self.ax,
      ay: self.ay,
    };
  }

  const pH = Math.max(L.h, R.h);
  card.x = childX;
  card.y = pH + ROW_GAP;
  return {
    boxes: [...translate(L.boxes, lX, pH - L.h), ...translate(R.boxes, rX, pH - R.h), card],
    w: totalW,
    h: pH + ROW_GAP + self.h,
    cardX: childX,
    cardY: card.y,
    ax: self.ax,
    ay: self.ay,
  };
}

function clamp(n: number, lo: number, hi: number) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.max(lo, Math.min(hi, n));
}

function buildWires(rootId: string, boxes: Box[], orient: TreeOrient): Wire[] {
  const wires: Wire[] = [];
  const focus = boxes.find((b) => b.focus);
  if (focus && orient === "horizontal") {
    const kids = directChildren(rootId, boxes).sort((a, b) => a.y - b.y);
    if (kids.length === 2) {
      const [p1, p2] = kids;
      const ax = p1.x + p1.ax;
      const ay = p1.y + p1.ay;
      const bx = p2.x + p2.ax;
      const by = p2.y + p2.ay;
      const x0 = focus.x + focus.w;
      const y0 = focus.y + focus.ay;
      // Keep the rail in the gutter left of the parent cards. Anchoring it on
      // the portrait center draws the join through the cards, so after a
      // collapse it looks like a stub that never reaches the focus.
      const parentsLeft = Math.min(p1.x, p2.x);
      let railX = (x0 + parentsLeft) / 2;
      if (parentsLeft - x0 < 16) railX = x0 + Math.max(0, parentsLeft - x0) / 2;
      else railX = Math.min(Math.max(railX, x0 + 8), parentsLeft - 8);
      wires.push({
        type: "root",
        x0,
        y0,
        railX,
        y1a: ay,
        y1b: by,
        ax,
        ay,
        bx,
        by,
        jx: railX,
        jy: y0,
      });
    }
  }

  for (const b of boxes) {
    if (b.focus && orient === "horizontal") continue;
    const kids = directChildren(b.path, boxes);
    if (kids.length !== 2) continue;
    const [p1, p2] = kids[0].x <= kids[1].x ? kids : [kids[1], kids[0]];
    const ax = p1.x + p1.ax;
    const ay = p1.y + p1.ay;
    const bx = p2.x + p2.ax;
    const by = p2.y + p2.ay;
    const cx = b.x + b.ax;
    const cy = b.y + b.ay;
    const parentMidY = (p1.y + p1.h / 2 + p2.y + p2.h / 2) / 2;
    const parentsAbove = parentMidY < b.y;
    let barY: number;
    if (parentsAbove) {
      const parentBottom = Math.max(p1.y + p1.h, p2.y + p2.h);
      barY = parentBottom + (b.y - parentBottom) / 2;
    } else {
      const parentTop = Math.min(p1.y, p2.y);
      barY = (b.y + b.h + parentTop) / 2;
    }
    const left = Math.min(ax, bx);
    const right = Math.max(ax, bx);
    const jx = clamp(cx, left, right);
    wires.push({
      type: "tee",
      ax,
      ay,
      bx,
      by,
      cx,
      cy,
      jx,
      jy: barY,
    });
  }
  return wires;
}

function layout(
  rootId: string,
  open: Set<string>,
  metrics: Metrics,
  picks: Picks,
  orient: TreeOrient,
) {
  const boxes: Box[] = [];
  const rootPath = rootId;
  const focus = sz(rootPath, metrics);
  const root = monster(rootId);
  const rootNode: NodeKind = { type: "species", id: rootId };

  if (root.parents.length !== 2) {
    boxes.push({
      path: rootPath,
      node: rootNode,
      x: 0,
      y: 0,
      w: focus.w,
      h: focus.h,
      ax: focus.ax,
      ay: focus.ay,
      focus: true,
      expandable: false,
    });
  } else {
    const [p1, p2] = root.parents;
    const n1 = fromRef(p1);
    const n2 = fromRef(p2);
    const path1 = childPath(rootPath, "up", parentKey(p1));
    const path2 = childPath(rootPath, "dn", parentKey(p2));
    const seen = new Set([rootId]);
    const L = layoutSubtree(
      n1,
      path1,
      orient === "vertical" ? "down" : "up",
      open,
      metrics,
      picks,
      seen,
    );
    const R = layoutSubtree(n2, path2, "down", open, metrics, picks, seen);

    if (orient === "vertical") {
      const rX0 = L.w + SUBTREE_GAP;
      const mid0 = (L.cardX + L.ax + rX0 + R.cardX + R.ax) / 2;
      let childX = mid0 - focus.ax;
      let shift = 0;
      if (childX < 0) {
        shift = -childX;
        childX = 0;
      }
      const lX = shift;
      const rX = shift + rX0;
      const mid = (lX + L.cardX + L.ax + rX + R.cardX + R.ax) / 2;
      childX = mid - focus.ax;
      const pY = focus.h + ROW_GAP;
      boxes.push({
        path: rootPath,
        node: rootNode,
        x: childX,
        y: 0,
        w: focus.w,
        h: focus.h,
        ax: focus.ax,
        ay: focus.ay,
        focus: true,
        expandable: false,
      });
      boxes.push(...translate(L.boxes, lX, pY));
      boxes.push(...translate(R.boxes, rX, pY));
    } else {
      const colX = focus.w + H_GAP;
      const upOX = colX - L.cardX;
      const dnOX = colX - R.cardX;
      const upOY = 0;
      const dnOY = L.h + V_STACK;
      boxes.push(...translate(L.boxes, upOX, upOY));
      boxes.push(...translate(R.boxes, dnOX, dnOY));
      const p1ay = upOY + L.cardY + L.ay;
      const p2ay = dnOY + R.cardY + R.ay;
      boxes.push({
        path: rootPath,
        node: rootNode,
        x: 0,
        y: (p1ay + p2ay) / 2 - focus.ay,
        w: focus.w,
        h: focus.h,
        ax: focus.ax,
        ay: focus.ay,
        focus: true,
        expandable: false,
      });
      clearFocus(boxes);
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    maxX = Math.max(maxX, b.x + b.w);
    minY = Math.min(minY, b.y);
    maxY = Math.max(maxY, b.y + b.h);
  }
  const dx = PAD - minX;
  const dy = PAD - minY;
  for (const b of boxes) {
    b.x += dx;
    b.y += dy;
  }
  const wires = buildWires(rootId, boxes, orient);
  return {
    boxes,
    wires,
    width: maxX - minX + PAD * 2,
    height: maxY - minY + PAD * 2,
  };
}

function expandDeep(
  id: string,
  path: string,
  into: Set<string>,
  ancestors: Set<string> = new Set(),
  picks: Picks = {},
) {
  if (ancestors.has(id) || !hasParents(id)) return;
  into.add(path);
  const next = new Set(ancestors);
  next.add(id);
  const [a, b] = monster(id).parents as [ParentRef, ParentRef];
  const pathA = childPath(path, "0", parentKey(a));
  const pathB = childPath(path, "1", parentKey(b));
  const idA = a.type === "species" ? a.id : picks[pathA];
  const idB = b.type === "species" ? b.id : picks[pathB];
  if (idA) expandDeep(idA, pathA, into, next, picks);
  if (idB) expandDeep(idB, pathB, into, next, picks);
}

function expandScoutable(
  id: string,
  path: string,
  into: Set<string>,
  ancestors: Set<string> = new Set(),
  picks: Picks = {},
) {
  if (ancestors.has(id) || !hasParents(id)) return;
  if (!monster(id).synthOnly) return;
  into.add(path);
  const next = new Set(ancestors);
  next.add(id);
  const [a, b] = monster(id).parents as [ParentRef, ParentRef];
  const pathA = childPath(path, "0", parentKey(a));
  const pathB = childPath(path, "1", parentKey(b));
  const idA = a.type === "species" ? a.id : picks[pathA];
  const idB = b.type === "species" ? b.id : picks[pathB];
  if (idA) expandScoutable(idA, pathA, into, next, picks);
  if (idB) expandScoutable(idB, pathB, into, next, picks);
}

function expandScoutablePaths(rootId: string, picks: Picks): Set<string> {
  const s = new Set<string>();
  const root = monster(rootId);
  if (root.parents.length !== 2) return s;
  const [p1, p2] = root.parents;
  const path1 = childPath(rootId, "up", parentKey(p1));
  const path2 = childPath(rootId, "dn", parentKey(p2));
  const seen = new Set([rootId]);
  const id1 = p1.type === "species" ? p1.id : picks[path1];
  const id2 = p2.type === "species" ? p2.id : picks[path2];
  if (id1) expandScoutable(id1, path1, s, seen, picks);
  if (id2) expandScoutable(id2, path2, s, seen, picks);
  return s;
}

function expandAllPaths(rootId: string, picks: Picks): Set<string> {
  const s = new Set<string>();
  const root = monster(rootId);
  if (root.parents.length !== 2) return s;
  const [p1, p2] = root.parents;
  const path1 = childPath(rootId, "up", parentKey(p1));
  const path2 = childPath(rootId, "dn", parentKey(p2));
  const seen = new Set([rootId]);
  const id1 = p1.type === "species" ? p1.id : picks[path1];
  const id2 = p2.type === "species" ? p2.id : picks[path2];
  if (id1) expandDeep(id1, path1, s, seen, picks);
  if (id2) expandDeep(id2, path2, s, seen, picks);
  return s;
}

function readSize(el: HTMLElement): Size {
  const w = Math.ceil(el.offsetWidth);
  const h = Math.ceil(el.offsetHeight);
  const anchor = el.querySelector("[data-anchor]");
  if (!(anchor instanceof HTMLElement) || w === 0 || h === 0) {
    return { w, h, ax: 42, ay: h / 2 };
  }
  // offsetLeft/Top ignore the viewport's CSS zoom. Screen rects do not, and
  // once the tree is larger than the screen those rects get clipped, so the
  // next expand draws the wires off the portraits.
  return {
    w,
    h,
    ax: Math.round(anchor.offsetLeft + anchor.offsetWidth / 2),
    ay: Math.round(anchor.offsetTop + anchor.offsetHeight / 2),
  };
}

function sameSize(a: Size | undefined, b: Size): boolean {
  if (!a) return false;
  return a.w === b.w && a.h === b.h && a.ax === b.ax && a.ay === b.ay;
}

export type ExpandCommand = { action: "all" | "scoutable" | "none"; seq: number };

export function FamilyTree({
  rootId,
  orient = "horizontal",
  expandCommand,
  onStructureChange,
}: {
  rootId: string;
  orient?: TreeOrient;
  expandCommand?: ExpandCommand;
  /** Fired after expand/minimize. `path` is the toggled card; omitted for the whole tree. */
  onStructureChange?: (path?: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (rootId === "warhog") {
      const root = monster(rootId);
      if (root.parents.length === 2) {
        const [p1, p2] = root.parents;
        if (p1.type === "species") {
          expandDeep(p1.id, childPath(rootId, "up", p1.id), s);
        }
        if (p2.type === "species") {
          expandDeep(p2.id, childPath(rootId, "dn", p2.id), s);
        }
      }
    }
    return s;
  });
  const [picks, setPicks] = useState<Picks>({});
  const [metrics, setMetrics] = useState<Metrics>({});
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFrame = useRef<string | null | undefined>(undefined);
  const onStructureChangeRef = useRef(onStructureChange);
  onStructureChangeRef.current = onStructureChange;

  function requestRecenter(path?: string) {
    pendingFrame.current = path ?? null;
  }

  const { boxes, wires, width, height } = useMemo(
    () => layout(rootId, open, metrics, picks, orient),
    [rootId, open, metrics, picks, orient],
  );

  useEffect(() => {
    if (!expandCommand || expandCommand.seq === 0) return;
    if (expandCommand.action === "none") setOpen(new Set());
    else if (expandCommand.action === "scoutable") {
      setOpen(expandScoutablePaths(rootId, picks));
    } else setOpen(expandAllPaths(rootId, picks));
    requestRecenter();
  }, [expandCommand, rootId]);

  useLayoutEffect(() => {
    const next: Metrics = { ...metrics };
    let changed = false;
    for (const b of boxes) {
      const el = nodeRefs.current.get(b.path);
      if (!el) continue;
      const s = readSize(el);
      if (!sameSize(metrics[b.path], s)) {
        next[b.path] = s;
        changed = true;
      }
    }
    if (changed) {
      setMetrics(next);
      return;
    }
    if (pendingFrame.current !== undefined) {
      const path = pendingFrame.current ?? undefined;
      pendingFrame.current = undefined;
      onStructureChangeRef.current?.(path);
    }
  }, [boxes, metrics]);

  function toggle(path: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        for (const p of next) {
          if (p === path || p.startsWith(`${path}/`)) next.delete(p);
        }
      } else {
        next.add(path);
      }
      return next;
    });
    requestRecenter(path);
  }

  function pick(path: string, id: string) {
    setPicks((prev) => {
      const next = { ...prev };
      if (id) next[path] = id;
      else delete next[path];
      return next;
    });
    setOpen((prev) => {
      const next = new Set(prev);
      for (const p of next) {
        if (p.startsWith(`${path}/`)) next.delete(p);
      }
      if (!id) next.delete(path);
      return next;
    });
    requestRecenter(path);
  }

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        {wires.map((w, i) =>
          w.type === "root" ? (
            <g key={i}>
              <path
                d={`M ${w.x0} ${w.y0} H ${w.railX} M ${w.ax} ${w.ay} H ${w.railX} M ${w.bx} ${w.by} H ${w.railX} M ${w.railX} ${w.y1a} V ${w.y1b}`}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={w.jx}
                cy={w.jy}
                r={NODE_R}
                fill="var(--color-line)"
                stroke="var(--color-parchment)"
                strokeWidth="2"
              />
            </g>
          ) : (
            <g key={i}>
              <path
                d={`M ${w.ax} ${w.ay} V ${w.jy} M ${w.bx} ${w.by} V ${w.jy} M ${w.ax} ${w.jy} H ${w.bx} M ${w.cx} ${w.cy} V ${w.jy} H ${w.jx}`}
                fill="none"
                stroke="var(--color-line)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={w.jx}
                cy={w.jy}
                r={NODE_R}
                fill="var(--color-line)"
                stroke="var(--color-parchment)"
                strokeWidth="2"
              />
            </g>
          ),
        )}
      </svg>
      {boxes.map((b) => (
        <div
          key={b.path}
          data-path={b.path}
          className="absolute"
          style={{ left: b.x, top: b.y }}
          ref={(el) => {
            if (el) nodeRefs.current.set(b.path, el);
            else nodeRefs.current.delete(b.path);
          }}
        >
          {b.node.type === "family" ? (
            <WildcardCard
              family={b.node.family}
              rank={b.node.rank}
              members={familyMembers(b.node.family, b.node.rank)}
              value={picks[b.path] ?? ""}
              onChange={(id) => pick(b.path, id)}
              expandable={b.expandable}
              expanded={open.has(b.path)}
              onToggle={() => toggle(b.path)}
            />
          ) : (
            <MonsterCard
              monster={monster(b.node.id)}
              variant={b.focus ? "focus" : "parent"}
              expandable={b.expandable}
              expanded={open.has(b.path)}
              onToggle={() => toggle(b.path)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
