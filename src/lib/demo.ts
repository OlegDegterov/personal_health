import { WD_SHORT } from "./constants";
import { iso } from "./format";
import type { DashData } from "./types";

/** Random data for demo mode (no Garmin requests). */
export function demoData(daysN: number): DashData {
  const now = new Date();
  const r = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
  const days = [];
  for (let i = daysN - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const deep = r(3600, 6000),
      light = r(14000, 19000),
      rem = r(4500, 7000),
      awake = r(600, 2400);
    const start = Date.UTC(2026, 0, 1, 23, r(0, 50)) + 0;
    days.push({
      date: iso(d),
      wd: WD_SHORT[d.getDay()],
      steps: r(4000, 13000),
      goal: 10000,
      sleepH: (deep + light + rem) / 3600,
      rhr: r(50, 58),
      bbMax: r(60, 100),
      bbMin: r(20, 40),
      bbNow: r(25, 80),
      stress: r(15, 45),
      im: r(0, 60),
      imGoal: 150,
      kcal: r(200, 900),
      sl: {
        score: r(70, 93),
        qual: "GOOD",
        deep,
        light,
        rem,
        awake,
        start,
        end: start + (deep + light + rem + awake) * 1000,
        hr: r(52, 58),
        resp: 14,
        respLo: 10,
        respHi: 19,
        stress: r(12, 25),
        awakeN: r(0, 4),
        need: 510,
        remP: 22,
        deepP: 17,
        lightP: 61,
        sub: [
          ["ДЛИТЕЛЬНОСТЬ", "GOOD"],
          ["СТРЕСС", "GOOD"],
          ["ПРОБУЖДЕНИЯ", "FAIR"],
        ] as [string, string | null][],
      },
    });
  }
  const t = (dAgo: number, hm: string) => `${iso(new Date(now.getTime() - dAgo * 86400000))} ${hm}:00`;
  return {
    days,
    acts: [
      {
        name: "Power Builder 4",
        type: "strength_training",
        muscles: ["hamstrings", "glutes", "lowerback", "back", "quads", "abs", "shoulders"],
        start: t(0, "07:30"),
        dist: null,
        dur: 3400,
        hr: 118,
        kcal: 310,
        maxHr: 150,
        teA: 2.1,
        teN: 1.4,
        sets: [
          { category: "DEADLIFT", subCategory: "BARBELL_DEADLIFT", sets: 4, reps: 20 },
          { category: "LUNGE", subCategory: "WALKING_LUNGE", sets: 2, reps: 32 },
        ],
      },
      {
        name: "Base run",
        type: "running",
        muscles: ["quads", "hamstrings", "glutes", "calves"],
        start: t(1, "19:40"),
        dist: 6420,
        dur: 2140,
        hr: 148,
        kcal: 420,
        maxHr: 170,
        teA: 3.1,
        teN: 0.8,
        run: {
          spd: 3.0,
          gap: 3.02,
          cad: 172,
          stride: 104,
          vo: 8.2,
          gct: 262,
          vr: 7.9,
          pw: 330,
          npw: 345,
          up: 40,
          down: 38,
          load: 120,
          label: "BASE",
          vo2: 52,
          k1: 320,
          k5: 1640,
          k10: null,
          z: [60, 600, 1100, 300, 20],
        },
      },
      {
        name: "Велосипед",
        type: "cycling",
        muscles: ["quads", "glutes", "calves"],
        start: t(3, "18:05"),
        dist: 24800,
        dur: 4100,
        hr: 132,
        kcal: 690,
      },
    ],
  };
}
