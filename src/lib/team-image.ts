import { publicAsset } from "@/lib/utils";
import { monster, type Family, type Monster } from "@/lib/monsters";
import { SLOT_CONTINUE, slotIsLarge, slotMonsterId, type Slots } from "@/lib/team";

const SLOT_W = 210;
const SLOT_GAP = 16;
const CARD_H = 236;
const SIDE = 32;
const CONTENT_W = 4 * SLOT_W + 3 * SLOT_GAP;
const HEADER_H = 72;

const FAMILY_COLOR: Record<Family, string> = {
  slime: "#2f9e6a",
  dragon: "#c94b3c",
  nature: "#5a9c32",
  beast: "#c4842a",
  material: "#6a7b8c",
  demon: "#8b4cb0",
  undead: "#4a8a8a",
  boss: "#8a6a2a",
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function loadWordmark(): Promise<HTMLImageElement | null> {
  const response = await fetch(publicAsset("synthline-gold.svg"));
  if (!response.ok) return null;
  const text = await response.text();
  const sized = text.includes("width=")
    ? text
    : text.replace("<svg ", '<svg width="292" height="42" ');
  const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  color: string,
  x: number,
  y: number,
  size: number,
) {
  const radius = 16;
  roundRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "#c9a056";
  ctx.fill();
  roundRect(ctx, x + 3, y + 3, size - 6, size - 6, radius - 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const inset = 7;
  const inner = size - inset * 2;
  ctx.save();
  roundRect(ctx, x + inset, y + inset, inner, inner, radius - 5);
  ctx.fillStyle = "#f3e4b8";
  ctx.fill();
  ctx.clip();
  if (image) ctx.drawImage(image, x + inset, y + inset, inner, inner);
  else {
    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, inner, inner);
  }
  ctx.restore();
}

function drawFamily(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  color: string,
  x: number,
  y: number,
  size: number,
) {
  const radius = 6;
  roundRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const inset = 3;
  const inner = size - inset * 2;
  ctx.save();
  roundRect(ctx, x + inset, y + inset, inner, inner, radius - 2);
  ctx.fillStyle = "#f3e4b8";
  ctx.fill();
  ctx.clip();
  if (image) ctx.drawImage(image, x + inset, y + inset, inner, inner);
  else {
    ctx.fillStyle = color;
    ctx.fillRect(x + inset, y + inset, inner, inner);
  }
  ctx.restore();
}

function drawRank(ctx: CanvasRenderingContext2D, rank: string, x: number, y: number, h: number) {
  ctx.font = "900 18px Nunito, Trebuchet MS, sans-serif";
  const w = Math.max(32, ctx.measureText(rank).width + 14);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const ring = 3;
  roundRect(ctx, x + ring, y + ring, w - ring * 2, h - ring * 2, 3);
  ctx.fillStyle = "#d87818";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rank, x + w / 2, y + h / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return w;
}

function drawLarge(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  ctx.font = "800 16px Nunito, Trebuchet MS, sans-serif";
  const w = ctx.measureText("Large").width + 16;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = "#e2b657";
  ctx.fill();
  ctx.fillStyle = "#3e250c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Large", x + w / 2, y + h / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return w;
}

async function drawMonster(
  ctx: CanvasRenderingContext2D,
  m: Monster,
  large: boolean,
  left: number,
  top: number,
  width: number,
) {
  const portrait = await loadImage(publicAsset(`portraits/${m.id}.png`));
  const family = await loadImage(publicAsset(`families/${m.family}.png`));
  const color = FAMILY_COLOR[m.family];
  const size = 118;
  drawPortrait(ctx, portrait, color, left + (width - size) / 2, top + 16, size);
  ctx.fillStyle = "#e2b657";
  ctx.font = "800 22px Nunito, Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(m.name, left + width / 2, top + 168, width - 24);

  const icon = 32;
  const badgeH = 28;
  const gap = 8;
  ctx.font = large
    ? "800 16px Nunito, Trebuchet MS, sans-serif"
    : "900 18px Nunito, Trebuchet MS, sans-serif";
  const badgeW = large
    ? ctx.measureText("Large").width + 16
    : Math.max(32, ctx.measureText(m.rank).width + 14);
  const rowW = icon + gap + badgeW;
  const rowX = left + (width - rowW) / 2;
  const rowY = top + 182;
  drawFamily(ctx, family, color, rowX, rowY, icon);
  if (large) drawLarge(ctx, rowX + icon + gap, rowY + (icon - badgeH) / 2, badgeH);
  else drawRank(ctx, m.rank, rowX + icon + gap, rowY + (icon - badgeH) / 2, badgeH);
  ctx.textAlign = "left";
}

async function drawBank(
  ctx: CanvasRenderingContext2D,
  slots: Slots,
  x: number,
  y: number,
  label: string,
) {
  ctx.fillStyle = "#3e250c";
  ctx.font = "700 22px Nunito, Trebuchet MS, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x, y);
  const top = y + 18;
  let index = 0;
  while (index < 4) {
    const id = slotMonsterId(slots, index);
    if (slots[index] === SLOT_CONTINUE) {
      index += 1;
      continue;
    }
    const large = slotIsLarge(slots, index);
    const span = large ? 2 : 1;
    const left = x + index * (SLOT_W + SLOT_GAP);
    const width = span * SLOT_W + (span - 1) * SLOT_GAP;
    roundRect(ctx, left, top, width, CARD_H, 18);
    ctx.fillStyle = "#3e250c";
    ctx.fill();
    if (id) {
      const m = monster(id);
      await drawMonster(ctx, m, large, left, top, width);
    }
    index += span;
  }
}

export async function renderTeamImage(main: Slots, reserve: Slots): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const mainLabelY = HEADER_H + 40;
  const mainCardsY = mainLabelY + 18;
  const reserveLabelY = mainCardsY + CARD_H + 40;
  const reserveCardsY = reserveLabelY + 18;
  canvas.width = CONTENT_W + SIDE * 2;
  canvas.height = reserveCardsY + CARD_H + SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the team image");
  ctx.fillStyle = "#f3e4b8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#3e250c";
  ctx.fillRect(0, 0, canvas.width, HEADER_H);
  const mark = await loadWordmark();
  if (mark) {
    const markH = 48;
    const markW = Math.round(markH * (mark.naturalWidth / mark.naturalHeight));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mark, SIDE, (HEADER_H - markH) / 2, markW, markH);
    ctx.imageSmoothingEnabled = true;
  }
  await drawBank(ctx, main, SIDE, mainLabelY, "Main party");
  await drawBank(ctx, reserve, SIDE, reserveLabelY, "Reserve");
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not save the team image");
  return blob;
}
