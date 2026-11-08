import anime from "animejs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSize } from "../hooks/useMisc";
import { segBar } from "../lib/format";

export function Frame({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`frame ${className}`}>
      <div className="ttl">{title}</div>
      {children}
    </div>
  );
}

/** Segment bar ███░░░ that fills step by step when animations are on. */
export function SegBar({ frac, n = 18, animate }: { frac: number; n?: number; animate: boolean }) {
  const f = Math.max(0, Math.min(1, frac || 0));
  const [shown, setShown] = useState(animate ? 0 : f);
  useEffect(() => {
    if (!animate) {
      setShown(f);
      return;
    }
    const o = { f: 0 };
    const a = anime({
      targets: o,
      f,
      duration: 200 + f * 1100,
      easing: `steps(${Math.max(1, Math.round(f * n))})`,
      update: () => setShown(o.f),
    });
    return () => a.pause();
  }, [f, n, animate]);
  return <>{segBar(shown, n)}</>;
}

export function Kv({
  k,
  children,
  frac,
  animate = false,
}: {
  k: string;
  children?: ReactNode;
  frac?: number;
  animate?: boolean;
}) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      {frac !== undefined && (
        <>
          <span className="bar">
            <SegBar frac={frac} n={10} animate={animate} />
          </span>{" "}
        </>
      )}
      {children}
    </div>
  );
}

/** Prints text letter by letter whenever it changes. */
export function Typewriter({ text, animate }: { text: string; animate: boolean }) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate) {
      setN(text.length);
      return;
    }
    const o = { n: 0 };
    const a = anime({
      targets: o,
      n: text.length,
      round: 1,
      duration: Math.min(1400, 60 * text.length),
      easing: "linear",
      update: () => setN(o.n),
    });
    return () => a.pause();
  }, [text, animate]);
  return <>{text.substr(0, n)}</>;
}

export const fontPx = () => Math.max(9, Math.round(window.innerHeight * 0.016));

/**
 * Canvas that fills its frame. `draw(ctx, w, h, progress)` is called on resize and data change;
 * when `animate` is on, progress grows 0→1 each time `animKey` changes.
 */
export function CanvasBox({
  draw,
  animKey,
  animate,
}: {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, prog: number) => void;
  animKey: string;
  animate: boolean;
}) {
  const [boxRef, size] = useSize<HTMLDivElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const paint = (p: number) => {
    const c = canvas.current;
    if (!c || !size.w || !size.h) return;
    c.width = size.w;
    c.height = size.h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    drawRef.current(ctx, c.width, c.height, p);
  };
  const lastKey = useRef<string>("");
  useEffect(() => {
    if (!size.w) return;
    if (animate && animKey !== lastKey.current) {
      lastKey.current = animKey;
      const g = { p: 0 };
      const a = anime({ targets: g, p: 1, duration: 1100, easing: "easeOutQuart", update: () => paint(g.p) });
      return () => a.pause();
    }
    lastKey.current = animKey;
    paint(1);
  }, [size.w, size.h, animKey, animate]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="cvbox" ref={boxRef}>
      <canvas ref={canvas} />
    </div>
  );
}
