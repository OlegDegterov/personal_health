import { WD_SHORT } from "./constants";

export const pad = (n: number) => (n < 10 ? "0" : "") + n;
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fmtInt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
export const hm = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}Ч${pad(m % 60)}М`;
};
export const hms = (sec: number) => hm(sec / 3600);
export const segBar = (frac: number, n = 18) => {
  const f = Math.max(0, Math.min(n, Math.round(frac * n)));
  return "█".repeat(f) + "░".repeat(n - f);
};
export const dmy = (st: string) => (st ? `${st.substr(8, 2)}.${st.substr(5, 2)}` : "");
export const fmtDay = (isoDate: string) => {
  const p = isoDate.split("-");
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return `${WD_SHORT[d.getDay()]} ${p[2]}.${p[1]}`;
};
/** Garmin sleep timestamps are local time encoded as UTC epoch ms */
export const clk = (ms: number | null) => {
  if (!ms) return "—";
  const d = new Date(ms);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
export const pace = (spd?: number | null) => {
  if (!spd) return "—";
  const sk = 1000 / spd;
  return `${Math.floor(sk / 60)}:${pad(Math.round(sk % 60))}/КМ`;
};
export const mmss = (sec?: number | null) => {
  if (!sec) return "—";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60);
  return `${h ? `${h}:${pad(m)}` : m}:${pad(sec % 60)}`;
};
export const deg = (t: number) => {
  const r = Math.round(t);
  return `${r > 0 ? "+" : ""}${r}°`;
};
