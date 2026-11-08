import anime from "animejs";
import { useEffect, useRef } from "react";
import { GREEN } from "../lib/constants";
import type { MuscleKey } from "../lib/types";
import { MuscleMapWidget } from "../vendor/musclemap";
import type { BodyViewStyle, Muscle } from "../vendor/musclemap";

/* our muscle groups -> MuscleMapJS ids */
const MM_KEYS: Record<MuscleKey, Muscle[]> = {
  shoulders: ["deltoids"],
  chest: ["chest"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  abs: ["abs"],
  obliques: ["obliques"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves", "tibialis"],
  back: ["upper-back", "rhomboids"],
  traps: ["trapezius"],
  lowerback: ["lower-back"],
};

const CRT_STYLE: BodyViewStyle = {
  defaultFillColor: "rgba(24,120,66,0.42)",
  strokeColor: "#159a52",
  strokeWidth: 0.7,
  selectionColor: GREEN,
  selectionStrokeColor: "#b8ffd6",
  selectionStrokeWidth: 1.4,
  headColor: "rgba(24,120,66,0.42)",
  hairColor: "#0f5a31",
  shadowColor: "rgba(45,255,138,0.75)",
  shadowRadius: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
};

/** The widget measures itself with getBoundingClientRect; force a re-measure (private API). */
const remeasure = (w: MuscleMapWidget | null) => {
  try {
    (w as unknown as { resize: () => void })?.resize();
  } catch {
    /* ignore */
  }
};

/** Front + back muscle map. Worked muscles light up as a scan bar passes, then pulse. */
export function BodyMap({
  muscles,
  animKey,
  animate,
  gender,
}: {
  muscles: MuscleKey[];
  animKey: string;
  animate: boolean;
  gender: "male" | "female";
}) {
  const frontEl = useRef<HTMLDivElement>(null);
  const backEl = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const widgets = useRef<[MuscleMapWidget, MuscleMapWidget] | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const opt = (side: "front" | "back") => ({ gender, side, style: CRT_STYLE, interactive: false, multiSelect: true });
    widgets.current = [
      new MuscleMapWidget(frontEl.current!, opt("front")),
      new MuscleMapWidget(backEl.current!, opt("back")),
    ];
    const onReady = () => widgets.current?.forEach(remeasure);
    window.addEventListener("crt-ready", onReady);
    return () => {
      window.removeEventListener("crt-ready", onReady);
      widgets.current?.forEach((w) => w.destroy());
      widgets.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    widgets.current?.forEach((w) => w.setGender(gender));
  }, [gender]);

  useEffect(() => {
    const ws = widgets.current;
    if (!ws) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    ws.forEach(remeasure);
    const list = [...new Set(muscles.flatMap((m) => MM_KEYS[m] ?? []))];
    const light = (w: MuscleMapWidget, m: Muscle) => {
      try {
        w.highlight(m, GREEN, 0.95);
        w.select(m);
      } catch {
        /* unknown id for this model */
      }
    };
    ws.forEach((w) => {
      w.disablePulse();
      w.clearSelection();
      w.clearHighlights();
    });
    if (!animate) {
      ws.forEach((w) => list.forEach((m) => light(w, m)));
      return;
    }
    const H = frontEl.current?.clientHeight || 400,
      SWEEP = 1800;
    const tl = anime
      .timeline({ easing: "linear" })
      .add({ targets: bar.current, opacity: [0, 1], duration: 150 })
      .add({ targets: bar.current, translateY: [0, H], duration: SWEEP }, 150)
      .add({ targets: bar.current, opacity: [1, 0], duration: 250 }, 150 + SWEEP);
    ws.forEach((w) =>
      list.forEach((m) => {
        let r: { y: number } | null = null;
        try {
          r = w.getBoundingRect(m);
        } catch {
          /* ignore */
        }
        if (!r) return;
        const at = 150 + SWEEP * Math.max(0, Math.min(1, r.y / H));
        timers.current.push(window.setTimeout(() => light(w, m), at));
      }),
    );
    timers.current.push(
      window.setTimeout(
        () => {
          anime({
            targets: [frontEl.current, backEl.current].map((e) => e?.querySelector("canvas")),
            opacity: [1, 0.3, 1, 0.5, 1],
            duration: 450,
            easing: "steps(5)",
          });
          ws.forEach((w) => w.enablePulse(0.45, 0.55, 1));
        },
        150 + SWEEP + 100,
      ),
    );
    return () => {
      tl.pause();
      timers.current.forEach(clearTimeout);
    };
  }, [animKey, animate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="figwrap">
      <div className="mmv" ref={frontEl} />
      <div className="mmv mmb" ref={backEl} />
      <div className="mmlbl">
        <span>СПЕРЕДИ</span>
        <span>СЗАДИ</span>
      </div>
      <div className="mmstripes" />
      <div className="scanbar" ref={bar} />
    </div>
  );
}
