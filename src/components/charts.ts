/* Canvas drawing routines for the CRT bar charts. */
import { GREEN, MID, PHASE_COLORS } from "../lib/constants";
import { dmy, pace } from "../lib/format";
import type { Activity, Day } from "../lib/types";
import { fontPx } from "./ui";

function dashed(ctx: CanvasRenderingContext2D, y: number, w: number) {
  ctx.strokeStyle = MID;
  ctx.lineWidth = 1;
  for (let dx = 0; dx < w; dx += 8) {
    ctx.beginPath();
    ctx.moveTo(dx, y);
    ctx.lineTo(dx + 4, y);
    ctx.stroke();
  }
}

/** Daily bars with a dashed reference line (goal). */
export function drawDayBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  prog: number,
  days: Day[],
  field: "steps" | "sleepH",
  ref: number,
  fmt: (v: number) => string,
) {
  const fpx = fontPx(),
    top = fpx + 6,
    bottom = h - fpx - 6;
  let max = ref || 0;
  for (const d of days) if ((d[field] ?? 0) > max) max = d[field] as number;
  if (!max) max = 1;
  max *= 1.12;
  const step = w / days.length,
    bw = step * 0.6;
  dashed(ctx, bottom - (ref / max) * (bottom - top), w);
  ctx.font = `${fpx}px Consolas, monospace`;
  ctx.textAlign = "center";
  const every = days.length > 14 ? 5 : days.length > 7 ? 2 : 1;
  days.forEach((d, i) => {
    const v = d[field],
      x = step * i + (step - bw) / 2;
    if (v !== null && v !== undefined) {
      const bh = (v / max) * (bottom - top) * prog;
      ctx.fillStyle = GREEN;
      ctx.globalAlpha = i === days.length - 1 ? 1 : 0.6;
      ctx.fillRect(x, bottom - bh, bw, bh);
      ctx.globalAlpha = 1;
      if (days.length <= 14 && prog > 0.9) ctx.fillText(fmt(v), x + bw / 2, bottom - bh - 4);
    }
    if ((days.length - 1 - i) % every === 0) {
      ctx.fillStyle = MID;
      ctx.fillText(days.length > 7 ? d.date.substr(8, 2) : d.wd, x + bw / 2, h - 2);
    }
  });
}

/** Stacked sleep phases per night, score above each bar. */
export function drawPhases(ctx: CanvasRenderingContext2D, w: number, h: number, prog: number, nights: Day[]) {
  const fpx = fontPx(),
    top = fpx + 6,
    bottom = h - fpx - 6;
  let max = 9;
  for (const n of nights) {
    const s = n.sl!;
    max = Math.max(max, (s.deep + s.light + s.rem + s.awake) / 3600);
  }
  const step = w / Math.max(1, nights.length),
    bw = step * 0.55,
    sc = ((bottom - top) / max) * prog;
  ctx.font = `${fpx}px Consolas, monospace`;
  ctx.textAlign = "center";
  dashed(ctx, bottom - 8 * ((bottom - top) / max), w);
  nights.forEach((n, i) => {
    const s = n.sl!,
      x = step * i + (step - bw) / 2;
    let y = bottom;
    for (const [k, v] of [
      ["deep", s.deep],
      ["light", s.light],
      ["rem", s.rem],
      ["awake", s.awake],
    ] as const) {
      const hh = (v / 3600) * sc;
      ctx.fillStyle = PHASE_COLORS[k];
      ctx.fillRect(x, y - hh, bw, hh);
      y -= hh;
    }
    ctx.fillStyle = GREEN;
    if (s.score !== null && prog > 0.9) ctx.fillText(String(s.score), x + bw / 2, y - 4);
    ctx.fillStyle = MID;
    ctx.fillText(nights.length > 7 ? n.date.substr(8, 2) : n.wd, x + bw / 2, h - 2);
  });
}

/** Distance bars for recent runs, pace above. */
export function drawRuns(ctx: CanvasRenderingContext2D, w: number, h: number, prog: number, runs: Activity[]) {
  const fpx = fontPx(),
    top = fpx * 2 + 10,
    bottom = h - fpx - 6;
  let max = 5;
  for (const r of runs) max = Math.max(max, (r.dist || 0) / 1000);
  max *= 1.1;
  const step = w / Math.max(5, runs.length),
    bw = step * 0.55;
  ctx.font = `${fpx}px Consolas, monospace`;
  ctx.textAlign = "center";
  runs.forEach((r, i) => {
    const km = (r.dist || 0) / 1000,
      x = step * i + (step - bw) / 2,
      bh = (km / max) * (bottom - top) * prog;
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = i === runs.length - 1 ? 1 : 0.6;
    ctx.fillRect(x, bottom - bh, bw, bh);
    ctx.globalAlpha = 1;
    if (prog > 0.9) {
      ctx.fillText(km.toFixed(1), x + bw / 2, bottom - bh - fpx - 6);
      ctx.fillStyle = MID;
      ctx.fillText(pace(r.run?.spd).replace("/КМ", ""), x + bw / 2, bottom - bh - 4);
    }
    ctx.fillStyle = MID;
    ctx.fillText(dmy(r.start), x + bw / 2, h - 2);
  });
  if (!runs.length) {
    ctx.fillStyle = MID;
    ctx.fillText("НЕТ ПРОБЕЖЕК", w / 2, h / 2);
  }
}
