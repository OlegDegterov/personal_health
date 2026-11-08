import { WX_TXT, wxKind, type WxKind } from "../api/weather";
import { GREEN, MONTHS, VERSION, WEEKDAYS } from "../lib/constants";
import { deg, pad } from "../lib/format";
import type { Weather } from "../lib/types";

const WX_SVG: Record<WxKind, JSX.Element> = {
  sun: (
    <>
      <circle cx="32" cy="32" r="11" />
      <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.6 13.6l5.7 5.7M44.7 44.7l5.7 5.7M13.6 50.4l5.7-5.7M44.7 19.3l5.7-5.7" />
    </>
  ),
  moon: <path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" />,
  cloud: <path d="M18 48h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 48z" />,
  part: (
    <>
      <circle cx="22" cy="22" r="8" />
      <path d="M22 6v5M6 22h5M10.7 10.7l3.5 3.5M33.3 10.7l-3.5 3.5" />
      <path d="M22 52h26a9 9 0 0 0 0-18 13 13 0 0 0-25-2A10 10 0 0 0 22 52z" />
    </>
  ),
  fog: (
    <>
      <path d="M18 36h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 36z" />
      <path d="M10 44h44M14 52h36" />
    </>
  ),
  rain: (
    <>
      <path d="M18 40h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 40z" />
      <path d="M22 46l-3 8M32 46l-3 8M42 46l-3 8" />
    </>
  ),
  snow: (
    <>
      <path d="M18 40h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 40z" />
      <path d="M22 47v8M18 51h8M38 47v8M34 51h8M30 54v4" />
    </>
  ),
  storm: (
    <>
      <path d="M18 38h28a10 10 0 0 0 0-20 14 14 0 0 0-27-3A11 11 0 0 0 18 38z" />
      <path d="M34 40l-7 10h8l-6 10" />
    </>
  ),
};

export function Clock({ now }: { now: Date }) {
  return (
    <>
      <div className="clock">
        {pad(now.getHours())}:{pad(now.getMinutes())}
        <span className="sec">{pad(now.getSeconds())}</span>
      </div>
      <div className="date">
        {WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}
      </div>
    </>
  );
}

export function WeatherBlock({ wx, place }: { wx: Weather | null; place: string }) {
  if (!wx) return <div className="wx" />;
  return (
    <div className="wx">
      <svg viewBox="0 0 64 64" fill="none" stroke={GREEN} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {WX_SVG[wxKind(wx.code, wx.day)]}
      </svg>
      <div className="wt">
        <div className="now">{deg(wx.t)}</div>
        <div className="mm">
          МИН {deg(wx.min)} · МАКС {deg(wx.max)}
        </div>
        <div className="ds dim">
          {WX_TXT[wx.code] ?? ""} · {place.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export function StatusBlock(p: {
  demo: boolean;
  lastOk: Date | null;
  nextAt: number;
  error: string | null;
  loading: boolean;
  now: Date;
  page: number;
  pages: number;
  onRefresh: () => void;
  onSettings: () => void;
  onExit: () => void;
  onPage: (d: number) => void;
}) {
  const parts = [VERSION];
  if (p.demo) parts.push("ДЕМО");
  if (p.loading) parts.push("ОБНОВЛЕНИЕ...");
  else if (p.lastOk) parts.push(`СИНХР ${pad(p.lastOk.getHours())}:${pad(p.lastOk.getMinutes())}`);
  if (p.nextAt) parts.push(`СЛЕД ${Math.max(0, Math.round((p.nextAt - p.now.getTime()) / 60000))} МИН`);
  return (
    <div className="status">
      <div>
        {parts.join(" · ")}
        {p.error && (
          <>
            <br />
            <span className="err">! {p.error.substr(0, 160)}</span>
          </>
        )}
      </div>
      <div style={{ marginTop: "1vh" }}>
        <span className="btn" onClick={p.onRefresh}>
          [ОБНОВИТЬ]
        </span>
        <span className="btn" onClick={p.onSettings}>
          [НАСТРОЙКИ]
        </span>
        <span className="btn" onClick={p.onExit}>
          [ВЫХОД]
        </span>
      </div>
      <div className="pager">
        <span className="btn" onClick={() => p.onPage(-1)}>
          [&lt;]
        </span>
        <span className="pgnum">
          {p.page}/{p.pages}
        </span>
        <span className="btn" onClick={() => p.onPage(1)}>
          [&gt;]
        </span>
      </div>
    </div>
  );
}
